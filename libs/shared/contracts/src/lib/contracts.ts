import { z } from 'zod';

export const HealthQuerySchema = z.object({
  format: z.enum(['full', 'minimal']).optional(),
});

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
});

export const ApiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'SERIALIZATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'BAD_REQUEST',
  'INTERNAL_ERROR',
  'ORGANIZATION_REQUEST_PENDING_EXISTS',
  'ORGANIZATION_REQUEST_INVALID_STATE',
  'CLERK_OPERATION_FAILED',
  'BILLING_CONTEXT_REQUIRED',
  'SUBSCRIPTION_REQUIRED',
  'SUBSCRIPTION_INACTIVE',
  'WEBHOOK_SIGNATURE_INVALID',
  'WEBHOOK_EVENT_UNSUPPORTED',
]);

export const ApiErrorIssueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string().min(1),
  code: z.string().min(1),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string().min(1),
    issues: z.array(ApiErrorIssueSchema).default([]),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
    path: z.string().min(1),
  }),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const PaginatedMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const OrganizationRoleSchema = z.enum(['org:admin', 'org:member']);

export const AuthMeResponseSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  isPlatformAdmin: z.boolean(),
  activeOrganizationId: z.string().min(1).nullable(),
  activeOrganizationRole: OrganizationRoleSchema.nullable(),
});

export const OrganizationRequestStatusSchema = z.enum([
  'pending',
  'approved',
  'denied',
  'failed',
]);

export const OrganizationRequestSchema = z.object({
  id: z.string().uuid(),
  requesterUserId: z.string().min(1),
  requesterEmail: z.string().email().nullable(),
  organizationName: z.string().min(1),
  organizationSlug: z.string().min(1),
  justification: z.string().min(1),
  status: OrganizationRequestStatusSchema,
  decisionReason: z.string().nullable(),
  decisionedByUserId: z.string().nullable(),
  decisionedAt: z.string().datetime().nullable(),
  clerkOrganizationId: z.string().nullable(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateOrganizationRequestSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  justification: z.string().trim().min(10).max(2000),
});

export const ListOrganizationRequestsQuerySchema = PaginationQuerySchema.extend({
  status: OrganizationRequestStatusSchema.optional(),
});

export const OrganizationRequestListResponseSchema = z.object({
  items: z.array(OrganizationRequestSchema),
  meta: PaginatedMetaSchema,
});

export const OrganizationRequestIdParamSchema = z.object({
  requestId: z.string().uuid(),
});

export const ApproveOrganizationRequestSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
}).default({});

export const DenyOrganizationRequestSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const ListPlatformUsersQuerySchema = PaginationQuerySchema.extend({
  query: z.string().trim().min(1).max(120).optional(),
});

export const OrganizationMembershipSummarySchema = z.object({
  organizationId: z.string().min(1),
  organizationName: z.string().min(1),
  role: OrganizationRoleSchema,
});

export const PlatformUserSummarySchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  banned: z.boolean(),
  createdAt: z.string().datetime(),
  organizationMemberships: z.array(OrganizationMembershipSummarySchema),
});

export const PlatformUserListResponseSchema = z.object({
  items: z.array(PlatformUserSummarySchema),
  meta: PaginatedMetaSchema,
});

export const OrganizationIdParamSchema = z.object({
  orgId: z.string().min(1),
});

export const OrganizationMembershipIdParamSchema = OrganizationIdParamSchema.extend({
  membershipId: z.string().min(1),
});

export const ListOrganizationMembersQuerySchema = PaginationQuerySchema;

