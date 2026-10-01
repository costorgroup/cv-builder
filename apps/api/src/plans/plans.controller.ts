import { Controller, Get, Query, Req } from '@nestjs/common';
import { CURRENCY_COOKIE } from '@repo/cv-core';
import type { Request } from 'express';
import { ListPlansQuery } from './plans.dto.js';
import { PlansService } from './plans.service.js';
import { countryFromHeaders } from './visitor-country.js';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * Public: the pricing page shows these to everyone. Prices are in the
   * currency asked for, else the one the visitor picked (cookie), else their
   * country's (asked for, or worked out from the request).
   */
  @Get()
  list(@Query() query: ListPlansQuery, @Req() req: Request) {
    const cookie: unknown = req.cookies?.[CURRENCY_COOKIE];
    return this.plansService.listPublic({
      currency:
        query.currency ??
        (typeof cookie === 'string' ? cookie.toUpperCase() : undefined),
      country: query.country ?? countryFromHeaders(req.headers),
    });
  }
}
