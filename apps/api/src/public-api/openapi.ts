import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_SCOPES } from '@repo/cv-core';
import { API_REQUESTS_PER_MINUTE } from '../api-keys/api-key.guard.js';
import { PublicApiModule } from './public-api.module.js';

const DESCRIPTION = `Read and manage CVs, list templates and check usage from your own server.

**Authentication.** Make a key under Developers in the dashboard, then send it on every request as \`Authorization: Bearer cvb_live_…\`. Never put a key in a web page or app that others can download.

**Scopes.** A key only does what it was made for: ${API_SCOPES.map((scope) => `\`${scope}\``).join(', ')}. A missing scope gets a 403 naming it.

**Plans.** The API follows the same plan as the web app: CV limits, premium templates and options, and monthly PDFs. Refusals are a 403 with \`code\` \`PLAN_FEATURE_REQUIRED\` or \`PLAN_LIMIT_REACHED\`.

**Limits.** Up to ${API_REQUESTS_PER_MINUTE} requests a minute per key (429 with \`Retry-After\`), and the plan's monthly requests (429 with \`code: PLAN_LIMIT_REACHED\`).`;

/**
 * The public API's reference, from its controllers: the page at
 * `/v1/docs` and the OpenAPI document at `/v1/openapi.json`. Only `/v1`
 * routes are in it; the web app's own API isn't public.
 */
export const setupApiDocs = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('CV Builder API')
    .setDescription(DESCRIPTION)
    .setVersion('1')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'cvb_live_…',
      description: 'An API key from Developers in the dashboard.',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [PublicApiModule],
  });
  SwaggerModule.setup('v1/docs', app, document, {
    jsonDocumentUrl: 'v1/openapi.json',
    customSiteTitle: 'CV Builder API',
    swaggerOptions: { persistAuthorization: false },
  });
};
