import { createClerkClient, type ClerkClient } from '@clerk/backend';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@servir/config';
import type { OrganizationRole, ServirAuthContext } from './auth.types.js';

export type ClerkUserRecord = {
  id: string;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId: string | null;
  firstName: string | null;
  lastName: string | null;
  banned: boolean;
  createdAt: Date | string | number;
  privateMetadata: Record<string, unknown>;
};

export type ClerkOrganizationMembershipRecord = {
  id: string;
  organization: { id: string; name: string };
  role: string;
  publicUserData: {
    userId: string | null;
    identifier: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
};

export type ClerkOrganizationInvitationRecord = {
  id: string;
  emailAddress: string;
  role: string;
  status: string;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
};

export type ClerkOrganizationRecord = {
  id: string;
  name: string;
  slug: string | null;
};

type TestUser = ClerkUserRecord;

type TestMembership = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
};

type TestOrganization = {
  id: string;
  name: string;
  slug: string | null;
  memberships: Map<string, TestMembership>;
};

@Injectable()
export class ClerkAuthService {
  private readonly clerkClient: ClerkClient;
  private readonly clerkPublishableKey: string;
  private readonly clerkSecretKey: string;
  private readonly authorizedParties: string[];
  private readonly testMode: boolean;

  private readonly testUsers = new Map<string, TestUser>();
  private readonly testOrganizations = new Map<string, TestOrganization>();
  private readonly testFailOnceSlugs = new Set<string>();
  private orgCounter = 0;
  private membershipCounter = 0;
  private invitationCounter = 0;

  constructor(configService: ConfigService<Env, true>) {
    this.clerkPublishableKey = configService.get('CLERK_PUBLISHABLE_KEY', {
      infer: true,
    });
    this.clerkSecretKey = configService.get('CLERK_SECRET_KEY', { infer: true });
    this.authorizedParties = configService
      .get('CLERK_AUTHORIZED_PARTIES', { infer: true })
      .split(',')
      .map((party) => party.trim())
      .filter((party) => party.length > 0);
    this.testMode = configService.get('AUTH_E2E_TEST_MODE', { infer: true });

    this.clerkClient = createClerkClient({
      publishableKey: this.clerkPublishableKey,
      secretKey: this.clerkSecretKey,
    });
  }

  isTestMode(): boolean {
    return this.testMode;
  }

  registerTestUser(authContext: ServirAuthContext): void {
    if (!this.testMode) {
      return;
    }

    const existing = this.testUsers.get(authContext.userId);
    const privateMetadata = {
      ...(existing?.privateMetadata ?? {}),
      ...(authContext.isPlatformAdmin ? { platformRole: 'platform_admin' } : {}),
    };

    this.testUsers.set(authContext.userId, {
      id: authContext.userId,
      emailAddresses: authContext.email
        ? [{ id: `email_${authContext.userId}`, emailAddress: authContext.email }]
        : [],
      primaryEmailAddressId: authContext.email ? `email_${authContext.userId}` : null,
      firstName: authContext.firstName,
      lastName: authContext.lastName,
      banned: false,
      createdAt: existing?.createdAt ?? new Date(),
      privateMetadata,
    });
  }

  async authenticateRequest(request: Request) {
    return this.clerkClient.authenticateRequest(request, {
      secretKey: this.clerkSecretKey,
      authorizedParties: this.authorizedParties,
    });
  }

  async getUser(userId: string): Promise<ClerkUserRecord> {
    if (this.testMode) {
      return this.ensureTestUser(userId);
    }

    const user = await this.clerkClient.users.getUser(userId);
    return {
      id: user.id,
      emailAddresses: user.emailAddresses.map((email) => ({
        id: email.id,
        emailAddress: email.emailAddress,
      })),
      primaryEmailAddressId: user.primaryEmailAddressId,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      banned: Boolean(user.banned),
      createdAt: user.createdAt,
      privateMetadata: this.toRecord(user.privateMetadata),
    };
  }

  async getUserList(params: {
    limit: number;
    offset: number;
    query?: string;
  }): Promise<{ data: ClerkUserRecord[]; totalCount: number }> {
    if (this.testMode) {
      const users = Array.from(this.testUsers.values()).filter((user) =>
        this.userMatchesQuery(user, params.query),
      );
      const sliced = users.slice(params.offset, params.offset + params.limit);
      return {
        data: sliced,
        totalCount: users.length,
      };
    }

    const response = await this.clerkClient.users.getUserList({
      limit: params.limit,
      offset: params.offset,
      ...(params.query ? { query: params.query } : {}),
    });

    return {
      data: response.data.map((user) => ({
        id: user.id,
        emailAddresses: user.emailAddresses.map((email) => ({
          id: email.id,
          emailAddress: email.emailAddress,
        })),
        primaryEmailAddressId: user.primaryEmailAddressId,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        banned: Boolean(user.banned),
        createdAt: user.createdAt,
        privateMetadata: this.toRecord(user.privateMetadata),
      })),
      totalCount: response.totalCount,
    };
  }

