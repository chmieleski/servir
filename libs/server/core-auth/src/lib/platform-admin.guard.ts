import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiHttpException } from '@servir/core';
import { AUTH_CONTEXT_REQUEST_KEY } from './auth.constants.js';
import type { ServirAuthContext } from './auth.types.js';

type AuthenticatedRequest = {
  [AUTH_CONTEXT_REQUEST_KEY]?: ServirAuthContext;
};

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authContext = request[AUTH_CONTEXT_REQUEST_KEY];

    if (!authContext) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!authContext.isPlatformAdmin) {
      throw new ApiHttpException({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Platform administrator permission is required.',
      });
    }

    return true;
  }
}
