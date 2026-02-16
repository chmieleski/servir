import { Controller, Post, Req } from '@nestjs/common';
import type { ClerkWebhookAck } from '@servir/contracts';
import { BillingExempt } from '@servir/core-billing';
import { Public } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import { ClerkWebhookAckDto } from './billing.dto.js';
import { BillingService } from './billing.service.js';

type RawBodyRequest = {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  protocol?: string;
  originalUrl?: string;
  url?: string;
  get?: (key: string) => string | undefined;
  rawBody?: Buffer;
  body?: unknown;
};

@Controller('internal/webhooks')
@Public()
@BillingExempt()
export class ClerkWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post('clerk')
  @ZodResponse({
    status: 200,
    description: 'Acknowledge Clerk webhook processing',
    type: ClerkWebhookAckDto,
  })
  async handleClerkWebhook(@Req() request: RawBodyRequest): Promise<ClerkWebhookAck> {
    return this.billingService.handleClerkWebhook(request);
  }
}
