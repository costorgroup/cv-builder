import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  NotEquals,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** An embed's setup; the lists and objects are checked by the service. */
export class EmbedConfigDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsArray()
  allowedOrigins?: unknown[];

  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  templateIds?: unknown[];

  @IsOptional()
  @IsArray()
  sections?: unknown[];

  @IsOptional()
  @IsArray()
  features?: unknown[];

  @IsOptional()
  @IsBoolean()
  disabled?: boolean;
}

export class LaunchEmbedDto {
  @ApiProperty({ example: 'pk_3f1c…', description: "The embed's public key." })
  @IsString()
  @Matches(/^pk_[0-9a-f]{24}$/, { message: 'publicKey is not an embed key' })
  publicKey: string;

  @ApiProperty({
    example: 'user_8412',
    description:
      'Your own id for the person. The same id always reaches the same CVs.',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'externalUserId is required' })
  @MaxLength(200)
  // Reserved for owners' previews.
  @NotEquals('cvb-preview', {
    message: 'externalUserId "cvb-preview" is reserved',
  })
  externalUserId: string;

  @ApiPropertyOptional({ example: 'ana@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: 'Ana Petrović' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  name?: string;
}

export class ExchangeEmbedDto {
  @IsString()
  @Matches(/^pk_[0-9a-f]{24}$/)
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  launchToken: string;
}
