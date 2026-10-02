import { Module } from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service.js';

/** Regular clean-up of records past their time. */
@Module({ providers: [HousekeepingService] })
export class HousekeepingModule {}
