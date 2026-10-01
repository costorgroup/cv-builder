import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * What the public API returns, described for its reference. Only used by
 * the docs; the controllers build the same shapes.
 */

export class V1Error {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({
    type: String,
    example: 'This API key needs the cv:create scope.',
    description: 'A list of messages, one per field, for invalid input.',
  })
  message: string | string[];

  @ApiPropertyOptional({
    enum: ['PLAN_FEATURE_REQUIRED', 'PLAN_LIMIT_REACHED'],
    description: "Set when the plan doesn't allow it.",
  })
  code?: string;
}

export class V1Cv {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Product designer, 2026' })
  name: string;

  @ApiProperty({ nullable: true, example: 'modern', type: String })
  templateId: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'The CV content: personal information, work experience, education, skills and so on.',
  })
  data: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: {
      templateId: 'modern',
      colorSchemeId: 'ocean',
      fontId: 'inter',
      fontScale: 1,
      sizes: {},
    },
    description:
      'How it looks. Missing fields get the template defaults; see GET /v1/templates for ids.',
  })
  appearance: Record<string, unknown>;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class V1CvPage {
  @ApiProperty({ type: [V1Cv] })
  items: V1Cv[];

  @ApiProperty({ example: 3 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 12 })
  pageSize: number;

  @ApiProperty({ example: 1 })
  pageCount: number;
}

export class V1ColorScheme {
  @ApiProperty({ example: 'ocean' })
  id: string;

  @ApiProperty({ example: 'Ocean' })
  name: string;
}

export class V1Template {
  @ApiProperty({ example: 'modern' })
  id: string;

  @ApiProperty({ example: 'Modern' })
  name: string;

  @ApiProperty({ nullable: true, example: 'Modern', type: String })
  category: string | null;

  @ApiProperty({ enum: ['FREE', 'PREMIUM'] })
  tier: string;

  @ApiProperty({ description: "Whether the key's plan can use it." })
  available: boolean;

  @ApiProperty({
    type: [V1ColorScheme],
    description: 'The first is the default.',
  })
  colorSchemes: V1ColorScheme[];
}

export class V1UsageValue {
  @ApiProperty({ example: 2 })
  used: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Null means unlimited.',
    example: 10,
  })
  max: number | null;
}

export class V1UsageValues {
  @ApiProperty({ type: V1UsageValue })
  cvs: V1UsageValue;

  @ApiProperty({ type: V1UsageValue, description: 'In bytes.' })
  storageBytes: V1UsageValue;

  @ApiProperty({ type: V1UsageValue })
  pdfsThisMonth: V1UsageValue;

  @ApiProperty({ type: V1UsageValue })
  apiRequestsThisMonth: V1UsageValue;
}

export class V1Plan {
  @ApiProperty({ example: 'premium' })
  key: string;

  @ApiProperty({ example: 'Premium' })
  name: string;
}

export class V1Usage {
  @ApiProperty({ type: V1Plan })
  plan: V1Plan;

  @ApiProperty({ type: V1UsageValues })
  usage: V1UsageValues;
}
