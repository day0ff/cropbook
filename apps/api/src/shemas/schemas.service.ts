import { Injectable } from '@nestjs/common';
import { BooksDbService } from '../books/books-db.service';
import { BooksService } from '../books/books.service';
import type { TaskType, MetaDataType } from '@cropbook/shared/types';

@Injectable()
export class SchemasService {
  constructor(
    private readonly booksDb: BooksDbService,
    private readonly booksService: BooksService,
  ) {}

  async getSchemas(
    bookName: string,
    mask: string,
    page = 1,
    limit = 20,
  ): Promise<{
    items: TaskType[];
    total: number;
    page: number;
    limit: number;
  }> {
    const normalized = this.booksService.normalizeBookName(bookName);
    const { items, total } = await this.booksDb.getSchemas(
      normalized,
      mask,
      page,
      limit,
    );
    return { items, total, page, limit };
  }

  async createTask(
    bookName: string,
    mask: string,
    data: Omit<TaskType, 'orderNumber'>,
  ) {
    const normalized = this.booksService.normalizeBookName(bookName);
    return this.booksDb.createTask(normalized, mask, data);
  }

  async getTask(bookName: string, mask: string, orderNumber: number) {
    const normalized = this.booksService.normalizeBookName(bookName);
    return this.booksDb.getTask(normalized, mask, orderNumber);
  }

  async updateTask(
    bookName: string,
    mask: string,
    orderNumber: number,
    patch: Partial<Omit<TaskType, 'orderNumber'>>,
  ) {
    const normalized = this.booksService.normalizeBookName(bookName);
    const updated = await this.booksDb.updateTask(
      normalized,
      mask,
      orderNumber,
      patch,
    );

    // Reflect isCompleted/isVerified changes in metadata entries for all
    // exercises referenced by the task.
    try {
      const metadata = await this.booksDb.getMetadataByMask(normalized, mask);

      for (const key of updated.exercise) {
        const existing = metadata[key];
        if (!existing) continue;

        const updatedMeta: MetaDataType = {
          ...existing,
          isCompleted: updated.isCompleted,
          isVerified: updated.isVerified,
        };

        await this.booksDb.saveMetadata(normalized, mask, key, updatedMeta);
      }
    } catch (err) {
      // If metadata update fails, don't block the main task update.
    }

    return updated;
  }

  async deleteTask(bookName: string, mask: string, orderNumber: number) {
    const normalized = this.booksService.normalizeBookName(bookName);
    return this.booksDb.deleteTask(normalized, mask, orderNumber);
  }
}
