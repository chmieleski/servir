import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Env } from '@servir/config';
import { ApiHttpException } from '@servir/core';
import {
  AUTH_CONTEXT_REQUEST_KEY,
  IS_PUBLIC_KEY,
  TEST_AUTH_HEADER,
} from './auth.constants.js';
import { ClerkAuthService } from './clerk-auth.service.js';
import type { OrganizationRole, ServirAuthContext, ServirTestAuthPayload } from './auth.types.js';

type AuthenticatedRequest = {
  method: string;
  protocol?: string;
  originalUrl?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  get?: (key: string) => string | undefined;
  [AUTH_CONTEXT_REQUEST_KEY]?: ServirAuthContext;
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clerkAuthService: ClerkAuthService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const testAuthContext = this.getTestAuthContext(request);
    if (testAuthContext) {
      request[AUTH_CONTEXT_REQUEST_KEY] = testAuthContext;
      this.clerkAuthService.registerTestUser(testAuthContext);
      return true;
    }

    if (!this.hasAuthenticationCredential(request)) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    let requestState;
    try {
      requestState = await this.clerkAuthService.authenticateRequest(
        this.toFetchRequest(request),
      );
    } catch {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication could not be verified.',
      });
    }

    if (!requestState.isAuthenticated) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    const auth = requestState.toAuth();
    if (!auth.userId) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication user context is missing.',
      });
    }

    const user = await this.clerkAuthService.getUser(auth.userId);
    const platformRole = this.extractPlatformRole(user.privateMetadata);
    const sessionClaims = this.toClaimsRecord(auth.sessionClaims);

    request[AUTH_CONTEXT_REQUEST_KEY] = {
      userId: auth.userId,
      sessionId: auth.sessionId ?? null,
      email: this.extractPrimaryEmail(user.emailAddresses, user.primaryEmailAddressId),
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      isPlatformAdmin: platformRole === 'platform_admin',
      activeOrganizationId: this.toStringOrNull(sessionClaims.org_id),
      activeOrganizationRole: this.toOrganizationRole(sessionClaims.org_role),
    };

    return true;
  }

  private getTestAuthContext(
    request: AuthenticatedRequest,
  ): ServirAuthContext | null {
    const testMode = this.configService.get('AUTH_E2E_TEST_MODE', { infer: true });
    if (!testMode) {
      return null;
    }

    const rawHeader = request.headers[TEST_AUTH_HEADER];
    if (!rawHeader || Array.isArray(rawHeader)) {
      return null;
    }

    const [payloadPart, signaturePart] = rawHeader.split('.');
    if (!payloadPart || !signaturePart) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Malformed test authentication header.',
      });
    }

    const expectedSignature = createHmac(
      'sha256',
      this.configService.get('AUTH_E2E_TEST_SECRET', { infer: true }),
    )
      .update(payloadPart)
      .digest('base64url');

    const providedSignature = Buffer.from(signaturePart);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      providedSignature.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(providedSignature, expectedSignatureBuffer)
    ) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid test authentication signature.',
      });
    }

    let payload: ServirTestAuthPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    } catch {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid test authentication payload.',
      });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
      typeof payload.exp !== 'number' ||
      typeof payload.iat !== 'number' ||
      payload.exp <= nowSeconds
    ) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Expired test authentication payload.',
      });
    }

    if (typeof payload.userId !== 'string' || payload.userId.length === 0) {
      throw new ApiHttpException({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Test authentication payload is missing userId.',
      });
    }

    return {
      userId: payload.userId,
      sessionId: payload.sessionId ?? null,
      email: payload.email ?? null,
      firstName: payload.firstName ?? null,
      lastName: payload.lastName ?? null,
      isPlatformAdmin: payload.platformRole === 'platform_admin',
      activeOrganizationId: payload.activeOrganizationId ?? null,
      activeOrganizationRole:
        payload.activeOrganizationRole && payload.activeOrganizationRole === 'org:admin'
          ? 'org:admin'
          : payload.activeOrganizationRole === 'org:member'
            ? 'org:member'
            : null,
    };
  }

  private toFetchRequest(request: AuthenticatedRequest): Request {
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(','));
        continue;
      }
      if (typeof value === 'string') {
        headers.set(key, value);
      }
    }

    const host = request.get?.('host') ?? this.toStringOrNull(request.headers.host) ?? 'localhost';
    const protocol = request.protocol ?? 'http';
    const path = request.originalUrl ?? request.url ?? '/';

    return new Request(`${protocol}://${host}${path}`, {
      method: request.method,
      headers,
    });
  }

  private hasAuthenticationCredential(request: AuthenticatedRequest): boolean {
    const authorizationHeader = request.headers.authorization;
    const authorization = Array.isArray(authorizationHeader)
      ? authorizationHeader[0] ?? ''
      : authorizationHeader ?? '';

    if (typeof authorization === 'string') {
      const trimmed = authorization.trim();
      if (trimmed.toLowerCase().startsWith('bearer ') && trimmed.length > 'bearer '.length) {
        return true;
      }
    }

    const cookieHeader = request.headers.cookie;
    const cookie = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader ?? '';
    return typeof cookie === 'string' && cookie.includes('__session=');
  }

  private toClaimsRecord(sessionClaims: unknown): Record<string, unknown> {
    if (sessionClaims && typeof sessionClaims === 'object') {
      return sessionClaims as Record<string, unknown>;
    }

    return {};
  }

  private extractPrimaryEmail(
    emails: Array<{ id: string; emailAddress: string }>,
    primaryEmailAddressId: string | null,
  ): string | null {
    if (!primaryEmailAddressId) {
      return null;
    }

    const email = emails.find((entry) => entry.id === primaryEmailAddressId);
    return email?.emailAddress ?? null;
  }

  private extractPlatformRole(privateMetadata: unknown): string | null {
    if (!privateMetadata || typeof privateMetadata !== 'object') {
      return null;
    }

    const record = privateMetadata as Record<string, unknown>;
    if (typeof record.platformRole === 'string') {
      return record.platformRole;
    }

    if (typeof record.platform_role === 'string') {
      return record.platform_role;
    }

    return null;
  }

  private toStringOrNull(value: unknown): string | null {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    return null;
  }

  private toOrganizationRole(value: unknown): OrganizationRole | null {
    if (value === 'org:admin' || value === 'org:member') {
      return value;
    }

    return null;
  }
}
