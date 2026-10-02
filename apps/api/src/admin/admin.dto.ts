import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PlatformRole,
  TemplateStatus,
  TemplateTier,
} from '../generated/prisma/client.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** "a,b" (or a repeated query parameter) as ["a", "b"]; empty parts dropped. */
const commaList = ({ value }: { value: unknown }) =>
  (Array.isArray(value) ? value : [value])
    .flatMap((each) => (typeof each === 'string' ? each.split(',') : [each]))
    .map((each) => (typeof each === 'string' ? each.trim() : each))
    .filter((each) => each !== '');

/** The most values one list filter takes. */
const MAX_FILTER_VALUES = 100;

export class ListUsersQuery {
  /** Matches the email or name. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Any of these, separated by commas; all when left out. */
  @IsOptional()
  @Transform(commaList)
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsIn(['active', 'disabled'], { each: true })
  status?: ('active' | 'disabled')[];

  /** Any of these, separated by commas; all when left out. */
  @IsOptional()
  @Transform(commaList)
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsIn(Object.values(PlatformRole), { each: true })
  role?: PlatformRole[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize = 25;
}

export class SetDisabledDto {
  @IsBoolean()
  disabled: boolean;
}

export class SetRoleDto {
  @IsIn(Object.values(PlatformRole))
  role: PlatformRole;
}

const PERIODS = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
const STATUSES = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
] as const;

const upperCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class ListSubscriptionsQuery {
  /** Any of these, separated by commas; all when left out. */
  @IsOptional()
  @Transform(commaList)
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsIn(STATUSES, { each: true })
  status?: (typeof STATUSES)[number][];

  /** Any of these plans, separated by commas; all when left out. */
  @IsOptional()
  @Transform(commaList)
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  planKey?: string[];

  /** Only ones paid through the payment provider. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize = 25;
}

/** One account's extras on top of its plan; checked against the registry. */
export class OverridesDto {
  @IsOptional()
  @IsArray()
  features?: unknown[];

  @IsOptional()
  @IsObject()
  limits?: Record<string, unknown>;
}

export class UpdatePlanDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  features?: unknown[];

  @IsOptional()
  @IsObject()
  limits?: Record<string, unknown>;
}

export class AddPriceDto {
  @IsIn(PERIODS)
  period: (typeof PERIODS)[number];

  @Transform(upperCase)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter code' })
  currency: string;

  /** In the currency's smallest unit, e.g. 999 for €9.99. */
  @IsInt()
  @Min(0)
  @Max(100_000_00)
  amountCents: number;
}

export class ListAuditLogsQuery {
  /** Any of these, separated by commas; all when left out. */
  @IsOptional()
  @Transform(commaList)
  @ArrayMaxSize(MAX_FILTER_VALUES)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  action?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  actorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  resourceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  resourceId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize = 50;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsIn(Object.values(TemplateTier))
  tier?: TemplateTier;

  @IsOptional()
  @IsIn(Object.values(TemplateStatus))
  status?: TemplateStatus;

  /** Empty clears it. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;
}
