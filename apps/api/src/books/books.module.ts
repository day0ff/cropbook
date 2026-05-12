import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
