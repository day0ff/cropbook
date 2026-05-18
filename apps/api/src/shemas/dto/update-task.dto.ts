import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsISO8601,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exercise?: Array<string>;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
