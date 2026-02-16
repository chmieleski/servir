import { verifyWebhook } from '@clerk/backend/webhooks';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@servir/config';
import type {
  BillingMeResponse,
  BillingSnapshot,
  BillingStatus,
  ClerkWebhookAck,
  ListPlatformBillingSubscriptionsQuery,
  PlatformBillingSubscriptionListResponse,
} from '@servir/contracts';
import { ApiHttpException } from '@servir/core';
import type { ServirAuthContext } from '@servir/core-auth';
import { PrismaService } from '@servir/data-access';
import type {
  BillingWebhookEventStatus,
  Prisma,
} from '@prisma/client';

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

@Injectable()
export class BillingService {
  private readonly webhookSigningSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService<Env, true>,
  ) {
    this.webhookSigningSecret = configService.get('CLERK_WEBHOOK_SIGNING_SECRET', {
      infer: true,
    });
  }

  async getBillingMe(auth: ServirAuthContext): Promise<BillingMeResponse> {
    if (!auth.activeOrganizationId) {
      throw new ApiHttpException({
        status: 400,
        code: 'BILLING_CONTEXT_REQUIRED',
        message: 'Active organization context is required to read billing status.',
      });
    }

    const billing = await this.prisma.organizationBilling.findUnique({
      where: { organizationId: auth.activeOrganizationId },
    });

    if (!billing) {
      return {
        organizationId: auth.activeOrganizationId,
        provider: 'clerk',
        status: 'none',
        planId: null,
        planSlug: null,
        subscriptionId: null,
        customerId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        lastEventId: null,
        lastEventAt: null,
        updatedAt: new Date(0).toISOString(),
      };
    }

    return this.toBillingSnapshot(billing);
  }

  async listPlatformBillingSubscriptions(
    query: ListPlatformBillingSubscriptionsQuery,
  ): Promise<PlatformBillingSubscriptionListResponse> {
    const skip = (query.page - 1) * query.pageSize;
    const where: Prisma.OrganizationBillingWhereInput = query.status
      ? { status: query.status }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organizationBilling.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.organizationBilling.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        organizationId: item.organizationId,
        status: item.status,
        planSlug: item.planSlug,
        currentPeriodEnd: item.currentPeriodEnd?.toISOString() ?? null,
        updatedAt: item.updatedAt.toISOString(),
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
      },
    };
  }

  async handleClerkWebhook(request: RawBodyRequest): Promise<ClerkWebhookAck> {
    const eventId = this.getHeader(request.headers, 'svix-id') ?? this.makeFallbackEventId();

    let verifiedEvent: unknown;
    try {
      verifiedEvent = await verifyWebhook(this.toFetchRequest(request), {
        signingSecret: this.webhookSigningSecret,
      });
    } catch {
      throw new ApiHttpException({
        status: 401,
        code: 'WEBHOOK_SIGNATURE_INVALID',
        message: 'Webhook signature verification failed.',
      });
    }

    const existing = await this.prisma.billingWebhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: 'clerk',
          eventId,
        },
      },
      select: { id: true, status: true },
    });

    if (existing) {
      return {
        status: 'duplicate',
        eventId,
      };
    }

    const eventRecord = this.toEventRecord(verifiedEvent);
    const status = this.inferBillingStatus(eventRecord);
    const organizationId = this.inferOrganizationId(eventRecord);

    if (!organizationId || !status) {
      await this.persistWebhookEvent({
        eventId,
        eventType: eventRecord.type,
        status: 'ignored',
        payload: eventRecord.payload,
        headers: this.sanitizedHeaders(request.headers),
        occurredAt: eventRecord.occurredAt,
        failureReason: !organizationId
          ? 'Missing organization id in event payload.'
          : 'Unsupported billing status payload.',
      });

      return {
        status: 'ignored',
        eventId,
      };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.organizationBilling.upsert({
          where: { organizationId },
          update: {
            provider: 'clerk',
            status,
            planId: this.inferPlanId(eventRecord),
            planSlug: this.inferPlanSlug(eventRecord),
            subscriptionId: this.inferSubscriptionId(eventRecord),
            customerId: this.inferCustomerId(eventRecord),
            currentPeriodStart: this.inferDate(eventRecord, [
              'currentPeriodStart',
              'current_period_start',
            ]),
            currentPeriodEnd: this.inferDate(eventRecord, [
              'currentPeriodEnd',
              'current_period_end',
            ]),
            trialEndsAt: this.inferDate(eventRecord, ['trialEndsAt', 'trial_ends_at']),
            cancelAtPeriodEnd: this.inferCancelAtPeriodEnd(eventRecord),
            lastEventId: eventId,
            lastEventAt: eventRecord.occurredAt,
          },
          create: {
            organizationId,
            provider: 'clerk',
            status,
            planId: this.inferPlanId(eventRecord),
            planSlug: this.inferPlanSlug(eventRecord),
            subscriptionId: this.inferSubscriptionId(eventRecord),
            customerId: this.inferCustomerId(eventRecord),
            currentPeriodStart: this.inferDate(eventRecord, [
              'currentPeriodStart',
              'current_period_start',
            ]),
            currentPeriodEnd: this.inferDate(eventRecord, [
              'currentPeriodEnd',
              'current_period_end',
            ]),
            trialEndsAt: this.inferDate(eventRecord, ['trialEndsAt', 'trial_ends_at']),
            cancelAtPeriodEnd: this.inferCancelAtPeriodEnd(eventRecord),
            lastEventId: eventId,
            lastEventAt: eventRecord.occurredAt,
          },
        });

        await tx.billingWebhookEvent.create({
          data: {
            provider: 'clerk',
            eventId,
            eventType: eventRecord.type,
            status: 'processed',
            payloadJson: eventRecord.payload as Prisma.InputJsonValue,
            headersJson: this.sanitizedHeaders(request.headers) as Prisma.InputJsonValue,
            occurredAt: eventRecord.occurredAt,
            processedAt: new Date(),
          },
        });
      });
    } catch (error) {
      await this.persistWebhookEvent({
        eventId,
        eventType: eventRecord.type,
        status: 'failed',
        payload: eventRecord.payload,
        headers: this.sanitizedHeaders(request.headers),
        occurredAt: eventRecord.occurredAt,
        failureReason: this.toErrorMessage(error),
      });

      throw new ApiHttpException({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to process webhook event.',
      });
    }

    return {
      status: 'processed',
      eventId,
    };
  }

  private toFetchRequest(request: RawBodyRequest): Request {
    const headers = new Headers();

    for (const [key, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(','));
      } else if (typeof value === 'string') {
        headers.set(key, value);
      }
    }

    const host = request.get?.('host') ?? this.getHeader(request.headers, 'host') ?? 'localhost';
    const protocol = request.protocol ?? 'http';
    const path = request.originalUrl ?? request.url ?? '/';

    const rawBody = request.rawBody
      ? request.rawBody.toString('utf8')
      : typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body ?? {});

    return new Request(`${protocol}://${host}${path}`, {
      method: request.method,
      headers,
      body: rawBody,
    });
  }

  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    key: string,
  ): string | null {
    const directValue = headers[key];
    const normalizedValue = headers[key.toLowerCase()];
    const value = normalizedValue ?? directValue;

    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return typeof value === 'string' ? value : null;
  }

  private toEventRecord(verifiedEvent: unknown): {
    type: string;
    payload: Record<string, unknown>;
    data: Record<string, unknown>;
    occurredAt: Date | null;
  } {
    if (!verifiedEvent || typeof verifiedEvent !== 'object') {
      return {
        type: 'unknown',
        payload: {},
        data: {},
        occurredAt: null,
      };
    }

    const payload = verifiedEvent as Record<string, unknown>;
    const data =
      payload.data && typeof payload.data === 'object'
        ? (payload.data as Record<string, unknown>)
        : {};

    return {
      type: typeof payload.type === 'string' ? payload.type : 'unknown',
      payload,
      data,
      occurredAt: this.toDate(payload.created_at ?? payload.timestamp ?? data.created_at),
    };
  }

  private inferOrganizationId(eventRecord: {
    data: Record<string, unknown>;
  }): string | null {
    const candidates = [
      eventRecord.data.organizationId,
      eventRecord.data.organization_id,
      this.pickNested(eventRecord.data, ['organization', 'id']),
      this.pickNested(eventRecord.data, ['organization', 'organization_id']),
      this.pickNested(eventRecord.data, ['payer', 'organization_id']),
      this.pickNested(eventRecord.data, ['subscription', 'organization_id']),
    ];

    return this.firstString(candidates);
  }

  private inferBillingStatus(eventRecord: {
    type: string;
    data: Record<string, unknown>;
  }): BillingStatus | null {
    const statusCandidate = this.firstString([
      eventRecord.data.status,
      this.pickNested(eventRecord.data, ['subscription', 'status']),
      this.pickNested(eventRecord.data, ['billing', 'status']),
    ]);

    const normalizedStatus = this.normalizeStatus(statusCandidate);
    if (normalizedStatus) {
      return normalizedStatus;
    }

    const type = eventRecord.type.toLowerCase();
    if (type.includes('canceled') || type.includes('cancelled')) {
      return 'canceled';
    }
    if (type.includes('past_due')) {
      return 'past_due';
    }
    if (type.includes('unpaid')) {
      return 'unpaid';
    }
    if (type.includes('trial')) {
      return 'trialing';
    }
    if (type.includes('active') || type.includes('created') || type.includes('updated')) {
      return 'active';
    }

    return null;
  }

  private inferPlanId(eventRecord: { data: Record<string, unknown> }): string | null {
    return this.firstString([
      eventRecord.data.planId,
      eventRecord.data.plan_id,
      this.pickNested(eventRecord.data, ['plan', 'id']),
      this.pickNested(eventRecord.data, ['subscription', 'plan_id']),
    ]);
  }

  private inferPlanSlug(eventRecord: { data: Record<string, unknown> }): string | null {
    return this.firstString([
      eventRecord.data.planSlug,
      eventRecord.data.plan_slug,
      this.pickNested(eventRecord.data, ['plan', 'slug']),
      this.pickNested(eventRecord.data, ['plan', 'name']),
    ]);
  }

  private inferSubscriptionId(eventRecord: {
    data: Record<string, unknown>;
  }): string | null {
    return this.firstString([
      eventRecord.data.subscriptionId,
      eventRecord.data.subscription_id,
      this.pickNested(eventRecord.data, ['subscription', 'id']),
    ]);
  }

  private inferCustomerId(eventRecord: { data: Record<string, unknown> }): string | null {
    return this.firstString([
      eventRecord.data.customerId,
      eventRecord.data.customer_id,
      this.pickNested(eventRecord.data, ['customer', 'id']),
      this.pickNested(eventRecord.data, ['payer', 'id']),
    ]);
  }

  private inferDate(
    eventRecord: { data: Record<string, unknown> },
    keys: string[],
  ): Date | null {
    for (const key of keys) {
      const direct = eventRecord.data[key];
      const parsedDirect = this.toDate(direct);
      if (parsedDirect) {
        return parsedDirect;
      }
    }

    return null;
  }

  private inferCancelAtPeriodEnd(eventRecord: {
    data: Record<string, unknown>;
  }): boolean {
    const value =
      eventRecord.data.cancelAtPeriodEnd ??
      eventRecord.data.cancel_at_period_end ??
      this.pickNested(eventRecord.data, ['subscription', 'cancel_at_period_end']);

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1';
    }

    return false;
  }

  private normalizeStatus(value: string | null): BillingStatus | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (
      normalized === 'none' ||
      normalized === 'trialing' ||
      normalized === 'active' ||
      normalized === 'past_due' ||
      normalized === 'unpaid' ||
      normalized === 'incomplete' ||
      normalized === 'canceled'
    ) {
      return normalized;
    }

    if (normalized === 'cancelled') {
      return 'canceled';
    }

    return null;
  }

  private firstString(values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }

  private pickNested(source: Record<string, unknown>, path: string[]): unknown {
    let current: unknown = source;
    for (const segment of path) {
      if (!current || typeof current !== 'object') {
        return null;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
      const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
      const parsed = new Date(timestamp);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof value === 'string' && value.length > 0) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private toBillingSnapshot(billing: {
    organizationId: string;
    provider: string;
    status: BillingStatus;
    planId: string | null;
    planSlug: string | null;
    subscriptionId: string | null;
    customerId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    cancelAtPeriodEnd: boolean;
    lastEventId: string | null;
    lastEventAt: Date | null;
    updatedAt: Date;
  }): BillingSnapshot {
    return {
      organizationId: billing.organizationId,
      provider: billing.provider === 'clerk' ? 'clerk' : 'clerk',
      status: billing.status,
      planId: billing.planId,
      planSlug: billing.planSlug,
      subscriptionId: billing.subscriptionId,
      customerId: billing.customerId,
      currentPeriodStart: billing.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null,
      trialEndsAt: billing.trialEndsAt?.toISOString() ?? null,
      cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
      lastEventId: billing.lastEventId,
      lastEventAt: billing.lastEventAt?.toISOString() ?? null,
      updatedAt: billing.updatedAt.toISOString(),
    };
  }

  private sanitizedHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, string> {
    const output: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.startsWith('svix-') ||
        lowerKey === 'content-type' ||
        lowerKey === 'user-agent'
      ) {
        if (Array.isArray(value)) {
          output[lowerKey] = value.join(',');
        } else if (typeof value === 'string') {
          output[lowerKey] = value;
        }
      }
    }

    return output;
  }

  private async persistWebhookEvent(params: {
    eventId: string;
    eventType: string;
    status: BillingWebhookEventStatus;
    payload: Record<string, unknown>;
    headers: Record<string, string>;
    occurredAt: Date | null;
    failureReason?: string;
  }): Promise<void> {
    try {
      await this.prisma.billingWebhookEvent.create({
        data: {
          provider: 'clerk',
          eventId: params.eventId,
          eventType: params.eventType,
          status: params.status,
          payloadJson: params.payload as Prisma.InputJsonValue,
          headersJson: params.headers as Prisma.InputJsonValue,
          occurredAt: params.occurredAt,
          processedAt: new Date(),
          failureReason: params.failureReason ?? null,
        },
      });
    } catch {
      // Ignore duplicate event write races.
    }
  }

  private makeFallbackEventId(): string {
    return `evt_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }
}
