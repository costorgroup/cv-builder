import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Auth } from './auth.decorator.js';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  TokenDto,
} from './auth.dto.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import type { TAuthContext } from './auth.types.js';
import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from './utils/cookies.js';

/** Stricter limit for routes that guess passwords or send email. */
const SENSITIVE = { default: { limit: 5, ttl: 60_000 } };

const refreshTokenOf = (req: Request): string | undefined => {
  const token: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof token === 'string' ? token : undefined;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @Throttle(SENSITIVE)
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, ...tokens } = await this.authService.signUp(dto);
    setAuthCookies(res, tokens);
    return { user };
  }

  @Post('sign-in')
  @HttpCode(200)
  @Throttle(SENSITIVE)
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, ...tokens } = await this.authService.signIn(dto);
    setAuthCookies(res, tokens);
    return { user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { user, ...tokens } = await this.authService.refresh(
        refreshTokenOf(req),
      );
      setAuthCookies(res, tokens);
      return { user };
    } catch (error) {
      clearAuthCookies(res);
      throw error;
    }
  }

  @Post('sign-out')
  @HttpCode(204)
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signOut(refreshTokenOf(req));
    clearAuthCookies(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Auth() { userId }: TAuthContext) {
    return { user: await this.authService.me(userId) };
  }

  @Post('verify-account')
  @HttpCode(204)
  async verifyAccount(@Body() { token }: TokenDto) {
    await this.authService.verifyAccount(token);
  }

  @Post('resend-verification')
  @HttpCode(204)
  @Throttle(SENSITIVE)
  @UseGuards(AuthGuard)
  async resendVerification(@Auth() { userId }: TAuthContext) {
    await this.authService.resendVerifyAccount(userId);
  }

  @Post('forgot-password')
  @HttpCode(204)
  @Throttle(SENSITIVE)
  async forgotPassword(@Body() { email }: ForgotPasswordDto) {
    await this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(204)
  @Throttle(SENSITIVE)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.resetPassword(dto);
    // Every session was revoked, including any on this browser.
    clearAuthCookies(res);
  }

  @Post('change-password')
  @HttpCode(204)
  @Throttle(SENSITIVE)
  @UseGuards(AuthGuard)
  async changePassword(
    @Auth() { userId, sessionId }: TAuthContext,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, sessionId, dto);
  }
}
