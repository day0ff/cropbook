import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSheetDto {
  @IsOptional()
  @IsString()
  outputFileName?: string;

  @IsString()
  mask!: string;

  @IsArray()
  @ArrayMinSize(1)
  items!: string[];

  @IsOptional()
  @IsBoolean()
  returnBuffer?: boolean;
}
