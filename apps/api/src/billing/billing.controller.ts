import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseFilters,
  UseGuards,
  type RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { BillingTargetDto, PlanChoiceDto } from './billing.dto.js';
import { BillingService } from './billing.service.js';
import { PaymentProviderErrorFilter } from './payment-provider-error.filter.js';

@Controller('billing')
@UseFilters(PaymentProviderErrorFilter)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /** Public: which provider and the browser-side token for its checkout. */
  @Get('config')
  config() {
    return this.billingService.config();
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  startCheckout(
    @Auth() { userId }: TAuthContext,
    @Body() { planKey, period, teamId }: PlanChoiceDto,
  ) {
    return this.billingService.startCheckout(userId, planKey, period, teamId);
  }

  @Post('checkout/:checkoutId/complete')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  completeCheckout(
    @Auth() { userId }: TAuthContext,
    @Param('checkoutId') checkoutId: string,
    @Body() { teamId }: BillingTargetDto,
  ) {
    return this.billingService.completeCheckout(userId, checkoutId, teamId);
  }

  @Post('change-plan')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async changePlan(
    @Auth() { userId }: TAuthContext,
    @Body() { planKey, period, teamId }: PlanChoiceDto,
  ) {
    await this.billingService.changePlan(userId, planKey, period, teamId);
  }

  @Post('cancel')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async cancel(
    @Auth() { userId }: TAuthContext,
    @Body() { teamId }: BillingTargetDto,
  ) {
    await this.billingService.cancel(userId, teamId);
  }

  @Post('resume')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async resume(
    @Auth() { userId }: TAuthContext,
    @Body() { teamId }: BillingTargetDto,
  ) {
    await this.billingService.resume(userId, teamId);
  }

  @Post('portal')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  portal(
    @Auth() { userId }: TAuthContext,
    @Body() { teamId }: BillingTargetDto,
  ) {
    return this.billingService.portalUrl(userId, teamId);
  }

  /**
   * The payment provider's notifications. Authenticated by its signature
   * over the raw body, not by a session; not rate-limited, as the provider
   * may send many at once.
   */
  @Post('webhooks/paddle')
  @HttpCode(200)
  @SkipThrottle()
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const valid =
      !!req.rawBody &&
      (await this.billingService.handleWebhook(req.rawBody, req.headers));
    if (!valid) throw new UnauthorizedException('Invalid signature');
    return { received: true };
  }
}
