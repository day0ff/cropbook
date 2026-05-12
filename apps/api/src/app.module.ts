import { Module } from '@nestjs/common';
import { BooksModule } from 'src/books';

@Module({
  imports: [BooksModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
