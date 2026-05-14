import { IsString } from 'class-validator';

export class CreateOcrMetadataDto {
  @IsString()
  anchor!: string;

  @IsString()
  pages?: string;
}
