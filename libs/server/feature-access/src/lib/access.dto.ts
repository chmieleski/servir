import {
  ApproveOrganizationRequestSchema,
  AuthMeResponseSchema,
  CreateOrganizationInvitationSchema,
  CreateOrganizationRequestSchema,
  DenyOrganizationRequestSchema,
  ListOrganizationMembersQuerySchema,
  ListOrganizationRequestsQuerySchema,
  ListPlatformUsersQuerySchema,
  OrganizationIdParamSchema,
  OrganizationInvitationResponseSchema,
  OrganizationMemberDeleteResponseSchema,
  OrganizationMemberListResponseSchema,
  OrganizationMemberMutationResponseSchema,
  OrganizationMembershipIdParamSchema,
  OrganizationRequestIdParamSchema,
  OrganizationRequestListResponseSchema,
  OrganizationRequestSchema,
  PlatformUserListResponseSchema,
  UpdateOrganizationMemberRoleSchema,
} from '@servir/contracts';
import { createZodDto } from 'nestjs-zod';

export class AuthMeResponseDto extends createZodDto(AuthMeResponseSchema) {}

export class CreateOrganizationRequestDto extends createZodDto(
  CreateOrganizationRequestSchema,
) {}

export class ListOrganizationRequestsQueryDto extends createZodDto(
  ListOrganizationRequestsQuerySchema,
) {}

export class OrganizationRequestDto extends createZodDto(OrganizationRequestSchema) {}

export class OrganizationRequestListResponseDto extends createZodDto(
  OrganizationRequestListResponseSchema,
) {}

export class OrganizationRequestIdParamDto extends createZodDto(
  OrganizationRequestIdParamSchema,
) {}

export class ApproveOrganizationRequestDto extends createZodDto(
  ApproveOrganizationRequestSchema,
) {}

export class DenyOrganizationRequestDto extends createZodDto(
  DenyOrganizationRequestSchema,
) {}

export class ListPlatformUsersQueryDto extends createZodDto(ListPlatformUsersQuerySchema) {}

export class PlatformUserListResponseDto extends createZodDto(
  PlatformUserListResponseSchema,
) {}

export class OrganizationIdParamDto extends createZodDto(OrganizationIdParamSchema) {}

export class OrganizationMembershipIdParamDto extends createZodDto(
  OrganizationMembershipIdParamSchema,
) {}

export class ListOrganizationMembersQueryDto extends createZodDto(
  ListOrganizationMembersQuerySchema,
) {}

export class OrganizationMemberListResponseDto extends createZodDto(
  OrganizationMemberListResponseSchema,
) {}

export class CreateOrganizationInvitationDto extends createZodDto(
  CreateOrganizationInvitationSchema,
) {}

export class OrganizationInvitationResponseDto extends createZodDto(
  OrganizationInvitationResponseSchema,
) {}

export class UpdateOrganizationMemberRoleDto extends createZodDto(
  UpdateOrganizationMemberRoleSchema,
) {}

export class OrganizationMemberMutationResponseDto extends createZodDto(
  OrganizationMemberMutationResponseSchema,
) {}

export class OrganizationMemberDeleteResponseDto extends createZodDto(
  OrganizationMemberDeleteResponseSchema,
) {}
