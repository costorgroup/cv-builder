import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** How long an embedded builder session lasts before it asks for a new one. */
export const EMBED_SESSION_TTL_SECONDS = 60 * 60;

/** What an embed session carries. */
export type TEmbedClaims = {
  typ: 'embed';
  /** Organization. */
  org: string;
  /** External user. */
  xu: string;
  /** Embed config. */
  cfg: string;
};

/**
 * Signs and checks embed sessions. Their own secret, audience and type, so
 * an embed token never passes for a user's session or the other way round.
 */
@Injectable()
export class EmbedTokens {
  private readonly jwt: JwtService;

  constructor() {
    const secret = process.env.EMBED_JWT_SECRET;
    if (!secret) {
      throw new Error('EMBED_JWT_SECRET is not set');
    }
    if (secret === process.env.JWT_SECRET) {
      throw new Error('EMBED_JWT_SECRET must differ from JWT_SECRET');
    }
    this.jwt = new JwtService({
      secret,
      signOptions: { audience: 'embed', expiresIn: EMBED_SESSION_TTL_SECONDS },
      verifyOptions: { audience: 'embed' },
    });
  }

  sign(claims: Omit<TEmbedClaims, 'typ'>) {
    return this.jwt.signAsync({ ...claims, typ: 'embed' });
  }

  /** The claims of a valid, unexpired embed token; null otherwise. */
  async verify(token: string): Promise<TEmbedClaims | null> {
    try {
      const claims = await this.jwt.verifyAsync<TEmbedClaims>(token);
      return claims.typ === 'embed' && claims.org && claims.xu && claims.cfg
        ? claims
        : null;
    } catch {
      return null;
    }
  }
}
