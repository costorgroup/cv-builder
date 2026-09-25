import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, type User } from '../generated/prisma/client.js';
import { MailService } from '../mail/mail.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  REFRESH_TOKEN_TTL_MS,
  RESET_PASSWORD_TOKEN_TTL_MS,
  VERIFY_ACCOUNT_TOKEN_TTL_MS,
} from './auth.constants.js';
import type {
  ChangePasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
} from './auth.dto.js';
import type {
  TAccessTokenPayload,
  TAuthSession,
  TPublicUser,
} from './auth.types.js';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from './utils/password.js';
import { createToken, hashToken } from './utils/token.js';

const INVALID_LINK = 'This link is invalid or has expired';
const LINK_TOKEN_BYTES = 16;

const toPublicUser = (user: User): TPublicUser => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  emailVerified: user.emailVerifiedAt !== null,
  createdAt: user.createdAt,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async signUp({
    firstName,
    lastName,
    email,
    password,
  }: SignUpDto): Promise<TAuthSession> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: await hashPassword(password),
      },
    });
    await this.sendVerifyAccount(user);
    return this.createSession(user);
  }

  async signIn({ email, password }: SignInDto): Promise<TAuthSession> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = await verifyPassword(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createSession(user);
  }

  /** Swaps a refresh token for a new pair; the old one stops working. */
  async refresh(refreshToken: string | undefined): Promise<TAuthSession> {
    const session = refreshToken
      ? await this.prisma.session.findUnique({
          where: { refreshTokenHash: hashToken(refreshToken) },
          include: { user: true },
        })
      : null;
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    const nextRefreshToken = createToken();
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(nextRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return {
      user: toPublicUser(session.user),
      accessToken: await this.signAccessToken(session.userId, session.id),
      refreshToken: nextRefreshToken,
    };
  }

  /** Revokes the session behind a refresh token, even an expired one. */
  async signOut(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await this.prisma.session.deleteMany({
      where: { refreshTokenHash: hashToken(refreshToken) },
    });
  }

  async me(userId: string): Promise<TPublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return toPublicUser(user);
  }

  async verifyAccount(token: string) {
    const userId = await this.consumeAuthToken(
      token,
      AuthTokenType.VERIFY_ACCOUNT,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async resendVerifyAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.emailVerifiedAt) {
      throw new BadRequestException('Your account is already verified');
    }
    await this.sendVerifyAccount(user);
  }

  /** Always succeeds, so it can't be used to find out who has an account. */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const token = await this.createAuthToken(
      user.id,
      AuthTokenType.RESET_PASSWORD,
      RESET_PASSWORD_TOKEN_TTL_MS,
    );
    await this.mail.sendResetPassword(user.email, token);
  }

  /** Sets a new password from an emailed link and signs out every device. */
  async resetPassword({ token, password }: ResetPasswordDto) {
    const userId = await this.consumeAuthToken(
      token,
      AuthTokenType.RESET_PASSWORD,
    );
    const passwordHash = await hashPassword(password);
    await this.prisma.$transaction([
      // Opening the emailed link also proves the address is theirs.
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, emailVerifiedAt: new Date() },
      }),
      this.prisma.session.deleteMany({ where: { userId } }),
    ]);
  }

  /** Changes the password and signs out every other device. */
  async changePassword(
    userId: string,
    sessionId: string,
    { currentPassword, newPassword }: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.session.deleteMany({
        where: { userId, id: { not: sessionId } },
      }),
    ]);
  }

  async sessionExists(sessionId: string) {
    const count = await this.prisma.session.count({
      where: { id: sessionId, expiresAt: { gt: new Date() } },
    });
    return count > 0;
  }

  private async createSession(user: User): Promise<TAuthSession> {
    const refreshToken = createToken();
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return {
      user: toPublicUser(user),
      accessToken: await this.signAccessToken(user.id, session.id),
      refreshToken,
    };
  }

  private signAccessToken(userId: string, sessionId: string) {
    const payload: TAccessTokenPayload = { sub: userId, sid: sessionId };
    return this.jwt.signAsync(payload);
  }

  private async sendVerifyAccount(user: User) {
    const token = await this.createAuthToken(
      user.id,
      AuthTokenType.VERIFY_ACCOUNT,
      VERIFY_ACCOUNT_TOKEN_TTL_MS,
    );
    await this.mail.sendVerifyAccount(user.email, token);
  }

  /** Creates a link token, replacing any earlier one of the same type. */
  private async createAuthToken(
    userId: string,
    type: AuthTokenType,
    ttlMs: number,
  ) {
    const token = createToken(LINK_TOKEN_BYTES);
    await this.prisma.$transaction([
      this.prisma.authToken.deleteMany({ where: { userId, type } }),
      this.prisma.authToken.create({
        data: {
          userId,
          type,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + ttlMs),
        },
      }),
    ]);
    return token;
  }

  /** Uses up a link token and returns its user's id. */
  private async consumeAuthToken(token: string, type: AuthTokenType) {
    const authToken = await this.prisma.authToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!authToken || authToken.type !== type) {
      throw new BadRequestException(INVALID_LINK);
    }

    // Deleting by id and checking the count makes the token single-use even
    // if the link is opened twice at once.
    const { count } = await this.prisma.authToken.deleteMany({
      where: { id: authToken.id },
    });
    if (count === 0 || authToken.expiresAt < new Date()) {
      throw new BadRequestException(INVALID_LINK);
    }
    return authToken.userId;
  }
}
