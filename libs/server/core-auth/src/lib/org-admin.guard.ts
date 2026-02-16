import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiHttpException } from '@servir/core';
import { AUTH_CONTEXT_REQUEST_KEY } from './auth.constants.js';
import { ClerkAuthService } from './clerk-auth.service.js';
import type { ServirAuthContext } from './auth.types.js';

type AuthenticatedRequest = {
  params?: { orgId?: string };
  [AUTH_CONTEXT_REQUEST_KEY]?: ServirAuthContext;
};

@Injectable()
export class OrgAdminGuard implements CanActivate {
  constructor(private readonly clerkAuthService: ClerkAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authContext = request[AUTH_CONTEXT_REQUEST_KEY];

    if (!authContext) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    const organizationId = request.params?.orgId;
    if (!organizationId) {
      throw new ApiHttpException({
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Missing organization id route parameter.',
      });
    }

    if (authContext.isPlatformAdmin) {
      return true;
    }

    if (
      authContext.activeOrganizationId === organizationId &&
      authContext.activeOrganizationRole === 'org:admin'
    ) {
      return true;
    }

    const memberships = await this.clerkAuthService.listUserOrganizationMemberships({
      userId: authContext.userId,
      limit: 200,
    });

    const hasAdminMembership = memberships.data.some(
      (membership) =>
        membership.organization.id === organizationId && membership.role === 'org:admin',
    );

    if (!hasAdminMembership) {
      throw new ApiHttpException({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Organization administrator permission is required.',
      });
    }

    return true;
  }
}
