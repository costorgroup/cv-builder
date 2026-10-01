import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller.js';
import { ExchangeRateService } from './exchange-rates.service.js';
import { PlansService } from './plans.service.js';

@Module({
  controllers: [PlansController],
  providers: [PlansService, ExchangeRateService],
  exports: [PlansService],
})
export class PlansModule {}
