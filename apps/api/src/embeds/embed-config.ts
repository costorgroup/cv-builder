import { BadRequestException } from '@nestjs/common';
import {
  CV_EDITOR_STEPS,
  EMBED_FEATURES,
  findTemplateSpec,
  type TCvEditorStep,
  type TEmbedBranding,
  type TEmbedConfig,
  type TEmbedFeature,
  type TEmbedTheme,
  type TResolvedEmbedConfig,
  type TTemplateCatalog,
} from '@repo/cv-core';
import type { Entitlements } from '../entitlements/entitlements.js';
import type { EmbedConfig, Prisma } from '../generated/prisma/client.js';

/** Most origins one embed may be shown on. */
export const MAX_ALLOWED_ORIGINS = 20;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isLocalHost = (host: string) =>
  host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

/**
 * "https://careers.acme.com" as an origin, or why it isn't one. Only https,
 * except localhost for testing; no paths, wildcards or trailing slashes.
 */
export const normalizeOrigin = (input: string): string | { error: string } => {
  const trimmed = input.trim().replace(/\/+$/, '');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { error: `"${input}" isn't a web address` };
  }
  if (url.origin !== trimmed.toLowerCase() && url.origin !== trimmed) {
    return {
      error: `"${input}" must be just the origin, like https://example.com`,
    };
  }
  if (url.protocol !== 'https:' && !isLocalHost(url.hostname)) {
    return { error: `"${input}" must use https` };
  }
  return url.origin;
};

/** What owners may send for an embed, checked and cleaned. */
export const parseEmbedInput = (input: {
  allowedOrigins?: unknown;
  theme?: unknown;
  branding?: unknown;
  templateIds?: unknown;
  sections?: unknown;
  features?: unknown;
}) => {
  const errors: string[] = [];
  const data: Partial<
    Pick<
      Prisma.EmbedConfigUncheckedCreateInput,
      'allowedOrigins' | 'templateIds' | 'sections' | 'features'
    > & { theme: TEmbedTheme; branding: TEmbedBranding }
  > = {};

  if (input.allowedOrigins !== undefined) {
    if (
      !Array.isArray(input.allowedOrigins) ||
      input.allowedOrigins.some((each) => typeof each !== 'string')
    ) {
      errors.push('allowedOrigins must be a list of web addresses');
    } else if (input.allowedOrigins.length > MAX_ALLOWED_ORIGINS) {
      errors.push(`At most ${MAX_ALLOWED_ORIGINS} allowed origins`);
    } else {
      const origins: string[] = [];
      for (const each of input.allowedOrigins as string[]) {
        const origin = normalizeOrigin(each);
        if (typeof origin === 'string') origins.push(origin);
        else errors.push(origin.error);
      }
      data.allowedOrigins = [...new Set(origins)];
    }
  }

  if (input.theme !== undefined) {
    if (!isObject(input.theme)) errors.push('theme must be an object');
    else {
      const { primaryColor, mode, radius } = input.theme;
      const theme: TEmbedTheme = {};
      if (primaryColor !== undefined && primaryColor !== '') {
        if (typeof primaryColor === 'string' && HEX_COLOR.test(primaryColor)) {
          theme.primaryColor = primaryColor.toLowerCase();
        } else errors.push('theme.primaryColor must be like #4f46e5');
      }
      if (mode !== undefined && mode !== null) {
        if (mode === 'light' || mode === 'dark') theme.mode = mode;
        else errors.push('theme.mode must be light or dark');
      }
      if (radius !== undefined && radius !== null) {
        if (
          Number.isInteger(radius) &&
          Number(radius) >= 0 &&
          Number(radius) <= 24
        ) {
          theme.radius = Number(radius);
        } else errors.push('theme.radius must be a whole number from 0 to 24');
      }
      data.theme = theme;
    }
  }

  if (input.branding !== undefined) {
    if (!isObject(input.branding)) errors.push('branding must be an object');
    else {
      const { companyName, logoUrl, showPlatformBranding } = input.branding;
      const branding: TEmbedBranding = {};
      if (typeof companyName === 'string' && companyName.trim()) {
        if (companyName.trim().length > 60) {
          errors.push('branding.companyName is at most 60 characters');
        } else branding.companyName = companyName.trim();
      }
      if (typeof logoUrl === 'string' && logoUrl.trim()) {
        try {
          const url = new URL(logoUrl.trim());
          if (url.protocol !== 'https:' || logoUrl.length > 500)
            throw new Error();
          branding.logoUrl = url.href;
        } catch {
          errors.push('branding.logoUrl must be an https image address');
        }
      }
      if (showPlatformBranding !== undefined) {
        branding.showPlatformBranding = showPlatformBranding !== false;
      }
      data.branding = branding;
    }
  }

  const pickList = <T extends string>(
    value: unknown,
    name: string,
    allowed: (item: string) => item is T,
  ): T[] | undefined => {
    if (value === undefined) return undefined;
    if (
      !Array.isArray(value) ||
      value.some((each) => typeof each !== 'string')
    ) {
      errors.push(`${name} must be a list`);
      return undefined;
    }
    const unknown = (value as string[]).filter((each) => !allowed(each));
    if (unknown.length > 0)
      errors.push(`Unknown ${name}: ${unknown.join(', ')}`);
    return [...new Set((value as string[]).filter(allowed))];
  };
  data.templateIds = pickList(
    input.templateIds,
    'templates',
    (id): id is string => !!findTemplateSpec(id),
  );
  data.sections = pickList<TCvEditorStep>(
    input.sections,
    'sections',
    (id): id is TCvEditorStep =>
      (CV_EDITOR_STEPS as readonly string[]).includes(id),
  );
  data.features = pickList<TEmbedFeature>(
    input.features,
    'features',
    (id): id is TEmbedFeature =>
      (EMBED_FEATURES as readonly string[]).includes(id),
  );

  if (errors.length > 0) throw new BadRequestException(errors);
  return data;
};

