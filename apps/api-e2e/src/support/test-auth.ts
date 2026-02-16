import { createHmac } from 'node:crypto';

type TestAuthInput = {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  platformRole?: string;
  activeOrganizationId?: string | null;
  activeOrganizationRole?: 'org:admin' | 'org:member' | null;
  ttlSeconds?: number;
};

export function createTestAuthHeader(input: TestAuthInput): string {
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = input.ttlSeconds ?? 60 * 60;
  const payload = {
    userId: input.userId,
    email: input.email ?? null,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    platformRole: input.platformRole,
    activeOrganizationId: input.activeOrganizationId ?? null,
    activeOrganizationRole: input.activeOrganizationRole ?? null,
    iat: now,
    exp: now + ttlSeconds,
  };

  const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = process.env.AUTH_E2E_TEST_SECRET ?? 'servir-e2e-secret';
  const signaturePart = createHmac('sha256', secret)
    .update(payloadPart)
    .digest('base64url');

  return `${payloadPart}.${signaturePart}`;
}
