import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { promises as fs } from 'fs';
import { Subject } from 'rxjs';

import { BooksDbService } from '../books/books-db.service';
import { MetaDataType, ProcessingType } from '@cropbook/shared/types';
import { parsePages } from 'src/helpers';

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

  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface ExerciseAnchor {
  key: string;

  left: number;
  top: number;
  right: number;
  bottom: number;
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
    anchor: RegExp,
    pages?: string,
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

    const targetPages: number[] = parsePages(pages ?? `1-${bookRecord.pages}`);

    const validPages = targetPages.filter((page) => page <= bookRecord.pages);

    try {
      const totalLength = bookRecord.pages.toString().length;

      let metadataCombined: Record<string, MetaDataType> = {};
      let current = 0;

      for (const page of validPages) {
        const formattedPage = page.toString().padStart(totalLength, '0');
        const pageFile = path.join(bookDir, `page-${formattedPage}.png`);

        current += 1;

        if (!(await this.fileExists(pageFile))) {
          continue;
        }

        yield {
          type: 'progress',
          data: {
            total: validPages.length,
            current,
          },
        };

        const metadataItems = await this.extractPageMetadata(
          pageFile,
          page,
          anchor,
        );

        for (const metadata of metadataItems) {
          await this.booksDb.saveMetadata(
            normalizedBookName,
            anchor.source,
            metadata.key.match(anchor)?.[0] ?? '',
            metadata.value,
          );
        }

        if (metadataItems.length > 0) {
          const savedMetadata = await this.booksDb.getMetadataByMask(
            normalizedBookName,
            anchor.source,
          );

          metadataCombined = {
            ...metadataCombined,
            ...savedMetadata,
          };
        }
      }

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
    anchor: RegExp,
  ): Promise<Array<{ key: string; value: MetaDataType }>> {
    const blocks = await this.runPaddleOcr(pageFile);

    // Sort visually
    blocks.sort((a, b) => {
      const yDiff = a.top - b.top;

      if (Math.abs(yDiff) > 15) {
        return yDiff;
      }

      return a.left - b.left;
    });

    const anchors = this.detectExerciseAnchors(blocks, anchor);

    const metadataItems: Array<{
      key: string;
      value: MetaDataType;
    }> = [];

    for (let i = 0; i < anchors.length; i += 1) {
      const anchor = anchors[i];

      const nextAnchor = anchors[i + 1];

      const region = this.buildExerciseRegion(anchor, nextAnchor, blocks, page);

      metadataItems.push({
        key: anchor.key,
        value: region,
      });
    }

    return metadataItems;
  }

  private detectExerciseAnchors(
    blocks: OcrResultBlock[],
    regexp: RegExp,
  ): ExerciseAnchor[] {
    return blocks
      .filter((block) => regexp.test(block.text.trim()))
      .map((block) => ({
        key: block.text.trim(),

        left: block.left,
        top: block.top,
        right: block.right,
        bottom: block.bottom,
      }))
      .sort((a, b) => a.top - b.top);
  }

  /**
   * Build visual exercise region.
   *
   * Strategy:
   * - starts at current anchor
   * - ends before next anchor
   * - groups nearby OCR blocks
   */
  private buildExerciseRegion(
    anchor: ExerciseAnchor,
    nextAnchor: ExerciseAnchor | undefined,
    blocks: OcrResultBlock[],
    page: number,
  ): MetaDataType {
    const verticalPadding = 40;

    const topBoundary = anchor.top - verticalPadding;

    const bottomBoundary = nextAnchor ? nextAnchor.top - 10 : anchor.top + 250;

    const relatedBlocks = blocks.filter((block) => {
      if (block.confidence < 0.4) {
        return false;
      }

      return block.top >= topBoundary && block.bottom <= bottomBoundary;
    });

    if (relatedBlocks.length === 0) {
      return {
        page,

        left: anchor.left,
        top: anchor.top,
        right: anchor.right,
        bottom: anchor.bottom,
      };
    }

    const left = Math.min(...relatedBlocks.map((b) => b.left));

    const top = Math.min(...relatedBlocks.map((b) => b.top));

    const right = Math.max(...relatedBlocks.map((b) => b.right));

    const bottom = Math.max(...relatedBlocks.map((b) => b.bottom));

    return {
      page,

      left,
      top,
      right,
      bottom,
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

  async startJob(
    bookName: string,
    anchor: string,
    pages?: string,
  ): Promise<void> {
    const normalizedBookName = this.normalizeBookName(bookName);
    const regex = this.buildRegex(anchor);

    if (this.jobs.has(normalizedBookName)) {
      throw new BadRequestException('OCR already running for this book');
    }

    const subject = new Subject<ProcessingType<Record<string, MetaDataType>>>();

    this.jobs.set(normalizedBookName, subject);

    try {
      for await (const event of this.extractAndSaveMetadata(
        normalizedBookName,
        regex,
        pages,
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
}
