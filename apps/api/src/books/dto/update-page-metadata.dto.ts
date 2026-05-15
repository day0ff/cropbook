import { IsObject, IsString } from 'class-validator';
import type { MetaDataType } from '@cropbook/shared/types';

export class UpdatePageMetadataDto {
  @IsString()
  mask!: string;

  @IsString()
  key!: string;

  @IsObject()
  metadata!: MetaDataType;
}
