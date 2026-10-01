import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ListCvsQuery {
  @ApiPropertyOptional({ description: 'Matches the CV name.', maxLength: 100 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ type: Number, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 48, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize = 12;
}

export class CreateCvDto {
  @ApiProperty({ maxLength: 120, example: 'Product designer, 2026' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(120)
  name: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'The CV content; {} for an empty CV.',
  })
  @IsObject()
  data: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { templateId: 'default' },
    description:
      'At least a templateId; other fields get the template defaults.',
  })
  @IsObject()
  appearance: Record<string, unknown>;
}

/** The editor's current state, for a PDF before (or without) saving. */
export class DraftCvPdfDto {
  /** The saved CV being edited, if any. */
  @IsOptional()
  @IsUUID()
  cvId?: string;

  @IsObject()
  data: Record<string, unknown>;

  @IsObject()
  appearance: Record<string, unknown>;
}

export class UpdateCvDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Replaces the content.',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Replaces the look; options the CV already had may stay.',
  })
  @IsOptional()
  @IsObject()
  appearance?: Record<string, unknown>;
}
