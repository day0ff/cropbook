import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

@Module({
  imports: [BooksModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
