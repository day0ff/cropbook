import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { promises as fs } from 'fs';
import { BooksDbService } from '../books/books-db.service';
import { MetaDataType, ProcessingType } from '@cropbook/shared/types';
import { CreateOcrMetadataDto } from './dto/create-ocr-metadata.dto';
import { Observable, Subject } from 'rxjs';

const execFileAsync = promisify(execFile);

interface OcrResultBlock {
  bbox: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ];
  text: string;
  confidence: number;
}

interface MatchResult {
  text: string;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly jobs = new Map<
    string,
    Subject<ProcessingType<Record<string, MetaDataType>>>
  >();

  constructor(private readonly booksDb: BooksDbService) {}

  async *extractAndSaveMetadata(
    bookName: string,
    dto: CreateOcrMetadataDto,
  ): AsyncGenerator<ProcessingType<Record<string, MetaDataType>>> {
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );

    const bookRecord = await this.booksDb.getBook(normalizedBookName);

    if (!bookRecord) {
      throw new NotFoundException(`Book not found: ${normalizedBookName}`);
    }

    const bookDir = this.getBookDirectory(normalizedBookName);

    await this.ensureBookExists(bookDir);

    const startRegex = this.buildRegex(dto.masks.start);
    const endRegex = this.buildRegex(dto.masks.end);

    try {
      const totalLength = bookRecord.pages.toString().length;

      let metadataCombined: Record<string, MetaDataType> = {};

      for (let page = 7; page <= bookRecord.pages; page += 1) {
        const formattedPage = page.toString().padStart(totalLength, '0');

        const pageFile = path.join(bookDir, `page-${formattedPage}.png`);

        if (!(await this.fileExists(pageFile))) {
          continue;
        }

        // Emit progress
        yield {
          type: 'progress',
          data: {
            total: bookRecord.pages,
            current: page,
          },
        };

        const metadataItems = await this.extractPageMetadata(
          pageFile,
          page,
          startRegex,
          endRegex,
        );

        for (const metadata of metadataItems) {
          await this.booksDb.saveMetadata(
            normalizedBookName,
            metadata.key,
            metadata.value,
          );
        }

        if (metadataItems.length > 0) {
          const savedMetaData =
            await this.booksDb.getMetadata(normalizedBookName);

          metadataCombined = {
            ...metadataCombined,
            ...savedMetaData,
          };
        }
      }

      // Emit final result
      yield {
        type: 'completed',
        data: metadataCombined,
      };
    } catch (error) {
      this.logger.error(
        `OCR extraction failed: ${error}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        `OCR extraction failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async extractPageMetadata(
    pageFile: string,
    page: number,
    startRegex: RegExp,
    endRegex: RegExp,
  ): Promise<Array<{ key: string; value: MetaDataType }>> {
    const ocrBlocks = await this.runPaddleOcr(pageFile);

    const matches: Array<{
      type: 'start' | 'end';
      result: MatchResult;
    }> = [];

    for (const block of ocrBlocks) {
      const startMatch = this.matchBlock(block, startRegex);
      if (startMatch) {
        matches.push({ type: 'start', result: startMatch });
      }

      const endMatch = this.matchBlock(block, endRegex);
      if (endMatch) {
        matches.push({ type: 'end', result: endMatch });
      }
    }

    const metadataItems: Array<{ key: string; value: MetaDataType }> = [];
    const pendingStarts: MatchResult[] = [];

    for (const match of matches) {
      if (match.type === 'start') {
        pendingStarts.push(match.result);
        continue;
      }

      if (pendingStarts.length > 0) {
        const startResult = pendingStarts.shift()!;
        metadataItems.push({
          key: startResult.text,
          value: {
            page,
            top: startResult.top,
            left: startResult.left,
            right: match.result.right,
            bottom: match.result.bottom,
          },
        });
      }
    }

    return metadataItems;
  }

  private matchBlock(
    block: OcrResultBlock,
    regex: RegExp,
  ): MatchResult | undefined {
    const match = regex.exec(block.text);

    if (!match) {
      return undefined;
    }

    const matchText = match[0];

    // Compute bounding box from the 4 points
    const xs = block.bbox.map((p) => p[0]);
    const ys = block.bbox.map((p) => p[1]);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);

    return {
      text: matchText,
      top,
      left,
      bottom,
      right,
    };
  }

  private async runPaddleOcr(imagePath: string): Promise<OcrResultBlock[]> {
    try {
      const scriptPath = path.resolve(process.cwd(), 'python/ocr_runner.py');

      const { stdout } = await execFileAsync(
        'python3',
        [scriptPath, imagePath],
        {
          maxBuffer: 1024 * 1024 * 50,
        },
      );

      return JSON.parse(stdout);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(`OCR failed for ${imagePath}`);
    }
  }

  private buildRegex(value: string): RegExp {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Mask patterns must be non-empty strings.');
    }

    try {
      return new RegExp(value);
    } catch (error) {
      throw new BadRequestException(
        `Invalid regular expression: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    return !!(await fs.stat(filePath).catch(() => null));
  }

  private getBookDirectory(bookName: string): string {
    return path.join(this.booksRoot, bookName);
  }

  private get booksRoot(): string {
    return path.resolve(
      process.cwd(),
      process.env.API_STORAGE ?? '../../storage',
      'books',
    );
  }

  private async ensureBookExists(bookDir: string): Promise<void> {
    const stat = await fs.stat(bookDir).catch(() => null);

    if (!stat?.isDirectory()) {
      throw new NotFoundException('Book not found');
    }
  }

  private normalizeBookName(name: string): string {
    const original = name.trim().replace(/\.[^.]+$/, '');
    return (
      original.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_') || 'book'
    );
  }

  async startJob(bookName: string, dto: CreateOcrMetadataDto): Promise<void> {
    const normalizedBookName = this.normalizeBookName(bookName);

    if (this.jobs.has(normalizedBookName)) {
      throw new BadRequestException('OCR already running for this book');
    }

    const subject = new Subject<ProcessingType<Record<string, MetaDataType>>>();

    this.jobs.set(normalizedBookName, subject);

    try {
      for await (const event of this.extractAndSaveMetadata(
        normalizedBookName,
        dto,
      )) {
        subject.next(event);
      }

      subject.complete();
    } catch (error) {
      subject.error(error);
    } finally {
      this.jobs.delete(normalizedBookName);
    }
  }

  getJobStream(bookName: string) {
    const normalizedBookName = this.normalizeBookName(bookName);

    const subject = this.jobs.get(normalizedBookName);

    if (!subject) {
      throw new NotFoundException('OCR job not found');
    }

    return subject.asObservable();
  }
}
