import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { PlatformBillingSubscriptionListResponse } from '@servir/contracts';
import { BillingExempt } from '@servir/core-billing';
import { PlatformAdminGuard } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import {
  ListPlatformBillingSubscriptionsQueryDto,
  PlatformBillingSubscriptionListResponseDto,
} from './billing.dto.js';
import { BillingService } from './billing.service.js';

@Controller('platform/billing')
@UseGuards(PlatformAdminGuard)
@BillingExempt()
export class PlatformBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscriptions')
  @ZodResponse({
    status: 200,
    description: 'List billing subscription statuses for organizations',
    type: PlatformBillingSubscriptionListResponseDto,
  })
  async listSubscriptions(
    @Query() query: ListPlatformBillingSubscriptionsQueryDto,
  ): Promise<PlatformBillingSubscriptionListResponse> {
    return this.billingService.listPlatformBillingSubscriptions(query);
  }
}
