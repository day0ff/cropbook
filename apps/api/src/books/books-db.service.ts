import { Injectable, OnModuleInit } from '@nestjs/common';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import * as path from 'path';
import { promises as fs } from 'fs';
import {
  BookUploadProgress,
  MetaDataType,
  SchemasType,
  TaskType,
} from '@cropbook/shared/types';

interface BookRecord {
  name: string;
  pages: number;
}

interface BooksDb {
  books: BookRecord[];
  progress: Record<string, BookUploadProgress>;
  metadata: Record<string, Record<string, Record<string, MetaDataType>>>;
  schemas: SchemasType;
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
    this.db = new Low<BooksDb>(adapter, {
      books: [],
      progress: {},
      metadata: {},
      schemas: {},
    });
    await this.db.read();

    if (!this.db.data) {
      this.db.data = {
        books: [],
        progress: {},
        metadata: {},
        schemas: {},
      };
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

  async saveMetadata(
    bookName: string,
    regexp: string,
    key: string,
    metadata: MetaDataType,
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (!this.db.data.metadata[bookName]) {
      this.db.data.metadata[bookName] = {};
    }

    if (!this.db.data.metadata[bookName][regexp]) {
      this.db.data.metadata[bookName][regexp] = {};
    }

    this.db.data.metadata[bookName][regexp][key] = metadata;
    await this.db.write();
  }

  async getMetadata(
    bookName: string,
  ): Promise<Record<string, Record<string, MetaDataType>>> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.data.metadata[bookName] ?? {};
  }

  async saveSchemas(
    bookName: string,
    mask: string,
    items: Array<TaskType>,
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (!this.db.data.schemas[bookName]) {
      this.db.data.schemas[bookName] = {} as any;
    }

    this.db.data.schemas[bookName][mask] = items;
    await this.db.write();
  }

  async getSchemas(
    bookName: string,
    mask: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: Array<TaskType>; total: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const all = this.db.data.schemas[bookName]?.[mask] ?? [];
    const sorted = [...all].sort((a, b) => a.orderNumber - b.orderNumber);
    const total = sorted.length;
    const start = (page - 1) * limit;
    const items = sorted.slice(start, start + limit);
    return { items, total };
  }

  async createTask(
    bookName: string,
    mask: string,
    task: Omit<TaskType, 'orderNumber'>,
  ): Promise<TaskType> {
    if (!this.db) throw new Error('Database not initialized');

    if (!this.db.data.schemas[bookName]) {
      this.db.data.schemas[bookName] = {} as any;
    }

    if (!this.db.data.schemas[bookName][mask]) {
      this.db.data.schemas[bookName][mask] = [] as TaskType[];
    }

    const list = this.db.data.schemas[bookName][mask];
    const maxOrder = list.reduce(
      (max: number, t: TaskType) => Math.max(max, t.orderNumber),
      0,
    );
    const newOrder = maxOrder + 1;
    const newTask: TaskType = {
      orderNumber: newOrder,
      isCompleted: task.isCompleted,
      isVerified: task.isVerified,
      exercise: task.exercise,
      date: task.date,
      notes: task.notes,
    };

    list.push(newTask);
    await this.db.write();
    return newTask;
  }

  async getTask(
    bookName: string,
    mask: string,
    orderNumber: number,
  ): Promise<TaskType | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.data.schemas[bookName]?.[mask]?.find(
      (task) => task.orderNumber === orderNumber,
    );
  }

  async updateTask(
    bookName: string,
    mask: string,
    orderNumber: number,
    patch: Partial<Omit<TaskType, 'orderNumber'>>,
  ): Promise<TaskType> {
    if (!this.db) throw new Error('Database not initialized');

    const list = this.db.data.schemas[bookName]?.[mask] ?? [];
    const idx = list.findIndex((t) => t.orderNumber === orderNumber);
    if (idx < 0) {
      throw new Error('Task not found');
    }

    const existing = list[idx];
    const updated: TaskType = {
      ...existing,
      isCompleted: patch.isCompleted ?? existing.isCompleted,
      isVerified: patch.isVerified ?? existing.isVerified,
      exercise: patch.exercise ?? existing.exercise,
      date: patch.date ?? existing.date,
      notes: patch.notes ?? existing.notes,
    };

    list[idx] = updated;
    await this.db.write();
    return updated;
  }

  async deleteTask(
    bookName: string,
    mask: string,
    orderNumber: number,
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const list = this.db.data.schemas[bookName]?.[mask] ?? [];
    const idx = list.findIndex((task) => task.orderNumber === orderNumber);
    if (idx < 0) {
      throw new Error('Task not found');
    }

    list.splice(idx, 1);
    await this.db.write();
  }

  async getBookMasks(bookName: string): Promise<Array<string>> {
    const metadata = await this.getMetadata(bookName);

    return Object.keys(metadata);
  }

  async getMetadataByMask(
    bookName: string,
    mask: string,
  ): Promise<Record<string, MetaDataType>> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.data.metadata[bookName][mask] ?? {};
  }

  async deleteBook(name: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.db.data.books = this.db.data.books.filter(
      (book) => book.name !== name,
    );
    await this.db.write();
  }
}
