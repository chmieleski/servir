import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  OrganizationInvitationResponse,
  OrganizationMemberDeleteResponse,
  OrganizationMemberListResponse,
  OrganizationMemberMutationResponse,
} from '@servir/contracts';
import { CurrentAuth, OrgAdminGuard, type ServirAuthContext } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import { AccessService } from './access.service.js';
import {
  CreateOrganizationInvitationDto,
  ListOrganizationMembersQueryDto,
  OrganizationIdParamDto,
  OrganizationInvitationResponseDto,
  OrganizationMemberDeleteResponseDto,
  OrganizationMemberListResponseDto,
  OrganizationMemberMutationResponseDto,
  OrganizationMembershipIdParamDto,
  UpdateOrganizationMemberRoleDto,
} from './access.dto.js';

@Controller('organizations/:orgId')
@UseGuards(OrgAdminGuard)
export class OrganizationMembersController {
  constructor(private readonly accessService: AccessService) {}

  @Get('members')
  @ZodResponse({
    status: 200,
    description: 'List organization members',
    type: OrganizationMemberListResponseDto,
  })
  async listMembers(
    @Param() params: OrganizationIdParamDto,
    @Query() query: ListOrganizationMembersQueryDto,
  ): Promise<OrganizationMemberListResponse> {
    return this.accessService.listOrganizationMembers(params.orgId, query);
  }

  @Post('invitations')
  @ZodResponse({
    status: 201,
    description: 'Create organization invitation',
    type: OrganizationInvitationResponseDto,
  })
  async createInvitation(
    @CurrentAuth() auth: ServirAuthContext,
    @Param() params: OrganizationIdParamDto,
    @Body() body: CreateOrganizationInvitationDto,
  ): Promise<OrganizationInvitationResponse> {
    return this.accessService.createOrganizationInvitation(
      params.orgId,
      auth.userId,
      body,
    );
  }

  @Patch('members/:membershipId/role')
  @ZodResponse({
    status: 200,
    description: 'Update member role',
    type: OrganizationMemberMutationResponseDto,
  })
  async updateMemberRole(
    @Param() params: OrganizationMembershipIdParamDto,
    @Body() body: UpdateOrganizationMemberRoleDto,
  ): Promise<OrganizationMemberMutationResponse> {
    return this.accessService.updateOrganizationMemberRole(
      params.orgId,
      params.membershipId,
      body,
    );
  }

  @Delete('members/:membershipId')
  @ZodResponse({
    status: 200,
    description: 'Remove organization member',
    type: OrganizationMemberDeleteResponseDto,
  })
  async removeMember(
    @Param() params: OrganizationMembershipIdParamDto,
  ): Promise<OrganizationMemberDeleteResponse> {
    return this.accessService.deleteOrganizationMember(
      params.orgId,
      params.membershipId,
    );
  }
}
