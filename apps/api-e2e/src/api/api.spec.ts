import axios from 'axios';
import {
  ApiErrorSchema,
  AuthMeResponseSchema,
  BillingMeResponseSchema,
  ClerkWebhookAckSchema,
  HealthResponseSchema,
  PlatformBillingSubscriptionListResponseSchema,
  OrganizationInvitationResponseSchema,
  OrganizationMemberDeleteResponseSchema,
  OrganizationMemberListResponseSchema,
  OrganizationMemberMutationResponseSchema,
  OrganizationRequestListResponseSchema,
  OrganizationRequestSchema,
  PlatformUserListResponseSchema,
} from '@servir/contracts';
import { createTestAuthHeader } from '../support/test-auth';

const TEST_AUTH_HEADER = 'x-servir-test-auth';

function withAuth(header: string) {
  return {
    headers: {
      [TEST_AUTH_HEADER]: header,
    },
  };
}

describe('servir api', () => {
  const runId = Date.now();
  const requesterAuth = createTestAuthHeader({
    userId: `user_requester_${runId}`,
    email: `requester_${runId}@example.com`,
    firstName: 'Requester',
    lastName: 'User',
  });
  const deniedRequesterAuth = createTestAuthHeader({
    userId: `user_denied_${runId}`,
    email: `denied_${runId}@example.com`,
    firstName: 'Denied',
    lastName: 'User',
  });
  const approvedRequesterUserId = `user_approved_${runId}`;
  const approvedRequesterAuthBase = {
    userId: approvedRequesterUserId,
    email: `approved_${runId}@example.com`,
    firstName: 'Approved',
    lastName: 'Owner',
  };
  const approvedRequesterAuth = createTestAuthHeader(approvedRequesterAuthBase);
  const retryRequesterAuth = createTestAuthHeader({
    userId: `user_retry_${runId}`,
    email: `retry_${runId}@example.com`,
    firstName: 'Retry',
    lastName: 'User',
  });
  const platformAdminAuth = createTestAuthHeader({
    userId: `user_platform_${runId}`,
    email: `platform_${runId}@example.com`,
    firstName: 'Platform',
    lastName: 'Admin',
    platformRole: 'platform_admin',
  });

  let deniedRequestId = '';
  let approvedRequestId = '';
  let approvedOrgId = '';
  let retryFailedRequestId = '';

  it('GET /api/v1/health should conform to HealthResponseSchema', async () => {
    const response = await axios.get('/api/v1/health');
    const parsed = HealthResponseSchema.safeParse(response.data);

    expect(response.status).toBe(200);
    expect(parsed.success).toBe(true);
  });

  it('GET /api/v1/health with invalid query should return standardized 400 envelope', async () => {
    const response = await axios.get('/api/v1/health', {
      params: { format: 'bad-value' },
      validateStatus: () => true,
    });

    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(400);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('GET /api/docs should expose swagger docs', async () => {
    const response = await axios.get('/api/docs', {
      validateStatus: () => true,
    });

    expect(response.status).toBe(200);
    expect(String(response.data)).toContain('Swagger UI');
  });

  it('should fail invalid response payload through serializer interceptor', async () => {
    const response = await axios.get('/api/v1/health/serialization-check', {
      validateStatus: () => true,
    });
    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(500);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('SERIALIZATION_ERROR');
    }
  });

  it('GET /api/v1/auth/me should reject unauthenticated requests', async () => {
    const response = await axios.get('/api/v1/auth/me', {
      validateStatus: () => true,
    });
    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(401);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('GET /api/v1/auth/me should return authenticated user context', async () => {
    const response = await axios.get('/api/v1/auth/me', withAuth(requesterAuth));
    const parsed = AuthMeResponseSchema.safeParse(response.data);

    expect(response.status).toBe(200);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.userId).toContain('user_requester_');
      expect(parsed.data.isPlatformAdmin).toBe(false);
    }
  });

  it('GET /api/v1/platform/users should forbid non-platform users', async () => {
    const response = await axios.get('/api/v1/platform/users', {
      ...withAuth(requesterAuth),
      validateStatus: () => true,
    });
    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(403);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('FORBIDDEN');
    }
  });

  it('GET /api/v1/billing/me should require active organization context', async () => {
    const response = await axios.get('/api/v1/billing/me', {
      ...withAuth(requesterAuth),
      validateStatus: () => true,
    });
    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(400);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('BILLING_CONTEXT_REQUIRED');
    }
  });

  it('GET /api/v1/billing/me should return default none status when no projection exists', async () => {
    const orgScopedAuth = createTestAuthHeader({
      userId: `user_billing_${runId}`,
      email: `billing_${runId}@example.com`,
      activeOrganizationId: `org_missing_${runId}`,
      activeOrganizationRole: 'org:admin',
    });

    const response = await axios.get('/api/v1/billing/me', withAuth(orgScopedAuth));
    const parsed = BillingMeResponseSchema.safeParse(response.data);

    expect(response.status).toBe(200);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('none');
      expect(parsed.data.organizationId).toContain('org_missing_');
    }
  });

  it('POST /api/v1/org-requests should create and block duplicate pending requests', async () => {
    const orgName = `Pending Org ${runId}`;

    const createdResponse = await axios.post(
      '/api/v1/org-requests',
      {
        organizationName: orgName,
        justification: 'Need this org to onboard a new customer account.',
      },
      withAuth(requesterAuth),
    );
    const createdParsed = OrganizationRequestSchema.safeParse(createdResponse.data);

    expect(createdResponse.status).toBe(201);
    expect(createdParsed.success).toBe(true);
    if (createdParsed.success) {
      expect(createdParsed.data.status).toBe('pending');
    }

    const duplicateResponse = await axios.post(
      '/api/v1/org-requests',
      {
        organizationName: orgName,
        justification: 'Trying duplicate pending request for same slug.',
      },
      {
        ...withAuth(requesterAuth),
        validateStatus: () => true,
      },
    );
    const duplicateParsed = ApiErrorSchema.safeParse(duplicateResponse.data);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateParsed.success).toBe(true);
    if (duplicateParsed.success) {
      expect(duplicateParsed.data.error.code).toBe('ORGANIZATION_REQUEST_PENDING_EXISTS');
    }
  });

  it('requesters and platform admins should list organization requests', async () => {
    const myResponse = await axios.get('/api/v1/org-requests/me', withAuth(requesterAuth));
    const myParsed = OrganizationRequestListResponseSchema.safeParse(myResponse.data);

    expect(myResponse.status).toBe(200);
    expect(myParsed.success).toBe(true);
    if (myParsed.success) {
      expect(myParsed.data.items.some((item) => item.status === 'pending')).toBe(true);
    }

    const platformResponse = await axios.get('/api/v1/platform/org-requests?status=pending', withAuth(platformAdminAuth));
    const platformParsed = OrganizationRequestListResponseSchema.safeParse(platformResponse.data);

    expect(platformResponse.status).toBe(200);
    expect(platformParsed.success).toBe(true);
    if (platformParsed.success) {
      expect(platformParsed.data.items.some((item) => item.status === 'pending')).toBe(true);
    }
  });

  it('platform admins should deny requests and requesters should see denial reason', async () => {
    const createResponse = await axios.post(
      '/api/v1/org-requests',
      {
        organizationName: `Denied Org ${runId}`,
        justification: 'Testing denied request flow.',
      },
      withAuth(deniedRequesterAuth),
    );
    const createdParsed = OrganizationRequestSchema.safeParse(createResponse.data);

    expect(createResponse.status).toBe(201);
    expect(createdParsed.success).toBe(true);
    if (createdParsed.success) {
      deniedRequestId = createdParsed.data.id;
    }

    const denyResponse = await axios.post(
      `/api/v1/platform/org-requests/${deniedRequestId}/deny`,
      {
        reason: 'Insufficient business information in request.',
      },
      withAuth(platformAdminAuth),
    );
    const denyParsed = OrganizationRequestSchema.safeParse(denyResponse.data);

    expect(denyResponse.status).toBe(201);
    expect(denyParsed.success).toBe(true);
    if (denyParsed.success) {
      expect(denyParsed.data.status).toBe('denied');
      expect(denyParsed.data.decisionReason).toContain('Insufficient business information');
    }

    const myDeniedResponse = await axios.get('/api/v1/org-requests/me?status=denied', withAuth(deniedRequesterAuth));
    const myDeniedParsed = OrganizationRequestListResponseSchema.safeParse(myDeniedResponse.data);

    expect(myDeniedResponse.status).toBe(200);
    expect(myDeniedParsed.success).toBe(true);
    if (myDeniedParsed.success) {
      const denied = myDeniedParsed.data.items.find((item) => item.id === deniedRequestId);
      expect(denied?.status).toBe('denied');
      expect(denied?.decisionReason).toContain('Insufficient business information');
    }
  });

  it('platform admins should approve requests and assign requester as org admin', async () => {
    const createResponse = await axios.post(
      '/api/v1/org-requests',
      {
        organizationName: `Approved Org ${runId}`,
        justification: 'Testing approved request flow.',
      },
      withAuth(approvedRequesterAuth),
    );
    const createdParsed = OrganizationRequestSchema.safeParse(createResponse.data);

    expect(createResponse.status).toBe(201);
    expect(createdParsed.success).toBe(true);
    if (createdParsed.success) {
      approvedRequestId = createdParsed.data.id;
    }

    const approveResponse = await axios.post(
      `/api/v1/platform/org-requests/${approvedRequestId}/approve`,
      {
        reason: 'Approved for onboarding.',
      },
      withAuth(platformAdminAuth),
    );
    const approveParsed = OrganizationRequestSchema.safeParse(approveResponse.data);

    expect(approveResponse.status).toBe(201);
    expect(approveParsed.success).toBe(true);
    if (approveParsed.success) {
      expect(approveParsed.data.status).toBe('approved');
      expect(approveParsed.data.clerkOrganizationId).toContain('org_');
      approvedOrgId = approveParsed.data.clerkOrganizationId ?? '';
    }
  });

  it('failed approvals should become retryable and succeed on retry', async () => {
    const createResponse = await axios.post(
      '/api/v1/org-requests',
      {
        organizationName: `Fail Once Org ${runId}`,
        justification: 'Testing failed approval then retry.',
      },
      withAuth(retryRequesterAuth),
    );
    const createdParsed = OrganizationRequestSchema.safeParse(createResponse.data);

    expect(createResponse.status).toBe(201);
    expect(createdParsed.success).toBe(true);
    if (createdParsed.success) {
      retryFailedRequestId = createdParsed.data.id;
    }

    const failResponse = await axios.post(
      `/api/v1/platform/org-requests/${retryFailedRequestId}/approve`,
      {
        reason: 'First attempt should fail in test mode.',
      },
      {
        ...withAuth(platformAdminAuth),
        validateStatus: () => true,
      },
    );
    const failParsed = ApiErrorSchema.safeParse(failResponse.data);

    expect(failResponse.status).toBe(502);
    expect(failParsed.success).toBe(true);
    if (failParsed.success) {
      expect(failParsed.data.error.code).toBe('CLERK_OPERATION_FAILED');
    }

    const failedQueueResponse = await axios.get('/api/v1/platform/org-requests?status=failed', withAuth(platformAdminAuth));
    const failedQueueParsed = OrganizationRequestListResponseSchema.safeParse(failedQueueResponse.data);

    expect(failedQueueResponse.status).toBe(200);
    expect(failedQueueParsed.success).toBe(true);
    if (failedQueueParsed.success) {
      expect(failedQueueParsed.data.items.some((item) => item.id === retryFailedRequestId)).toBe(true);
    }

    const retryResponse = await axios.post(
      `/api/v1/platform/org-requests/${retryFailedRequestId}/retry-approve`,
      {
        reason: 'Retry should succeed.',
      },
      withAuth(platformAdminAuth),
    );
    const retryParsed = OrganizationRequestSchema.safeParse(retryResponse.data);

    expect(retryResponse.status).toBe(201);
    expect(retryParsed.success).toBe(true);
    if (retryParsed.success) {
      expect(retryParsed.data.status).toBe('approved');
      expect(retryParsed.data.clerkOrganizationId).toContain('org_');
    }
  });

  it('platform admins should list users with curated fields', async () => {
    const response = await axios.get('/api/v1/platform/users?query=user_', withAuth(platformAdminAuth));
    const parsed = PlatformUserListResponseSchema.safeParse(response.data);

    expect(response.status).toBe(200);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.meta.total).toBeGreaterThan(0);
      expect(parsed.data.items[0]?.userId).toContain('user_');
    }
  });

  it('platform admins should list billing subscriptions', async () => {
    const response = await axios.get('/api/v1/platform/billing/subscriptions', withAuth(platformAdminAuth));
    const parsed = PlatformBillingSubscriptionListResponseSchema.safeParse(response.data);

    expect(response.status).toBe(200);
    expect(parsed.success).toBe(true);
  });

  it('POST /api/v1/internal/webhooks/clerk should reject invalid signatures', async () => {
    const response = await axios.post(
      '/api/v1/internal/webhooks/clerk',
      {
        type: 'billing.subscription.updated',
        data: {
          organization_id: `org_webhook_${runId}`,
          status: 'active',
        },
      },
      {
        headers: {
          'svix-id': `msg_${runId}`,
          'svix-timestamp': `${Math.floor(Date.now() / 1000)}`,
          'svix-signature': 'v1,invalid',
        },
        validateStatus: () => true,
      },
    );
    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(401);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('WEBHOOK_SIGNATURE_INVALID');
    }
  });

  it('org admins should manage members and non-admin users should be forbidden', async () => {
    const orgAdminAuth = createTestAuthHeader({
      ...approvedRequesterAuthBase,
      activeOrganizationId: approvedOrgId,
      activeOrganizationRole: 'org:admin',
    });

    const membersResponse = await axios.get(
      `/api/v1/organizations/${approvedOrgId}/members`,
      withAuth(orgAdminAuth),
    );
    const membersParsed = OrganizationMemberListResponseSchema.safeParse(membersResponse.data);

    expect(membersResponse.status).toBe(200);
    expect(membersParsed.success).toBe(true);

    let membershipId = '';
    if (membersParsed.success) {
      const adminMembership = membersParsed.data.items.find(
        (item) => item.userId === approvedRequesterUserId,
      );
      expect(adminMembership).toBeDefined();
      membershipId = adminMembership?.membershipId ?? '';
    }

    const inviteResponse = await axios.post(
      `/api/v1/organizations/${approvedOrgId}/invitations`,
      {
        emailAddress: `invitee_${runId}@example.com`,
        role: 'org:member',
      },
      withAuth(orgAdminAuth),
    );
    const inviteParsed = OrganizationInvitationResponseSchema.safeParse(inviteResponse.data);

    expect(inviteResponse.status).toBe(201);
    expect(inviteParsed.success).toBe(true);

    const updateRoleResponse = await axios.patch(
      `/api/v1/organizations/${approvedOrgId}/members/${membershipId}/role`,
      {
        role: 'org:member',
      },
      withAuth(orgAdminAuth),
    );
    const updateRoleParsed = OrganizationMemberMutationResponseSchema.safeParse(
      updateRoleResponse.data,
    );

    expect(updateRoleResponse.status).toBe(200);
    expect(updateRoleParsed.success).toBe(true);
    if (updateRoleParsed.success) {
      expect(updateRoleParsed.data.role).toBe('org:member');
    }

    const deleteResponse = await axios.delete(
      `/api/v1/organizations/${approvedOrgId}/members/${membershipId}`,
      withAuth(orgAdminAuth),
    );
    const deleteParsed = OrganizationMemberDeleteResponseSchema.safeParse(deleteResponse.data);

    expect(deleteResponse.status).toBe(200);
    expect(deleteParsed.success).toBe(true);

    const nonAdminAuth = createTestAuthHeader({
      userId: `user_nonadmin_${runId}`,
      email: `nonadmin_${runId}@example.com`,
      activeOrganizationId: approvedOrgId,
      activeOrganizationRole: 'org:member',
    });

    const forbiddenResponse = await axios.get(
      `/api/v1/organizations/${approvedOrgId}/members`,
      {
        ...withAuth(nonAdminAuth),
        validateStatus: () => true,
      },
    );
    const forbiddenParsed = ApiErrorSchema.safeParse(forbiddenResponse.data);

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenParsed.success).toBe(true);
    if (forbiddenParsed.success) {
      expect(forbiddenParsed.data.error.code).toBe('FORBIDDEN');
    }

    const platformMembersResponse = await axios.get(
      `/api/v1/organizations/${approvedOrgId}/members`,
      withAuth(platformAdminAuth),
    );
    const platformMembersParsed = OrganizationMemberListResponseSchema.safeParse(
      platformMembersResponse.data,
    );

    expect(platformMembersResponse.status).toBe(200);
    expect(platformMembersParsed.success).toBe(true);
  });
});
