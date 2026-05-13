import { Module } from '@nestjs/common';
import { BooksModule } from '../books';
import { SheetController } from './sheet.controller';
import { SheetService } from './sheet.service';

@Module({
  imports: [BooksModule],
  controllers: [SheetController],
  providers: [SheetService],
})
export class SheetModule {}
