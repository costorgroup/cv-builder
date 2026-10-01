import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { BillingService } from './billing.service.js';

const HOUR_MS = 60 * 60 * 1000;

/** First run a few minutes after start, so it doesn't slow down booting. */
const FIRST_RUN_DELAY_MS = 5 * 60 * 1000;

/**
 * Runs `BillingService.reconcile` every `BILLING_RECONCILE_HOURS` hours
 * (12 by default; 0 turns it off). Safe on several instances at once: it
 * only copies the provider's state, so repeating it changes nothing.
 */
@Injectable()
export class BillingReconciler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(BillingReconciler.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly billing: BillingService) {}

  onApplicationBootstrap() {
    const hours = Number(process.env.BILLING_RECONCILE_HOURS ?? 12);
    if (!(hours > 0) || this.billing.config().provider === 'none') return;
    const run = () => void this.run();
    this.timer = setTimeout(() => {
      run();
      this.timer = setInterval(run, hours * HOUR_MS);
      this.timer.unref();
    }, FIRST_RUN_DELAY_MS);
    // Timers alone don't keep the process running.
    this.timer.unref();
  }

  onApplicationShutdown() {
    clearTimeout(this.timer);
    clearInterval(this.timer);
  }

  private async run() {
    // A slow run is never overlapped by the next one.
    if (this.running) return;
    this.running = true;
    try {
      await this.billing.reconcile();
    } catch (error) {
      this.logger.error('Reconciling subscriptions failed', error);
    } finally {
      this.running = false;
    }
  }
}
