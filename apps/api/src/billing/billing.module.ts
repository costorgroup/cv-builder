import { Logger, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingController } from './billing.controller.js';
import { BillingReconciler } from './billing.reconciler.js';
import { BillingService } from './billing.service.js';
import { PAYMENT_PROVIDER } from './billing.types.js';
import { PaddleProvider } from './paddle/paddle.provider.js';

/** Paddle when its API key is set; no provider (payments off) otherwise. */
export const createPaymentProvider = () => {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    new Logger('BillingModule').warn(
      'PADDLE_API_KEY is not set; payments are turned off.',
    );
    return null;
  }
  return new PaddleProvider({
    apiKey,
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
    clientToken: process.env.PADDLE_CLIENT_TOKEN,
  });
};

@Module({
  imports: [AuthModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    BillingReconciler,
    { provide: PAYMENT_PROVIDER, useFactory: createPaymentProvider },
  ],
  exports: [BillingService],
})
export class BillingModule {}
