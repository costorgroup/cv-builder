import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CvsController } from './cvs.controller.js';
import { CvsService } from './cvs.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CvsController],
  providers: [CvsService],
})
export class CvsModule {}
