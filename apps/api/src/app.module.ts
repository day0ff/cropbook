import { Module } from '@nestjs/common';
import { BooksModule } from './books';
import { SchemasModule } from './shemas/schemas.module';
import { OcrModule } from './ocr/ocr.module';
import { SheetModule } from 'src/sheet/sheet.module';

@Module({
  imports: [BooksModule, SchemasModule, OcrModule, SheetModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
