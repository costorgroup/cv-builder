import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module.js';
import { EntitlementService } from './entitlements.service.js';
import { FeatureGuard } from './requires-feature.js';

@Module({
  imports: [PlansModule],
  providers: [EntitlementService, FeatureGuard],
  exports: [EntitlementService, FeatureGuard],
})
export class EntitlementsModule {}
