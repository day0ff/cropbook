import { Module } from '@nestjs/common';
import { BooksModule } from './books';

@Module({
  imports: [BooksModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
