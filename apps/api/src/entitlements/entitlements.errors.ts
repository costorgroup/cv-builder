import { ForbiddenException } from '@nestjs/common';
import {
  PLAN_FEATURE_REQUIRED,
  PLAN_LIMIT_REACHED,
  type TFeature,
  type TLimit,
} from '@repo/cv-core';

/**
 * The plan doesn't include a feature. The body's `code` and `feature` let the
 * web app show the right upgrade prompt.
 */
export class PlanFeatureRequiredException extends ForbiddenException {
  constructor(feature: TFeature) {
    super({
      statusCode: 403,
      error: 'Forbidden',
      code: PLAN_FEATURE_REQUIRED,
      feature,
      message: "Your plan doesn't include this. Upgrade to use it.",
    });
  }
}

/** The plan's limit is used up; `used` may be over `max` after a downgrade. */
export class PlanLimitReachedException extends ForbiddenException {
  constructor(limit: TLimit, used: number, max: number) {
    super({
      statusCode: 403,
      error: 'Forbidden',
      code: PLAN_LIMIT_REACHED,
      limit,
      used,
      max,
      message: "You've reached your plan's limit. Upgrade to get more.",
    });
  }
}
