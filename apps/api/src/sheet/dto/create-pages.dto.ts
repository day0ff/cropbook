import {
  IsArray,
  IsString,
} from 'class-validator';

export class CreatePagesDto {
  @IsString()
  mask!: string;

  @IsArray()
  @IsString()
  pages!: string;
}
