import { Injectable, OnModuleInit } from '@nestjs/common';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import * as path from 'path';
import { promises as fs } from 'fs';
import { BookUploadProgress } from '@cropbook/shared/types';

interface BookRecord {
  name: string;
  pages: number;
}

interface BooksDb {
  books: BookRecord[];
  progress: Record<string, BookUploadProgress>;
}

@Injectable()
export class BooksDbService implements OnModuleInit {
  private db: Low<BooksDb> | null = null;

  private get dbPath(): string {
    const storagePath = process.env.API_STORAGE ?? '../../storage';
    const dbDir = path.resolve(process.cwd(), storagePath);
    return path.join(dbDir, 'books.json');
  }

  async onModuleInit(): Promise<void> {
    await this.initializeDb();
  }

  private async initializeDb(): Promise<void> {
    const dbDir = path.dirname(this.dbPath);
    await fs.mkdir(dbDir, { recursive: true });

    const adapter = new JSONFile<BooksDb>(this.dbPath);
    this.db = new Low<BooksDb>(adapter, { books: [], progress: {} });
    await this.db.read();

    if (!this.db.data) {
      this.db.data = { books: [], progress: {} };
    }
  }

  async addBook(name: string, pages: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existingIndex = this.db.data.books.findIndex(
      (book) => book.name === name,
    );

    if (existingIndex >= 0) {
      this.db.data.books[existingIndex] = { name, pages };
    } else {
      this.db.data.books.push({ name, pages });
    }

    await this.db.write();
  }

  async setProgress(progress: BookUploadProgress): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.db.data.progress[progress.bookName] = progress;
    await this.db.write();
  }

  async getProgress(bookName: string): Promise<BookUploadProgress | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.data.progress[bookName];
  }

  async clearProgress(bookName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    delete this.db.data.progress[bookName];
    await this.db.write();
  }

  async getAllBooks(): Promise<BookRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    return [...this.db.data.books];
  }

  async getBook(name: string): Promise<BookRecord | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.data.books.find((book) => book.name === name);
  }

  async deleteBook(name: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.db.data.books = this.db.data.books.filter(
      (book) => book.name !== name,
    );
    await this.db.write();
  }
}
