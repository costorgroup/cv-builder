import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Auth } from '../auth/auth.decorator.js';
import { AuthGuard } from '../auth/auth.guard.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { TeamsService } from './teams.service.js';

/** Guessing invite tokens is pointless (128 bits), but it's cheap to slow. */
const LOOKUPS = { default: { limit: 20, ttl: 60_000 } };

/** Invite links, as opened by the people they were sent to. */
@Controller('invites')
export class InvitesController {
  constructor(private readonly teams: TeamsService) {}

  /** Public: the invite page shows this before signing in. */
  @Get(':token')
  @Throttle(LOOKUPS)
  preview(@Param('token') token: string) {
    return this.teams.previewInvite(token);
  }

  @Post(':token/accept')
  @HttpCode(200)
  @Throttle(LOOKUPS)
  @UseGuards(AuthGuard)
  accept(@Auth() { userId }: TAuthContext, @Param('token') token: string) {
    return this.teams.acceptInvite(userId, token);
  }
}
