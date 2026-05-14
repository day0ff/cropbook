import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { MetaDataType } from '@cropbook/shared';
import { A4_HEIGHT, A4_WIDTH, GAP, PAGE_PADDING } from './constants';
import { CreateSheetOptions } from './types';
import { BooksDbService } from 'src/books/books-db.service';

type CropResult = {
  buffer: Buffer;
  width: number;
  height: number;
};

type BookRecord = {
  name: string;
  pages: number;
} | undefined;

@Injectable()
export class SheetService {
  private readonly storagePath = path.resolve(
    process.cwd(),
    process.env.API_STORAGE ?? '../../storage',
    'books',
  );

  constructor(private readonly booksDb: BooksDbService) {}

  private normalizeBookName(name: string): string {
    const original = name.trim().replace(/\.[^.]+$/, '');

    return (
      original.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_') || 'book'
    );
  }

  async createA4Sheet(options: CreateSheetOptions): Promise<Buffer | string> {
    const {
      bookName,
      regexp,
      items,
      outputFileName = 'sheet.png',
      returnBuffer = false,
    } = options;
    const normalizedBookName = this.normalizeBookName(
      decodeURIComponent(bookName),
    );
    const bookRecord = await this.booksDb.getBook(normalizedBookName);
    const metaData = await this.booksDb.getMetadataByMask(
      normalizedBookName,
      regexp,
    );
    const metaDataItems = items.map((item) => metaData[item]).filter((item) => !!item);

    const crops = await this.cropAll(bookRecord, metaDataItems);

    const resultBuffer = await this.composeA4(crops);

    if (returnBuffer) {
      return resultBuffer;
    }

    const outputPath = path.join(this.storagePath, bookName, outputFileName);

     // await fs.writeFile(outputPath, resultBuffer);

    return outputPath;
  }

  private async cropAll(
    bookRecord: BookRecord,
    items: MetaDataType[],
  ): Promise<CropResult[]> {
    return Promise.all(items.map((item) => this.cropSingle(bookRecord, item)));
  }

  private async cropSingle(
    bookRecord: BookRecord,
    item: MetaDataType,
  ): Promise<CropResult> {
    const pageName = `page-${String(item.page).padStart(bookRecord?.pages.toString().length ?? 0, '0')}.png`;

    const pagePath = path.join(this.storagePath, bookRecord?.name ?? '', pageName);

    const width = item.right - item.left;
    const height = item.bottom - item.top;

    const buffer = await sharp(pagePath)
      .extract({
        left: Math.round(item.left),
        top: Math.round(item.top),
        width: Math.round(width),
        height: Math.round(height),
      })
      .png()
      .toBuffer();

    return {
      buffer,
      width,
      height,
    };
  }

  private async composeA4(items: CropResult[]): Promise<Buffer> {
    const composites: sharp.OverlayOptions[] = [];

    let x = PAGE_PADDING;
    let y = PAGE_PADDING;
    let height = A4_HEIGHT;
    let rowHeight = 0;

    for (const item of items) {
      // if (x + item.width > A4_WIDTH - PAGE_PADDING) {
      //   x = PAGE_PADDING;
      //   y += rowHeight + GAP;
      //   rowHeight = 0;
      // }

      x = PAGE_PADDING;
      y += rowHeight + GAP;
      rowHeight = 0;

      if (y + item.height > height - PAGE_PADDING) {
        height += item.height + PAGE_PADDING;
      }

      composites.push({
        input: item.buffer,
        left: x,
        top: y,
      });

      // x += item.width + GAP;

      rowHeight = Math.max(rowHeight, item.height);
    }

    return sharp({
      create: {
        width: A4_WIDTH,
        height,
        channels: 4,
        background: '#ffffff',
      },
    })
      .composite(composites)
      .png()
      .toBuffer();
  }
}
