import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

export class MaskDto {
  @IsString()
  start!: string;

  @IsString()
  end!: string;
}

export class CreateOcrMetadataDto {
  @ValidateNested()
  @Type(() => MaskDto)
  masks!: MaskDto;
}
