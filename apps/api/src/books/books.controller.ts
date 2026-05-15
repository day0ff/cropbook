import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  BookDetail,
  BookSummary,
  BookUploadProgress,
  MetaDataType,
} from '@cropbook/shared/types';
import { BooksService } from './books.service';
import { BooksDbService } from './books-db.service';
import { UpdatePageMetadataDto } from './dto/update-page-metadata.dto';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly booksDb: BooksDbService,
  ) {}

  private buildBookIconUrl(req: Request, bookName: string): string {
    const host = req.get('host') ?? 'localhost';
    return `${req.protocol}://${host}/api/books/${encodeURIComponent(
      bookName,
    )}/icon`;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadBook(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') bookName?: string,
  ): Promise<BookDetail> {
    if (!file) {
      throw new BadRequestException('A PDF file is required.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are accepted.');
    }

    return this.booksService.uploadBook(file, bookName);
  }

  @Get()
  async listBooks(@Req() req: Request): Promise<BookSummary[]> {
    const books = await this.booksService.listBooks();

    return books.map((book) => ({
      ...book,
      iconUrl: this.buildBookIconUrl(req, book.name),
    }));
  }

  @Get(':bookName/icon')
  async getBookIcon(
    @Param('bookName') bookName: string,
    @Res() res: Response,
  ): Promise<void> {
    const iconPath = await this.booksService.getBookIconFilePath(bookName);
    res.type('image/png').sendFile(iconPath);
  }

  @Get(':bookName/status')
  async getBookUploadStatus(
    @Param('bookName') bookName: string,
  ): Promise<BookUploadProgress | undefined> {
    return this.booksService.getBookUploadProgress(bookName);
  }

  @Get(':bookName/pages/:pageNumber')
  async getPage(
    @Param('bookName') bookName: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Res() res: Response,
  ): Promise<void> {
    const pagePath = await this.booksService.getPageFilePath(
      bookName,
      pageNumber,
    );
    res.type('image/png').sendFile(pagePath);
  }

  @Get(':bookName')
  async getBook(@Param('bookName') bookName: string): Promise<BookDetail> {
    return this.booksService.getBook(bookName);
  }

  @Get(':bookName/pages/:pageNumber/metadata')
  async getPageMetadata(
    @Param('bookName') bookName: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
  ): Promise<{
    masks: string[];
    metadataByMask: Record<string, Array<{ key: string; value: MetaDataType }>>;
  }> {
    const normalizedBookName = this.booksService.normalizeBookName(bookName);
    const masks = await this.booksDb.getBookMasks(normalizedBookName);
    const metadataByMask: Record<
      string,
      Array<{ key: string; value: MetaDataType }>
    > = {};

    for (const mask of masks) {
      const metadata = await this.booksDb.getMetadataByMask(
        normalizedBookName,
        mask,
      );
      metadataByMask[mask] = Object.entries(metadata)
        .filter(([, value]) => value.page === pageNumber)
        .map(([key, value]) => ({ key, value }));
    }

    return {
      masks,
      metadataByMask,
    };
  }

  @Put(':bookName/pages/:pageNumber/metadata')
  async updatePageMetadata(
    @Param('bookName') bookName: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() dto: UpdatePageMetadataDto,
  ): Promise<{ success: boolean }> {
    const normalizedBookName = this.booksService.normalizeBookName(bookName);

    if (dto.metadata.page !== pageNumber) {
      throw new BadRequestException('Metadata page mismatch.');
    }

    await this.booksDb.saveMetadata(
      normalizedBookName,
      dto.mask,
      dto.key,
      dto.metadata,
    );

    return { success: true };
  }

  @Post(':bookName/abort')
  async abortBookUpload(@Param('bookName') bookName: string): Promise<void> {
    return this.booksService.abortUpload(bookName);
  }
}
