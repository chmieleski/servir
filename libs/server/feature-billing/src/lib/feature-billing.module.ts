import { Module } from '@nestjs/common';
import { DataAccessModule } from '@servir/data-access';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { ClerkWebhookController } from './clerk-webhook.controller.js';
import { PlatformBillingController } from './platform-billing.controller.js';

@Module({
  imports: [DataAccessModule],
  controllers: [
    BillingController,
    PlatformBillingController,
    ClerkWebhookController,
  ],
  providers: [BillingService],
  exports: [BillingService],
})
export class FeatureBillingModule {}
