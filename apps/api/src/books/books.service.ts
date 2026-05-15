import { promises as fs } from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BookPage,
  BookDetail,
  BookSummary,
  BookUploadProgress,
} from '@cropbook/shared/types';
import { BooksDbService } from './books-db.service';

const execFileAsync = promisify(execFile);

@Injectable()
export class BooksService {
  constructor(private readonly booksDb: BooksDbService) {}

  private get booksRoot(): string {
    return path.resolve(
      process.cwd(),
      process.env.API_STORAGE ?? '../../storage',
      'books',
    );
  }

  async uploadBook(
    file: Express.Multer.File,
    bookName?: string,
  ): Promise<BookDetail> {
    const normalizedBookName = this.normalizeBookName(
      bookName ?? file.originalname,
    );

    const bookDir = this.getBookDirectory(normalizedBookName);
    await fs.mkdir(bookDir, { recursive: true });

    const inputPath = path.join(bookDir, 'input.pdf');
    await fs.writeFile(inputPath, file.buffer);

    const dpi = 300;
    const totalPages = await this.getPdfPageCount(inputPath).catch(() => 0);

    await this.booksDb.setProgress({
      bookName: normalizedBookName,
      totalPages,
      currentPage: 0,
    });

    await this.createBookIcon(inputPath, bookDir);

    let conversionComplete = false;

    try {
      const conversionPromise = execFileAsync('pdftoppm', [
        '-png',
        '-r',
        String(dpi),
        '-gray',
        '-aa',
        'yes',
        '-aaVector',
        'yes',
        inputPath,
        path.join(bookDir, 'page'),
      ]).finally(() => {
        conversionComplete = true;
      });

      const progressPromise = this.trackConversionProgress(
        bookDir,
        normalizedBookName,
        totalPages,
        () => conversionComplete,
      );

      await Promise.all([conversionPromise, progressPromise]);
    } catch (error) {
      throw new InternalServerErrorException(
        `PDF conversion failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    } finally {
      // remove original PDF (saves disk space)
      await fs.unlink(inputPath).catch(() => undefined);
      await this.booksDb
        .clearProgress(normalizedBookName)
        .catch(() => undefined);
    }

    const pageFiles = (await fs.readdir(bookDir))
      .filter((f) => f.endsWith('.png'))
      .sort((a, b) => this.extractPageNumber(a) - this.extractPageNumber(b));

    const pages: BookPage[] = pageFiles.map((fileName, index) => ({
      bookName: normalizedBookName,
      pageNumber: index + 1,
      fileName,
      url: `/books/${encodeURIComponent(
        normalizedBookName,
      )}/pages/${index + 1}`,
    }));

    await this.booksDb.addBook(normalizedBookName, pages.length - 1);

    return {
      bookName: normalizedBookName,
      pageCount: pages.length,
      pages,
    };
  }

  async listBooks(): Promise<BookSummary[]> {
    return this.booksDb.getAllBooks();
  }

  async getBookUploadProgress(
    bookName: string,
  ): Promise<BookUploadProgress | undefined> {
    return this.booksDb.getProgress(bookName);
  }

  async getBookIconFilePath(bookName: string): Promise<string> {
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );

    const bookDir = this.getBookDirectory(normalizedBookName);
    await this.ensureBookExists(bookDir);

    const iconPath = path.join(bookDir, 'icon.png');

    try {
      await fs.access(iconPath);
      return iconPath;
    } catch {
      throw new NotFoundException(`Icon not found for "${normalizedBookName}"`);
    }
  }

  normalizeBookName(name: string): string {
    return this.normalizeBookNameImpl(name);
  }

  private async createBookIcon(
    inputPath: string,
    bookDir: string,
  ): Promise<void> {
    const iconOutput = path.join(bookDir, 'icon');
    await execFileAsync('pdftoppm', [
      '-png',
      '-singlefile',
      '-scale-to-x',
      '200',
      '-scale-to-y',
      '300',
      '-gray',
      '-aa',
      'yes',
      '-aaVector',
      'yes',
      '-f',
      '1',
      '-l',
      '1',
      inputPath,
      iconOutput,
    ]);
  }

  private async trackConversionProgress(
    bookDir: string,
    bookName: string,
    totalPages: number,
    shouldStop: () => boolean,
  ): Promise<void> {
    let currentPage = 0;
    while (!shouldStop()) {
      const pageFiles = (await fs.readdir(bookDir)).filter((f) =>
        f.endsWith('.png'),
      );
      const nextPage = pageFiles.length;
      if (nextPage > currentPage) {
        currentPage = nextPage;
        await this.booksDb.setProgress({
          bookName,
          totalPages,
          currentPage,
        });
      }
      await this.delay(250);
    }

    const pageFiles = (await fs.readdir(bookDir)).filter((f) =>
      f.endsWith('.png'),
    );
    await this.booksDb.setProgress({
      bookName,
      totalPages,
      currentPage: pageFiles.length,
    });
  }

  private async getPdfPageCount(inputPath: string): Promise<number> {
    try {
      const { stdout } = await execFileAsync('pdfinfo', [inputPath]);
      const match = stdout.match(/^Pages:\s+(\d+)/m);
      return match ? Number(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getBook(bookName: string): Promise<BookDetail> {
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );

    const bookDir = this.getBookDirectory(normalizedBookName);
    await this.ensureBookExists(bookDir);

    const pageFiles = (await fs.readdir(bookDir))
      .filter((f) => f.endsWith('.png'))
      .sort((a, b) => this.extractPageNumber(a) - this.extractPageNumber(b));

    const pages: BookPage[] = pageFiles
      .filter((fileName) => !fileName.includes('icon'))
      .map((fileName, index) => ({
        bookName: normalizedBookName,
        pageNumber: index + 1,
        fileName,
        url: `/books/${encodeURIComponent(
          normalizedBookName,
        )}/pages/${index + 1}`,
      }));

    const masks: Array<string> =
      await this.booksDb.getBookMasks(normalizedBookName);

    return {
      bookName: normalizedBookName,
      pageCount: pages.length,
      iconUrl: `/books/${normalizedBookName}/icon`,
      masks,
      pages,
    };
  }

  async getPageFilePath(bookName: string, pageNumber: number): Promise<string> {
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );
    const bookDir = this.getBookDirectory(normalizedBookName);
    await this.ensureBookExists(bookDir);

    const bookRecord = await this.booksDb.getBook(normalizedBookName);

    if (!bookRecord) {
      throw new NotFoundException(`Book not found: ${normalizedBookName}`);
    }

    const totalLength = bookRecord.pages.toString().length;
    const formattedPage = pageNumber.toString().padStart(totalLength, '0');
    const pageFile = path.join(bookDir, `page-${formattedPage}.png`);

    try {
      await fs.access(pageFile);
      return pageFile;
    } catch {
      throw new NotFoundException(
        `Page ${pageNumber} not found in "${normalizedBookName}"`,
      );
    }
  }

  async abortUpload(bookName: string): Promise<void> {
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );

    const bookDir = this.getBookDirectory(normalizedBookName);

    try {
      await fs.rm(bookDir, { recursive: true, force: true });
    } catch {
      // ignore if folder doesn't exist
    }

    await this.booksDb.clearProgress(normalizedBookName).catch(() => undefined);
    await this.booksDb.deleteBook(normalizedBookName).catch(() => undefined);
  }

  private getBookDirectory(bookName: string): string {
    return path.join(this.booksRoot, bookName);
  }

  private async ensureBookExists(bookDir: string): Promise<void> {
    const stat = await fs.stat(bookDir).catch(() => null);

    if (!stat?.isDirectory()) {
      throw new NotFoundException('Book not found');
    }
  }

  private extractPageNumber(file: string): number {
    const match = file.match(/\d+/g);
    return match ? Number(match[match.length - 1]) : 0;
  }

  private normalizeBookNameImpl(name: string): string {
    const original = name.trim().replace(/\.[^.]+$/, '');
    return (
      original.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_') || 'book'
    );
  }
}
