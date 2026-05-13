import {
  ArrayMinSize,
  IsArray,
  IsString,
} from 'class-validator';

export class CreateSheetDto {
  @IsString()
  outputFileName!: string;

  @IsArray()
  @ArrayMinSize(1)
  items!: string[];
}
