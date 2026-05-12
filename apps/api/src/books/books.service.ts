import { promises as fs } from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BookPage, BookDetail, BookSummary } from '@cropbook/shared/types';

const execFileAsync = promisify(execFile);

@Injectable()
export class BooksService {
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

    try {
      await execFileAsync('pdftoppm', [
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
      ]);
    } catch (error) {
      throw new InternalServerErrorException(
        `PDF conversion failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    } finally {
      // remove original PDF (saves disk space)
      await fs.unlink(inputPath).catch(() => undefined);
    }

    // 3. Read results (ONLY filenames, no buffers = faster)
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

    return {
      bookName: normalizedBookName,
      pageCount: pages.length,
      pages,
    };
  }

  async listBooks(): Promise<BookSummary[]> {
    await fs.mkdir(this.booksRoot, { recursive: true });

    const entries = await fs.readdir(this.booksRoot, {
      withFileTypes: true,
    });

    return Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map(async (entry) => {
          const dir = path.join(this.booksRoot, entry.name);

          const files = await fs.readdir(dir);

          return {
            bookName: entry.name,
            pageCount: files.filter((f) => f.endsWith('.png')).length,
          };
        }),
    );
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

    const pages: BookPage[] = pageFiles.map((fileName, index) => ({
      bookName: normalizedBookName,
      pageNumber: index + 1,
      fileName,
      url: `/books/${encodeURIComponent(
        normalizedBookName,
      )}/pages/${index + 1}`,
    }));

    return {
      bookName: normalizedBookName,
      pageCount: pages.length,
      pages,
    };
  }

  async getPageFilePath(bookName: string, pageNumber: number): Promise<string> {
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );

    const bookDir = this.getBookDirectory(normalizedBookName);
    await this.ensureBookExists(bookDir);

    const filePath = path.join(bookDir, `${pageNumber}.png`);

    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new NotFoundException(
        `Page ${pageNumber} not found in "${normalizedBookName}"`,
      );
    }
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

  private normalizeBookName(name: string): string {
    const original = name.trim().replace(/\.[^.]+$/, '');
    return (
      original.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_') || 'book'
    );
  }
}
