import { Controller, Get } from '@nestjs/common';
import type { BillingMeResponse } from '@servir/contracts';
import { BillingExempt } from '@servir/core-billing';
import { CurrentAuth, type ServirAuthContext } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import { BillingService } from './billing.service.js';
import { BillingMeResponseDto } from './billing.dto.js';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('me')
  @BillingExempt()
  @ZodResponse({
    status: 200,
    description: 'Active organization billing snapshot',
    type: BillingMeResponseDto,
  })
  async getBillingMe(
    @CurrentAuth() auth: ServirAuthContext,
  ): Promise<BillingMeResponse> {
    return this.billingService.getBillingMe(auth);
  }
}
