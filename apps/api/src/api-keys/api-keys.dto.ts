import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateApiKeyDto {
  /** What it's for, e.g. "Careers site". */
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(60)
  name: string;

  /** Checked against the scope list by the service. */
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  scopes: string[];

  /** Left out for a key that doesn't expire. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;
}
