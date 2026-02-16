import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Env } from '@servir/config';
import { type BillingStatus } from '@servir/contracts';
import { ApiHttpException } from '@servir/core';
import {
  AUTH_CONTEXT_REQUEST_KEY,
  IS_PUBLIC_KEY,
  type ServirAuthContext,
} from '@servir/core-auth';
import { PrismaService } from '@servir/data-access';
import { BILLING_EXEMPT_KEY } from './billing-exempt.decorator.js';

type AuthenticatedRequest = {
  originalUrl?: string;
  url?: string;
  [AUTH_CONTEXT_REQUEST_KEY]?: ServirAuthContext;
};

@Injectable()
export class BillingGuard implements CanActivate {
  private readonly enforcementEnabled: boolean;
  private readonly activeStatuses: Set<BillingStatus>;
  private readonly exemptPathPrefixes: string[];

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    configService: ConfigService<Env, true>,
  ) {
    this.enforcementEnabled = configService.get('BILLING_ENFORCEMENT_ENABLED', {
      infer: true,
    });
    this.activeStatuses = new Set(
      configService
        .get('BILLING_ACTIVE_STATUSES', { infer: true })
        .split(',')
        .map((status) => status.trim())
        .filter((status): status is BillingStatus => this.isBillingStatus(status)),
    );

    this.exemptPathPrefixes = configService
      .get('BILLING_ALLOWED_PATHS', { infer: true })
      .split(',')
      .map((path) => path.trim())
      .filter((path) => path.length > 0);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enforcementEnabled) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isBillingExempt = this.reflector.getAllAndOverride<boolean>(
      BILLING_EXEMPT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isBillingExempt) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const requestPath = this.toRequestPath(request);

    if (this.exemptPathPrefixes.some((pathPrefix) => requestPath.startsWith(pathPrefix))) {
      return true;
    }

    const auth = request[AUTH_CONTEXT_REQUEST_KEY];
    if (!auth) {
      return true;
    }

    if (auth.isPlatformAdmin) {
      return true;
    }

    if (!auth.activeOrganizationId) {
      throw new ApiHttpException({
        status: 400,
        code: 'BILLING_CONTEXT_REQUIRED',
        message: 'Active organization context is required for this action.',
      });
    }

    const billing = await this.prisma.organizationBilling.findUnique({
      where: { organizationId: auth.activeOrganizationId },
      select: { status: true },
    });

    if (!billing || billing.status === 'none') {
      throw new ApiHttpException({
        status: 402,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'An active subscription is required for this organization.',
      });
    }

    if (!this.activeStatuses.has(billing.status)) {
      throw new ApiHttpException({
        status: 403,
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'The organization subscription is not active.',
      });
    }

    return true;
  }

  private toRequestPath(request: AuthenticatedRequest): string {
    const candidate = request.originalUrl ?? request.url ?? '/';
    const [path] = candidate.split('?');
    return path ?? '/';
  }

  private isBillingStatus(value: string): value is BillingStatus {
    return (
      value === 'none' ||
      value === 'trialing' ||
      value === 'active' ||
      value === 'past_due' ||
      value === 'unpaid' ||
      value === 'incomplete' ||
      value === 'canceled'
    );
  }
}