export const OrganizationMemberSchema = z.object({
  membershipId: z.string().min(1),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: OrganizationRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OrganizationMemberListResponseSchema = z.object({
  items: z.array(OrganizationMemberSchema),
  meta: PaginatedMetaSchema,
});

export const CreateOrganizationInvitationSchema = z.object({
  emailAddress: z.string().trim().email(),
  role: OrganizationRoleSchema.default('org:member'),
});

export const OrganizationInvitationResponseSchema = z.object({
  id: z.string().min(1),
  emailAddress: z.string().email(),
  role: OrganizationRoleSchema,
  status: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UpdateOrganizationMemberRoleSchema = z.object({
  role: OrganizationRoleSchema,
});

export const OrganizationMemberMutationResponseSchema = z.object({
  membershipId: z.string().min(1),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  role: OrganizationRoleSchema,
  updatedAt: z.string().datetime(),
});

export const OrganizationMemberDeleteResponseSchema = z.object({
  membershipId: z.string().min(1),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  removedAt: z.string().datetime(),
});

export const BillingStatusSchema = z.enum([
  'none',
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'incomplete',
  'canceled',
]);

export const BillingSnapshotSchema = z.object({
  organizationId: z.string().min(1),
  provider: z.literal('clerk'),
  status: BillingStatusSchema,
  planId: z.string().nullable(),
  planSlug: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  customerId: z.string().nullable(),
  currentPeriodStart: z.string().datetime().nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  trialEndsAt: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  lastEventId: z.string().nullable(),
  lastEventAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});

export const BillingMeResponseSchema = BillingSnapshotSchema;

export const PlatformBillingSubscriptionSummarySchema = z.object({
  organizationId: z.string().min(1),
  status: BillingStatusSchema,
  planSlug: z.string().nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});

export const ListPlatformBillingSubscriptionsQuerySchema =
  PaginationQuerySchema.extend({
    status: BillingStatusSchema.optional(),
  });

export const PlatformBillingSubscriptionListResponseSchema = z.object({
  items: z.array(PlatformBillingSubscriptionSummarySchema),
  meta: PaginatedMetaSchema,
});

export const ClerkWebhookAckSchema = z.object({
  status: z.enum(['processed', 'ignored', 'duplicate']),
  eventId: z.string().min(1),
});

export type HealthQuery = z.infer<typeof HealthQuerySchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiErrorIssue = z.infer<typeof ApiErrorIssueSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type PaginatedMeta = z.infer<typeof PaginatedMetaSchema>;
export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type OrganizationRequestStatus = z.infer<typeof OrganizationRequestStatusSchema>;
export type OrganizationRequest = z.infer<typeof OrganizationRequestSchema>;
export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;
export type ListOrganizationRequestsQuery = z.infer<typeof ListOrganizationRequestsQuerySchema>;
export type OrganizationRequestListResponse = z.infer<typeof OrganizationRequestListResponseSchema>;
export type ApproveOrganizationRequest = z.infer<typeof ApproveOrganizationRequestSchema>;
export type DenyOrganizationRequest = z.infer<typeof DenyOrganizationRequestSchema>;
export type ListPlatformUsersQuery = z.infer<typeof ListPlatformUsersQuerySchema>;
export type OrganizationMembershipSummary = z.infer<typeof OrganizationMembershipSummarySchema>;
export type PlatformUserSummary = z.infer<typeof PlatformUserSummarySchema>;
export type PlatformUserListResponse = z.infer<typeof PlatformUserListResponseSchema>;
export type ListOrganizationMembersQuery = z.infer<typeof ListOrganizationMembersQuerySchema>;
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;
export type OrganizationMemberListResponse = z.infer<typeof OrganizationMemberListResponseSchema>;
export type CreateOrganizationInvitation = z.infer<typeof CreateOrganizationInvitationSchema>;
export type OrganizationInvitationResponse = z.infer<typeof OrganizationInvitationResponseSchema>;
export type UpdateOrganizationMemberRole = z.infer<typeof UpdateOrganizationMemberRoleSchema>;
export type OrganizationMemberMutationResponse = z.infer<
  typeof OrganizationMemberMutationResponseSchema
>;
export type OrganizationMemberDeleteResponse = z.infer<
  typeof OrganizationMemberDeleteResponseSchema
>;
export type BillingStatus = z.infer<typeof BillingStatusSchema>;
export type BillingSnapshot = z.infer<typeof BillingSnapshotSchema>;
export type BillingMeResponse = z.infer<typeof BillingMeResponseSchema>;
export type PlatformBillingSubscriptionSummary = z.infer<
  typeof PlatformBillingSubscriptionSummarySchema
>;
export type ListPlatformBillingSubscriptionsQuery = z.infer<
  typeof ListPlatformBillingSubscriptionsQuerySchema
>;
export type PlatformBillingSubscriptionListResponse = z.infer<
  typeof PlatformBillingSubscriptionListResponseSchema
>;
export type ClerkWebhookAck = z.infer<typeof ClerkWebhookAckSchema>;
