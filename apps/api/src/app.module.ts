import { Module } from '@nestjs/common';
import { BooksModule } from './books';
import { OcrModule } from './ocr/ocr.module';

@Module({
  imports: [BooksModule, OcrModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
