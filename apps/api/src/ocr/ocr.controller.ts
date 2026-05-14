import { Observable, map } from 'rxjs';
import { Body, Controller, Param, Post, Sse } from '@nestjs/common';
import {OcrService} from "./ocr.service";
import {CreateOcrMetadataDto} from "./dto/create-ocr-metadata.dto";

@Controller('books')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post(':bookName/ocr/metadata')
  async createOcrMetadata(
    @Param('bookName') bookName: string,
    @Body() dto: CreateOcrMetadataDto,
  ) {
    void this.ocrService.startJob(bookName, dto.anchor, dto.pages);

    return {
      success: true,
    };
  }

  @Sse(':bookName/ocr/events')
  streamProgress(
    @Param('bookName') bookName: string,
  ): Observable<MessageEvent> {
    return this.ocrService.getJobStream(bookName).pipe(
      map(
        (data) =>
          ({
            data,
          }) as MessageEvent,
      ),
    );
  }
}
