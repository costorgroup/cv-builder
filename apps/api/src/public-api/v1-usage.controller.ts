import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPrincipal, RequireApiScopes } from '../api-keys/api-key.guard.js';
import type { TApiPrincipal } from '../api-keys/api-keys.service.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import { UsageService } from '../usage/usage.service.js';
import { V1Usage } from './v1.schemas.js';

/** `/v1/usage`. */
@ApiTags('Usage')
@Controller('v1/usage')
export class V1UsageController {
  constructor(
    private readonly entitlements: EntitlementService,
    private readonly usage: UsageService,
  ) {}

  /** The plan, and this month's use of its limits. */
  @Get()
  @RequireApiScopes('usage:read')
  @ApiOperation({
    summary: "The plan and this month's usage",
    description: 'Scope: usage:read.',
  })
  @ApiOkResponse({ type: V1Usage })
  async getUsage(@ApiPrincipal() principal: TApiPrincipal) {
    const entitlements = await this.entitlements.forOrganization(
      principal.organizationId,
    );
    const [summary, apiRequests] = await Promise.all([
      this.usage.summary(principal.organizationId, entitlements),
      this.usage.countThisMonth(principal.organizationId, 'api.request'),
    ]);
    return {
      plan: entitlements.plan,
      usage: {
        ...summary,
        apiRequestsThisMonth: {
          used: apiRequests,
          max: entitlements.limit('api.requests.monthly'),
        },
      },
    };
  }
}
