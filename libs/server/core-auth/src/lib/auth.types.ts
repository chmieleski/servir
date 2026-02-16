export type OrganizationRole = 'org:admin' | 'org:member';

export type ServirAuthContext = {
  userId: string;
  sessionId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isPlatformAdmin: boolean;
  activeOrganizationId: string | null;
  activeOrganizationRole: OrganizationRole | null;
};

export type ServirTestAuthPayload = {
  userId: string;
  sessionId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  platformRole?: string;
  activeOrganizationId?: string | null;
  activeOrganizationRole?: OrganizationRole | null;
  iat: number;
  exp: number;
};
