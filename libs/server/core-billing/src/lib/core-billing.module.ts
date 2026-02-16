import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DataAccessModule } from '@servir/data-access';
import { BillingGuard } from './billing.guard.js';

@Module({
  imports: [DataAccessModule],
  providers: [
    BillingGuard,
    {
      provide: APP_GUARD,
      useExisting: BillingGuard,
    },
  ],
  exports: [BillingGuard],
})
export class CoreBillingModule {}
