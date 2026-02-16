import {
  BillingMeResponseSchema,
  ClerkWebhookAckSchema,
  ListPlatformBillingSubscriptionsQuerySchema,
  PlatformBillingSubscriptionListResponseSchema,
} from '@servir/contracts';
import { createZodDto } from 'nestjs-zod';

export class BillingMeResponseDto extends createZodDto(BillingMeResponseSchema) {}

export class ListPlatformBillingSubscriptionsQueryDto extends createZodDto(
  ListPlatformBillingSubscriptionsQuerySchema,
) {}

export class PlatformBillingSubscriptionListResponseDto extends createZodDto(
  PlatformBillingSubscriptionListResponseSchema,
) {}

export class ClerkWebhookAckDto extends createZodDto(ClerkWebhookAckSchema) {}
