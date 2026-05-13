import { Module } from '@nestjs/common';
import { BooksModule } from './books';
import { OcrModule } from './ocr/ocr.module';
import { SheetModule } from 'src/sheet/sheet.module';

@Module({
  imports: [BooksModule, OcrModule, SheetModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
