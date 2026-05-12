import { promises as fs } from 'fs';
import * as path from 'path';
import { pdf } from 'pdf-to-img';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BookPage, BookDetail, BookSummary } from '@cropbook/shared/types';

@Injectable()
export class BooksService {
  private get booksRoot(): string {
    return path.resolve(process.cwd(), 'books');
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

    const document = await pdf(file.buffer);
    const pages: BookPage[] = [];
    let pageNumber = 1;

    for await (const pageBuffer of document) {
      const fileName = `${pageNumber}.png`;
      const filePath = path.join(bookDir, fileName);
      await fs.writeFile(filePath, pageBuffer);

      pages.push({
        bookName: normalizedBookName,
        pageNumber,
        fileName,
        url: `/books/${encodeURIComponent(normalizedBookName)}/pages/${pageNumber}`,
      });

      pageNumber += 1;
    }

    return {
      bookName: normalizedBookName,
      pageCount: document.length,
      pages,
    };
  }

  async listBooks(): Promise<BookSummary[]> {
    await fs.mkdir(this.booksRoot, { recursive: true });
    const entries = await fs.readdir(this.booksRoot, { withFileTypes: true });

    const books = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const pageFiles = await fs.readdir(
            path.join(this.booksRoot, entry.name),
          );
          return {
            bookName: entry.name,
            pageCount: pageFiles.filter((file) =>
              file.toLowerCase().endsWith('.png'),
            ).length,
          };
        }),
    );

    return books;
  }

  async getBook(bookName: string): Promise<BookDetail> {
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );
    const bookDir = this.getBookDirectory(normalizedBookName);
    await this.ensureBookExists(bookDir);

    const pageFiles = (await fs.readdir(bookDir)).filter((file) =>
      file.toLowerCase().endsWith('.png'),
    );
    const pages = pageFiles
      .sort(
        (a, b) =>
          Number(a.replace(/\.png$/i, '')) - Number(b.replace(/\.png$/i, '')),
      )
      .map((fileName) => {
        const pageNumber = Number(fileName.replace(/\.png$/i, ''));
        return {
          bookName: normalizedBookName,
          pageNumber,
          fileName,
          url: `/books/${encodeURIComponent(normalizedBookName)}/pages/${pageNumber}`,
        };
      });

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

    const pagePath = path.join(bookDir, `${pageNumber}.png`);
    try {
      await fs.access(pagePath);
      return pagePath;
    } catch {
      throw new NotFoundException(
        `Page ${pageNumber} for book "${normalizedBookName}" was not found.`,
      );
    }
  }

  private getBookDirectory(bookName: string): string {
    return path.join(this.booksRoot, bookName);
  }

  private async ensureBookExists(bookDir: string): Promise<void> {
    try {
      const stat = await fs.stat(bookDir);
      if (!stat.isDirectory()) {
        throw new NotFoundException('Book storage path is not a directory.');
      }
    } catch {
      throw new NotFoundException('Book was not found.');
    }
  }

  private normalizeBookName(name: string): string {
    const original = name.trim().replace(/\.[^.]+$/, '');
    const safe = original.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_');
    return safe || 'book';
  }
}
