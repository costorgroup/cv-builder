import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';
import {
  AccountStorageController,
  TeamStorageController,
} from './storage-configs.controller.js';
import { StorageConfigsService } from './storage-configs.service.js';

/** Stored files and organizations' own buckets. */
@Module({
  imports: [AuthModule, EntitlementsModule],
  controllers: [
    AssetsController,
    AccountStorageController,
    TeamStorageController,
  ],
  providers: [AssetsService, StorageConfigsService],
  exports: [AssetsService],
})
export class StorageModule {}
