import type { Response } from 'express';
import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { CreateSheetDto } from './dto/create-sheet.dto';
import { SheetService } from './sheet.service';

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
}
