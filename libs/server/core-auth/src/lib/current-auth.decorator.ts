import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AUTH_CONTEXT_REQUEST_KEY } from './auth.constants.js';
import type { ServirAuthContext } from './auth.types.js';

type AuthenticatedRequest = {
  [AUTH_CONTEXT_REQUEST_KEY]?: ServirAuthContext;
};

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ServirAuthContext => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authContext = request[AUTH_CONTEXT_REQUEST_KEY];

    if (!authContext) {
      throw new Error('Auth context is not available on the request.');
    }

    return authContext;
  },
);
