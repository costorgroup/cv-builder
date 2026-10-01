import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { clearAuthCookies } from '../auth/utils/cookies.js';
import { EntitlementService } from '../entitlements/entitlements.service.js';
import { DeleteAccountDto, UpdateProfileDto } from './account.dto.js';
import { AccountService } from './account.service.js';

/** Stricter limit for routes that check the password. */
const SENSITIVE = { default: { limit: 5, ttl: 60_000 } };

/** The signed-in user's own account. */
@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly entitlements: EntitlementService,
  ) {}

  /**
   * What the user's plan allows. For showing limits and upgrade prompts only;
   * the API checks the plan again on every action.
   */
  @Get('entitlements')
  async getEntitlements(@Auth() { userId }: TAuthContext) {
    return (await this.entitlements.forUser(userId)).toSummary();
  }

  /** Plan, subscription and usage, for the dashboard. */
  @Get('overview')
  getOverview(@Auth() { userId }: TAuthContext) {
    return this.accountService.overview(userId);
  }

  @Patch()
  async updateProfile(
    @Auth() { userId }: TAuthContext,
    @Body() dto: UpdateProfileDto,
  ) {
    return { user: await this.accountService.updateProfile(userId, dto) };
  }

  @Delete()
  @HttpCode(204)
  @Throttle(SENSITIVE)
  async deleteAccount(
    @Auth() { userId }: TAuthContext,
    @Body() { password }: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.accountService.deleteAccount(userId, password);
    clearAuthCookies(res);
  }

  @Get('sessions')
  listSessions(@Auth() { userId, sessionId }: TAuthContext) {
    return this.accountService.listSessions(userId, sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  async revokeSession(
    @Auth() { userId, sessionId }: TAuthContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.accountService.revokeSession(userId, sessionId, id);
  }

  @Post('sessions/sign-out-others')
  @HttpCode(200)
  revokeOtherSessions(@Auth() { userId, sessionId }: TAuthContext) {
    return this.accountService.revokeOtherSessions(userId, sessionId);
  }
}