const themeOf = (value: Prisma.JsonValue): TEmbedTheme =>
  isObject(value) ? (value as TEmbedTheme) : {};
const brandingOf = (value: Prisma.JsonValue): TEmbedBranding =>
  isObject(value) ? (value as TEmbedBranding) : {};

/** An embed as its owners see it. */
export const toEmbedConfig = (config: EmbedConfig): TEmbedConfig => ({
  id: config.id,
  name: config.name,
  publicKey: config.publicKey,
  allowedOrigins: config.allowedOrigins,
  theme: themeOf(config.theme),
  branding: brandingOf(config.branding),
  templateIds: config.templateIds,
  sections: config.sections.filter((each): each is TCvEditorStep =>
    (CV_EDITOR_STEPS as readonly string[]).includes(each),
  ),
  features: config.features.filter((each): each is TEmbedFeature =>
    (EMBED_FEATURES as readonly string[]).includes(each),
  ),
  disabled: !!config.disabledAt,
  createdAt: config.createdAt.toISOString(),
  updatedAt: config.updatedAt.toISOString(),
});

/**
 * The embed as its builder runs, clamped to the plan: only templates that
 * are offered and the plan includes (an end user can't upgrade), only
 * extras the plan has, and our branding unless the plan is white-label.
 * The API enforces the same object on every request.
 */
export const resolveEmbedConfig = (
  config: EmbedConfig,
  entitlements: Entitlements,
  catalog: TTemplateCatalog,
): TResolvedEmbedConfig => {
  const usable = catalog.available.filter(
    (id) => entitlements.can('template.premium') || catalog.free.includes(id),
  );
  const chosen = config.templateIds.length
    ? config.templateIds.filter((id) => usable.includes(id))
    : usable;
  const templateIds = chosen.length > 0 ? chosen : [...catalog.free];
  const { sections, features } = toEmbedConfig(config);
  const branding = brandingOf(config.branding);

  return {
    publicKey: config.publicKey,
    theme: themeOf(config.theme),
    branding: {
      ...branding,
      showPlatformBranding:
        !entitlements.can('embed.whitelabel') ||
        branding.showPlatformBranding !== false,
    },
    templateIds,
    freeTemplateIds: templateIds.filter((id) => catalog.free.includes(id)),
    // Always in the editor's order, whatever order they were picked in.
    sections: CV_EDITOR_STEPS.filter(
      (step) => sections.length === 0 || sections.includes(step),
    ),
    planFeatures: entitlements.toSummary().features,
    features: features.filter(
      (feature) =>
        feature !== 'pdf.download' || entitlements.can('cv.download.pdf'),
    ),
  };
};
