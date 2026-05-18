import { Module } from '@nestjs/common';
import { SchemasController } from './schemas.controller';
import { BooksModule } from '../books/books.module';
import { SchemasService } from './schemas.service';

@Module({
  imports: [BooksModule],
  controllers: [SchemasController],
  providers: [SchemasService],
  exports: [SchemasService],
})
export class SchemasModule {}