  async listUserOrganizationMemberships(params: {
    userId: string;
    limit: number;
    offset?: number;
  }): Promise<{ data: ClerkOrganizationMembershipRecord[]; totalCount: number }> {
    if (this.testMode) {
      const memberships = Array.from(this.testOrganizations.values())
        .flatMap((organization) =>
          Array.from(organization.memberships.values()).filter(
            (membership) => membership.userId === params.userId,
          ),
        )
        .map((membership) => this.toTestMembershipRecord(membership));

      const offset = params.offset ?? 0;
      return {
        data: memberships.slice(offset, offset + params.limit),
        totalCount: memberships.length,
      };
    }

    const response = await this.clerkClient.users.getOrganizationMembershipList({
      userId: params.userId,
      limit: params.limit,
      ...(typeof params.offset === 'number' ? { offset: params.offset } : {}),
    });

    return {
      data: response.data.map((membership) => ({
        id: membership.id,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
        },
        role: membership.role,
        publicUserData: {
          userId: membership.publicUserData?.userId ?? null,
          identifier: membership.publicUserData?.identifier ?? null,
          firstName: membership.publicUserData?.firstName ?? null,
          lastName: membership.publicUserData?.lastName ?? null,
        },
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      })),
      totalCount: response.totalCount,
    };
  }

  async listOrganizationMemberships(params: {
    organizationId: string;
    limit: number;
    offset?: number;
  }): Promise<{ data: ClerkOrganizationMembershipRecord[]; totalCount: number }> {
    if (this.testMode) {
      const organization = this.testOrganizations.get(params.organizationId);
      const memberships = organization
        ? Array.from(organization.memberships.values()).map((membership) =>
            this.toTestMembershipRecord(membership),
          )
        : [];
      const offset = params.offset ?? 0;
      return {
        data: memberships.slice(offset, offset + params.limit),
        totalCount: memberships.length,
      };
    }

    const response =
      await this.clerkClient.organizations.getOrganizationMembershipList({
        organizationId: params.organizationId,
        limit: params.limit,
        ...(typeof params.offset === 'number' ? { offset: params.offset } : {}),
      });

    return {
      data: response.data.map((membership) => ({
        id: membership.id,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
        },
        role: membership.role,
        publicUserData: {
          userId: membership.publicUserData?.userId ?? null,
          identifier: membership.publicUserData?.identifier ?? null,
          firstName: membership.publicUserData?.firstName ?? null,
          lastName: membership.publicUserData?.lastName ?? null,
        },
        createdAt: membership.createdAt,
        updatedAt: membership.updatedAt,
      })),
      totalCount: response.totalCount,
    };
  }

  async createOrganization(params: {
    name: string;
    slug: string;
    createdBy: string;
    maxAllowedMemberships: number;
  }): Promise<ClerkOrganizationRecord> {
    if (this.testMode) {
      const creator = this.ensureTestUser(params.createdBy);
      if (
        params.slug.includes('fail-once') &&
        !this.testFailOnceSlugs.has(params.slug)
      ) {
        this.testFailOnceSlugs.add(params.slug);
        throw new Error('Simulated Clerk organization creation failure.');
      }

      this.orgCounter += 1;
      const organizationId = `org_test_${this.orgCounter}`;
      const organization: TestOrganization = {
        id: organizationId,
        name: params.name,
        slug: params.slug,
        memberships: new Map(),
      };
      const membership = this.createTestMembership({
        organizationId,
        userId: creator.id,
        role: 'org:admin',
      });
      organization.memberships.set(membership.id, membership);
      this.testOrganizations.set(organizationId, organization);

      return {
        id: organizationId,
        name: params.name,
        slug: params.slug,
      };
    }

    const organization = await this.clerkClient.organizations.createOrganization({
      name: params.name,
      slug: params.slug,
      createdBy: params.createdBy,
      maxAllowedMemberships: params.maxAllowedMemberships,
    });

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug ?? null,
    };
  }

  async createOrganizationInvitation(params: {
    organizationId: string;
    inviterUserId: string;
    emailAddress: string;
    role: OrganizationRole;
  }): Promise<ClerkOrganizationInvitationRecord> {
    if (this.testMode) {
      this.ensureTestUser(params.inviterUserId);
      this.invitationCounter += 1;
      const timestamp = new Date();
      return {
        id: `orginv_test_${this.invitationCounter}`,
        emailAddress: params.emailAddress,
        role: params.role,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    const invitation =
      await this.clerkClient.organizations.createOrganizationInvitation({
        organizationId: params.organizationId,
        inviterUserId: params.inviterUserId,
        emailAddress: params.emailAddress,
        role: params.role,
      });

    return {
      id: invitation.id,
      emailAddress: invitation.emailAddress,
      role: invitation.role,
      status: invitation.status ?? 'pending',
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }

  async updateOrganizationMembership(params: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
  }): Promise<ClerkOrganizationMembershipRecord> {
    if (this.testMode) {
      const organization = this.testOrganizations.get(params.organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const membership = Array.from(organization.memberships.values()).find(
        (entry) => entry.userId === params.userId,
      );

      if (!membership) {
        throw new Error('Organization membership not found');
      }

      membership.role = params.role;
      membership.updatedAt = new Date();
      organization.memberships.set(membership.id, membership);
      return this.toTestMembershipRecord(membership);
    }

    const membership =
      await this.clerkClient.organizations.updateOrganizationMembership({
        organizationId: params.organizationId,
        userId: params.userId,
        role: params.role,
      });

    return {
      id: membership.id,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
      },
      role: membership.role,
      publicUserData: {
        userId: membership.publicUserData?.userId ?? null,
        identifier: membership.publicUserData?.identifier ?? null,
        firstName: membership.publicUserData?.firstName ?? null,
        lastName: membership.publicUserData?.lastName ?? null,
      },
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }

  async deleteOrganizationMembership(params: {
    organizationId: string;
    userId: string;
  }): Promise<void> {
    if (this.testMode) {
      const organization = this.testOrganizations.get(params.organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      const membership = Array.from(organization.memberships.values()).find(
        (entry) => entry.userId === params.userId,
      );
      if (!membership) {
        throw new Error('Organization membership not found');
      }

      organization.memberships.delete(membership.id);
      return;
    }

    await this.clerkClient.organizations.deleteOrganizationMembership({
      organizationId: params.organizationId,
      userId: params.userId,
    });
  }

  private createTestMembership(params: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
  }): TestMembership {
    this.membershipCounter += 1;
    const now = new Date();
    return {
      id: `orgmem_test_${this.membershipCounter}`,
      organizationId: params.organizationId,
      userId: params.userId,
      role: params.role,
      createdAt: now,
      updatedAt: now,
    };
  }

  private toTestMembershipRecord(
    membership: TestMembership,
  ): ClerkOrganizationMembershipRecord {
    const organization = this.testOrganizations.get(membership.organizationId);
    const user = this.ensureTestUser(membership.userId);
    return {
      id: membership.id,
      organization: {
        id: membership.organizationId,
        name: organization?.name ?? 'Unknown Organization',
      },
      role: membership.role,
      publicUserData: {
        userId: user.id,
        identifier: this.extractEmail(user),
        firstName: user.firstName,
        lastName: user.lastName,
      },
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }

  private ensureTestUser(userId: string): TestUser {
    const existing = this.testUsers.get(userId);
    if (existing) {
      return existing;
    }

    const created: TestUser = {
      id: userId,
      emailAddresses: [],
      primaryEmailAddressId: null,
      firstName: null,
      lastName: null,
      banned: false,
      createdAt: new Date(),
      privateMetadata: {},
    };
    this.testUsers.set(userId, created);
    return created;
  }

  private userMatchesQuery(user: TestUser, query?: string): boolean {
    if (!query) {
      return true;
    }

    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) {
      return true;
    }

    return (
      user.id.toLowerCase().includes(normalized) ||
      (user.firstName ?? '').toLowerCase().includes(normalized) ||
      (user.lastName ?? '').toLowerCase().includes(normalized) ||
      user.emailAddresses.some((entry) =>
        entry.emailAddress.toLowerCase().includes(normalized),
      )
    );
  }

  private extractEmail(user: TestUser): string | null {
    if (!user.primaryEmailAddressId) {
      return null;
    }

    const email = user.emailAddresses.find(
      (entry) => entry.id === user.primaryEmailAddressId,
    );
    return email?.emailAddress ?? null;
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return {};
    }

    return value as Record<string, unknown>;
  }
}
