import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { findTemplateSpec } from '@repo/cv-core';
import { ApiPrincipal, RequireApiScopes } from '../api-keys/api-key.guard.js';
import type { TApiPrincipal } from '../api-keys/api-keys.service.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import { V1Template } from './v1.schemas.js';

/** `/v1/templates`. */
@ApiTags('Templates')
@Controller('v1/templates')
export class V1TemplatesController {
  constructor(
    private readonly templates: TemplatesService,
    private readonly entitlements: EntitlementService,
  ) {}

  /**
   * Templates a CV can use, in order, with whether the key's plan includes
   * each and the color schemes it offers.
   */
  @Get()
  @RequireApiScopes('template:read')
  @ApiOperation({
    summary: 'List templates',
    description:
      "Scope: template:read. In display order; `available` says whether the key's plan includes it.",
  })
  @ApiOkResponse({ type: [V1Template] })
  async listTemplates(@ApiPrincipal() principal: TApiPrincipal) {
    const [published, entitlements] = await Promise.all([
      this.templates.listPublic(),
      this.entitlements.forOrganization(principal.organizationId),
    ]);
    const premium = entitlements.can('template.premium');
    return published.flatMap(({ id, tier, category }) => {
      const spec = findTemplateSpec(id);
      return spec
        ? [
            {
              id,
              name: spec.name,
              category,
              tier,
              available: tier === 'FREE' || premium,
              colorSchemes: spec.colorSchemes.map(({ id: schemeId, name }) => ({
                id: schemeId,
                name,
              })),
            },
          ]
        : [];
    });
  }
}
