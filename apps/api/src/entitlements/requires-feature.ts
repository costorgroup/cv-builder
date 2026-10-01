import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TFeature } from '@repo/cv-core';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthRequest } from '../auth/auth.types.js';
import { EntitlementService } from './entitlements.service.js';

const FEATURE_KEY = 'requiredFeature';

/** Lets a request through only if the user's plan has the route's feature. */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const feature = this.reflector.getAllAndOverride<TFeature | undefined>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const { auth } = context.switchToHttp().getRequest<TAuthRequest>();
    if (!auth) {
      throw new Error('FeatureGuard used on a route without AuthGuard');
    }
    (await this.entitlements.forUser(auth.userId)).assertCan(feature);
    return true;
  }
}

/**
 * Signed-in users whose plan has `feature` only, e.g.
 * `@RequiresFeature('api.access')`. Others get a 403 with code
 * `PLAN_FEATURE_REQUIRED`. The module needs AuthModule and EntitlementsModule.
 */
export const RequiresFeature = (feature: TFeature) =>
  applyDecorators(
    SetMetadata(FEATURE_KEY, feature),
    UseGuards(AuthGuard, FeatureGuard),
  );
