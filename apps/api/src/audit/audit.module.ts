import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';

/** Global, so any service can record to the audit log. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
