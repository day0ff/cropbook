import { memoryStorage } from 'multer';
import type { Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  BookDetail,
  BookSummary,
  BookUploadProgress,
} from '@cropbook/shared/types';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

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
  async listBooks(): Promise<BookSummary[]> {
    return this.booksService.listBooks();
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

  @Post(':bookName/abort')
  async abortBookUpload(@Param('bookName') bookName: string): Promise<void> {
    return this.booksService.abortUpload(bookName);
  }
}
