import { BadRequestException } from '@nestjs/common';
import {
  normalizeCvAppearance,
  premiumFeaturesNeeded,
  type TCvAppearance,
  type TTemplateCatalog,
} from '@repo/cv-core';
import type { Entitlements } from '../entitlements/entitlements.js';
import type { Prisma } from '../generated/prisma/client.js';

/** A client's appearance, completed with defaults; 400 if it's invalid. */
export const parseAppearance = (input: unknown): TCvAppearance => {
  const result = normalizeCvAppearance(input);
  if ('error' in result) throw new BadRequestException(result.error);
  return result.appearance;
};

/** A saved CV's appearance, completed with defaults; null if unreadable. */
export const readSavedAppearance = (
  saved: Prisma.JsonValue,
): TCvAppearance | null => {
  const result = normalizeCvAppearance(saved);
  return 'error' in result ? null : result.appearance;
};

/**
 * Throws a 400 if the appearance switches to a template that isn't offered,
 * and a `PLAN_FEATURE_REQUIRED` 403 if it takes on anything premium the plan
 * doesn't include. Whatever `previous` (the CV as saved) already used is
 * kept, so hiding a template or a downgrade never breaks an existing CV.
 */
export const assertAppearanceAllowed = (
  entitlements: Entitlements,
  catalog: TTemplateCatalog,
  next: TCvAppearance,
  previous: TCvAppearance | null,
) => {
  if (
    !catalog.available.includes(next.templateId) &&
    previous?.templateId !== next.templateId
  ) {
    throw new BadRequestException(
      'This template is no longer offered. Pick another one.',
    );
  }
  for (const feature of premiumFeaturesNeeded(next, previous, catalog.free)) {
    entitlements.assertCan(feature);
  }
};

/** Bytes a CV takes up, counted as the JSON it's stored as. */
export const cvSizeBytes = (data: unknown, appearance: unknown) =>
  Buffer.byteLength(JSON.stringify(data)) +
  Buffer.byteLength(JSON.stringify(appearance));
