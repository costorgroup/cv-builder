import { Injectable, Logger } from '@nestjs/common';

/**
 * Sends account emails. For now it only logs the links, so they can be
 * opened from the API console; swap the body for a real provider later.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly webUrl = process.env.WEB_URL ?? 'http://localhost:3000';

  async sendVerifyAccount(to: string, token: string) {
    this.log(to, 'Verify your account', `/auth/verify-account?token=${token}`);
  }

  async sendResetPassword(to: string, token: string) {
    this.log(to, 'Reset your password', `/auth/reset-password?token=${token}`);
  }

  private log(to: string, subject: string, path: string) {
    this.logger.log(`${subject} → ${to}`);
    // On its own line with no log prefix, so a narrow terminal pane (like
    // Turbo's TUI) doesn't wrap it and cut off the clickable link.
    console.log(`${this.webUrl}${path}`);
  }
}
