import { IsOptional, IsPositive } from 'class-validator';

export class GetSchemasQuery {
  @IsOptional()
  @IsPositive()
  page?: number;

  @IsOptional()
  @IsPositive()
  limit?: number;
}
