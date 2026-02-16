import { Injectable } from '@nestjs/common';
import type {
  AuthMeResponse,
  CreateOrganizationInvitation,
  CreateOrganizationRequest,
  ListOrganizationMembersQuery,
  ListOrganizationRequestsQuery,
  ListPlatformUsersQuery,
  OrganizationMemberDeleteResponse,
  OrganizationMemberListResponse,
  OrganizationMemberMutationResponse,
  OrganizationRequest,
  OrganizationRequestListResponse,
  OrganizationRole,
  PlatformUserListResponse,
  UpdateOrganizationMemberRole,
} from '@servir/contracts';
import { ApiHttpException } from '@servir/core';
import { ClerkAuthService, type ServirAuthContext } from '@servir/core-auth';
import { PrismaService } from '@servir/data-access';
import type {
  OrganizationRequest as OrganizationRequestModel,
  OrganizationRequestStatus as OrganizationRequestStatusModel,
} from '@prisma/client';

type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

@Injectable()
export class AccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkAuthService: ClerkAuthService,
  ) {}

  getMe(auth: ServirAuthContext): AuthMeResponse {
    return {
      userId: auth.userId,
      email: auth.email,
      firstName: auth.firstName,
      lastName: auth.lastName,
      isPlatformAdmin: auth.isPlatformAdmin,
      activeOrganizationId: auth.activeOrganizationId,
      activeOrganizationRole: auth.activeOrganizationRole,
    };
  }

  async createOrganizationRequest(
    auth: ServirAuthContext,
    input: CreateOrganizationRequest,
  ): Promise<OrganizationRequest> {
    const normalizedSlug = this.slugify(input.organizationName);

    const existingPending = await this.prisma.organizationRequest.findFirst({
      where: {
        requesterUserId: auth.userId,
        status: 'pending',
        OR: [
          { organizationSlug: normalizedSlug },
          { organizationSlug: { startsWith: `${normalizedSlug}-` } },
        ],
      },
    });

    if (existingPending) {
      throw new ApiHttpException({
        status: 409,
        code: 'ORGANIZATION_REQUEST_PENDING_EXISTS',
        message:
          'You already have a pending request for this organization slug.',
      });
    }
    const organizationSlug = await this.resolveUniqueSlug(normalizedSlug);

    const created = await this.prisma.organizationRequest.create({
      data: {
        requesterUserId: auth.userId,
        requesterEmail: auth.email,
        organizationName: input.organizationName,
        organizationSlug,
        justification: input.justification,
        status: 'pending',
      },
    });

    return this.toOrganizationRequest(created);
  }

  async listMyOrganizationRequests(
    auth: ServirAuthContext,
    query: ListOrganizationRequestsQuery,
  ): Promise<OrganizationRequestListResponse> {
    return this.listOrganizationRequests(
      {
        requesterUserId: auth.userId,
        ...(query.status ? { status: query.status } : {}),
      },
      query.page,
      query.pageSize,
    );
  }

  async listPlatformOrganizationRequests(
    query: ListOrganizationRequestsQuery,
  ): Promise<OrganizationRequestListResponse> {
    return this.listOrganizationRequests(
      {
        ...(query.status ? { status: query.status } : {}),
      },
      query.page,
      query.pageSize,
    );
  }

  async approveOrganizationRequest(
    requestId: string,
    actorUserId: string,
    reason?: string,
  ): Promise<OrganizationRequest> {
    const organizationRequest = await this.getOrganizationRequestById(requestId);

    if (organizationRequest.status !== 'pending') {
      throw new ApiHttpException({
        status: 409,
        code: 'ORGANIZATION_REQUEST_INVALID_STATE',
        message: 'Only pending requests can be approved.',
      });
    }

    return this.performApproval(organizationRequest, actorUserId, reason);
  }

  async retryApproveOrganizationRequest(
    requestId: string,
    actorUserId: string,
    reason?: string,
  ): Promise<OrganizationRequest> {
    const organizationRequest = await this.getOrganizationRequestById(requestId);

    if (organizationRequest.status !== 'failed') {
      throw new ApiHttpException({
        status: 409,
        code: 'ORGANIZATION_REQUEST_INVALID_STATE',
        message: 'Only failed requests can be retried for approval.',
      });
    }

    return this.performApproval(organizationRequest, actorUserId, reason);
  }

  async denyOrganizationRequest(
    requestId: string,
    actorUserId: string,
    reason: string,
  ): Promise<OrganizationRequest> {
    const organizationRequest = await this.getOrganizationRequestById(requestId);

    if (
      organizationRequest.status !== 'pending' &&
      organizationRequest.status !== 'failed'
    ) {
      throw new ApiHttpException({
        status: 409,
        code: 'ORGANIZATION_REQUEST_INVALID_STATE',
        message: 'Only pending or failed requests can be denied.',
      });
    }

    const updated = await this.prisma.organizationRequest.update({
      where: { id: requestId },
      data: {
        status: 'denied',
        decisionReason: reason,
        decisionedByUserId: actorUserId,
        decisionedAt: new Date(),
        failureCode: null,
        failureMessage: null,
      },
    });

    return this.toOrganizationRequest(updated);
  }

  async listPlatformUsers(
    query: ListPlatformUsersQuery,
  ): Promise<PlatformUserListResponse> {
    const limit = query.pageSize;
    const offset = (query.page - 1) * query.pageSize;

    const { data, totalCount } = await this.clerkAuthService.getUserList({
      limit,
      offset,
      ...(query.query ? { query: query.query } : {}),
    });

    const users = await Promise.all(
      data.map(async (user) => {
        const memberships = await this.clerkAuthService.listUserOrganizationMemberships({
          userId: user.id,
          limit: 200,
        });

        return {
          userId: user.id,
          email: this.extractPrimaryEmail(user),
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
          banned: Boolean(user.banned),
          createdAt: this.toIsoString(user.createdAt),
          organizationMemberships: memberships.data.map((membership) => ({
            organizationId: membership.organization.id,
            organizationName: membership.organization.name,
            role: this.normalizeOrganizationRole(membership.role),
          })),
        };
      }),
    );

    return {
      items: users,
      meta: this.toPaginatedMeta(query.page, query.pageSize, totalCount),
    };
  }

  async listOrganizationMembers(
    organizationId: string,
    query: ListOrganizationMembersQuery,
  ): Promise<OrganizationMemberListResponse> {
    const limit = query.pageSize;
    const offset = (query.page - 1) * query.pageSize;

    const { data, totalCount } =
      await this.clerkAuthService.listOrganizationMemberships({
        organizationId,
        limit,
        offset,
      });

    return {
      items: data.map((membership) => ({
        membershipId: membership.id,
        organizationId,
        userId: membership.publicUserData.userId ?? 'unknown',
        email: membership.publicUserData.identifier ?? null,
        firstName: membership.publicUserData.firstName ?? null,
        lastName: membership.publicUserData.lastName ?? null,
        role: this.normalizeOrganizationRole(membership.role),
        createdAt: this.toIsoString(membership.createdAt),
        updatedAt: this.toIsoString(membership.updatedAt),
      })),
      meta: this.toPaginatedMeta(query.page, query.pageSize, totalCount),
    };
  }

  async createOrganizationInvitation(
    organizationId: string,
    inviterUserId: string,
    input: CreateOrganizationInvitation,
  ) {
    const invitation = await this.clerkAuthService.createOrganizationInvitation({
      organizationId,
      inviterUserId,
      emailAddress: input.emailAddress,
      role: input.role,
    });

    return {
      id: invitation.id,
      emailAddress: invitation.emailAddress,
      role: this.normalizeOrganizationRole(invitation.role),
      status: invitation.status,
      createdAt: this.toIsoString(invitation.createdAt),
      updatedAt: this.toIsoString(invitation.updatedAt),
    };
  }

  async updateOrganizationMemberRole(
    organizationId: string,
    membershipId: string,
    input: UpdateOrganizationMemberRole,
  ): Promise<OrganizationMemberMutationResponse> {
    const membership = await this.findOrganizationMembershipById(
      organizationId,
      membershipId,
    );

    if (!membership || !membership.publicUserData.userId) {
      throw new ApiHttpException({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Organization membership not found.',
      });
    }

    const updated = await this.clerkAuthService.updateOrganizationMembership({
      organizationId,
      userId: membership.publicUserData.userId,
      role: input.role,
    });

    return {
      membershipId: updated.id,
      organizationId,
      userId: updated.publicUserData.userId ?? membership.publicUserData.userId,
      role: this.normalizeOrganizationRole(updated.role),
      updatedAt: this.toIsoString(updated.updatedAt),
    };
  }

  async deleteOrganizationMember(
    organizationId: string,
    membershipId: string,
  ): Promise<OrganizationMemberDeleteResponse> {
    const membership = await this.findOrganizationMembershipById(
      organizationId,
      membershipId,
    );

    if (!membership || !membership.publicUserData.userId) {
      throw new ApiHttpException({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Organization membership not found.',
      });
    }

    await this.clerkAuthService.deleteOrganizationMembership({
      organizationId,
      userId: membership.publicUserData.userId,
    });

    return {
      membershipId: membership.id,
      organizationId,
      userId: membership.publicUserData.userId,
      removedAt: new Date().toISOString(),
    };
  }

  private async listOrganizationRequests(
    where: {
      requesterUserId?: string;
      status?: OrganizationRequestStatusModel;
    },
    page: number,
    pageSize: number,
  ): Promise<OrganizationRequestListResponse> {
    const skip = (page - 1) * pageSize;

    const [requests, total] = await this.prisma.$transaction([
      this.prisma.organizationRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organizationRequest.count({ where }),
    ]);

    return {
      items: requests.map((request) => this.toOrganizationRequest(request)),
      meta: this.toPaginatedMeta(page, pageSize, total),
    };
  }

  private async performApproval(
    request: OrganizationRequestModel,
    actorUserId: string,
    reason?: string,
  ): Promise<OrganizationRequest> {
    try {
      const organization = await this.clerkAuthService.createOrganization({
        name: request.organizationName,
        slug: request.organizationSlug,
        createdBy: request.requesterUserId,
        maxAllowedMemberships: 0,
      });

      const updated = await this.prisma.organizationRequest.update({
        where: { id: request.id },
        data: {
          status: 'approved',
          decisionReason: reason ?? null,
          decisionedByUserId: actorUserId,
          decisionedAt: new Date(),
          clerkOrganizationId: organization.id,
          failureCode: null,
          failureMessage: null,
        },
      });

      return this.toOrganizationRequest(updated);
    } catch (error: unknown) {
      const errorMessage = this.toErrorMessage(error);
      await this.prisma.organizationRequest.update({
        where: { id: request.id },
        data: {
          status: 'failed',
          decisionReason: reason ?? null,
          decisionedByUserId: actorUserId,
          decisionedAt: new Date(),
          failureCode: 'CLERK_CREATE_ORGANIZATION_FAILED',
          failureMessage: errorMessage,
        },
      });

      throw new ApiHttpException({
        status: 502,
        code: 'CLERK_OPERATION_FAILED',
        message: 'Failed to create organization in Clerk.',
      });
    }
  }

  private async getOrganizationRequestById(
    requestId: string,
  ): Promise<OrganizationRequestModel> {
    const found = await this.prisma.organizationRequest.findUnique({
      where: { id: requestId },
    });

    if (!found) {
      throw new ApiHttpException({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Organization request was not found.',
      });
    }

    return found;
  }

  private async findOrganizationMembershipById(
    organizationId: string,
    membershipId: string,
  ) {
    const { data } = await this.clerkAuthService.listOrganizationMemberships({
      organizationId,
      limit: 500,
    });

    return data.find((membership) => membership.id === membershipId) ?? null;
  }

  private async resolveUniqueSlug(baseSlug: string): Promise<string> {
    const existing = await this.prisma.organizationRequest.findMany({
      where: {
        organizationSlug: {
          startsWith: baseSlug,
        },
      },
      select: {
        organizationSlug: true,
      },
    });

    const existingSlugs = new Set(existing.map((entry) => entry.organizationSlug));
    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
      suffix += 1;
    }

    return `${baseSlug}-${suffix}`;
  }

  private slugify(input: string): string {
    const slug = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    return slug.length > 0 ? slug : 'organization';
  }

  private toOrganizationRequest(
    request: OrganizationRequestModel,
  ): OrganizationRequest {
    return {
      id: request.id,
      requesterUserId: request.requesterUserId,
      requesterEmail: request.requesterEmail,
      organizationName: request.organizationName,
      organizationSlug: request.organizationSlug,
      justification: request.justification,
      status: request.status,
      decisionReason: request.decisionReason,
      decisionedByUserId: request.decisionedByUserId,
      decisionedAt: request.decisionedAt?.toISOString() ?? null,
      clerkOrganizationId: request.clerkOrganizationId,
      failureCode: request.failureCode,
      failureMessage: request.failureMessage,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }

  private toPaginatedMeta(
    page: number,
    pageSize: number,
    total: number,
  ): PaginatedMeta {
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return {
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  private normalizeOrganizationRole(role: string): OrganizationRole {
    if (role === 'org:admin') {
      return 'org:admin';
    }

    return 'org:member';
  }

  private extractPrimaryEmail(user: {
    emailAddresses: Array<{ id: string; emailAddress: string }>;
    primaryEmailAddressId: string | null;
  }): string | null {
    if (!user.primaryEmailAddressId) {
      return null;
    }

    const email = user.emailAddresses.find(
      (entry) => entry.id === user.primaryEmailAddressId,
    );
    return email?.emailAddress ?? null;
  }

  private toIsoString(value: Date | string | number | null | undefined): string {
    if (!value) {
      return new Date(0).toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return new Date(0).toISOString();
    }

    return parsedDate.toISOString();
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
      return 'Unknown Clerk error';
    }
  }
}
