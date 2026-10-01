import { BadRequestException } from '@nestjs/common';
import {
  isFeature,
  isLimit,
  type TFeature,
  type TLimit,
  type TLimitValue,
} from '@repo/cv-core';

export type TEntitlementInput = {
  features?: unknown;
  limits?: unknown;
};

/**
 * Features and limits typed in by an admin (for a plan, or one account's
 * extras), checked against the registry: unknown keys or bad values are a
 * 400 naming them, never stored.
 */
export const parseEntitlementInput = ({
  features,
  limits,
}: TEntitlementInput) => {
  const problems: string[] = [];
  let parsedFeatures: TFeature[] | undefined;
  let parsedLimits: Partial<Record<TLimit, TLimitValue>> | undefined;

  if (features !== undefined) {
    if (!Array.isArray(features)) {
      problems.push('features must be a list');
    } else {
      const unknown = features.filter((feature) => !isFeature(feature));
      if (unknown.length > 0) {
        problems.push(`unknown features: ${unknown.join(', ')}`);
      }
      parsedFeatures = [...new Set(features.filter(isFeature))];
    }
  }

  if (limits !== undefined) {
    if (
      typeof limits !== 'object' ||
      limits === null ||
      Array.isArray(limits)
    ) {
      problems.push('limits must be an object');
    } else {
      parsedLimits = {};
      for (const [key, value] of Object.entries(limits)) {
        if (!isLimit(key)) {
          problems.push(`unknown limit: ${key}`);
        } else if (
          value !== null &&
          !(Number.isInteger(value) && (value as number) >= 0)
        ) {
          problems.push(
            `${key} must be a whole number of 0 or more, or null for unlimited`,
          );
        } else {
          parsedLimits[key] = value as TLimitValue;
        }
      }
    }
  }

  if (problems.length > 0) throw new BadRequestException(problems.join('; '));
  return { features: parsedFeatures, limits: parsedLimits };
};
