import type { Response } from 'express';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { SheetService } from './sheet.service';
import { CreatePagesDto } from 'src/sheet/dto/create-pages.dto';

@Controller('books')
export class SheetController {
  constructor(private readonly imageSheetService: SheetService) {}

  @Post(':bookName/sheet/download')
  async downloadSheet(
    @Param('bookName') bookName: string,
    @Body() body: CreateSheetDto,
    @Res() res: Response,
  ) {
    const buffer = await this.imageSheetService.createA4Sheet({
      bookName,
      regexp: body.mask,
      items: body.items,
      returnBuffer: true,
    });

    res.setHeader('Content-Type', 'image/png');

    res.setHeader('Content-Disposition', 'attachment; filename="sheet.png"');

    res.send(buffer);
  }

  @Post(':bookName/pages/download')
  async downloadPages(
    @Param('bookName') bookName: string,
    @Body() body: CreatePagesDto,
    @Res() res: Response,
  ) {
    const buffer = await this.imageSheetService.createA4Pages({
      bookName,
      regexp: body.mask,
      pages: body.pages,
      returnBuffer: true,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="sheet.png"');
    res.send(buffer);
  }

  @Get(':bookName/pages/:pageNumber/sheet')
  async getPageSheet(
    @Param('bookName') bookName: string,
    @Param('pageNumber', ParseIntPipe) pageNumber: number,
    @Query('mask') mask: string,
    @Res() res: Response,
  ) {
    if (!mask) {
      throw new BadRequestException('Mask query parameter is required.');
    }

    const buffer = await this.imageSheetService.createA4Pages({
      bookName,
      regexp: mask,
      pages: String(pageNumber),
      returnBuffer: true,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="page-${pageNumber}-sheet.png"`,
    );
    res.send(buffer);
  }
}
