import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BooksDbService } from './books-db.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [BooksController],
  providers: [BooksService, BooksDbService],
  exports: [BooksService, BooksDbService],
})
export class BooksModule {}
