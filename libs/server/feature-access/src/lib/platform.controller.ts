import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  OrganizationRequest,
  OrganizationRequestListResponse,
  PlatformUserListResponse,
} from '@servir/contracts';
import { CurrentAuth, PlatformAdminGuard, type ServirAuthContext } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import { AccessService } from './access.service.js';
import {
  ApproveOrganizationRequestDto,
  DenyOrganizationRequestDto,
  ListOrganizationRequestsQueryDto,
  ListPlatformUsersQueryDto,
  OrganizationRequestDto,
  OrganizationRequestIdParamDto,
  OrganizationRequestListResponseDto,
  PlatformUserListResponseDto,
} from './access.dto.js';

@Controller('platform')
@UseGuards(PlatformAdminGuard)
export class PlatformController {
  constructor(private readonly accessService: AccessService) {}

  @Get('org-requests')
  @ZodResponse({
    status: 200,
    description: 'List organization requests for platform administrators',
    type: OrganizationRequestListResponseDto,
  })
  async listOrganizationRequests(
    @Query() query: ListOrganizationRequestsQueryDto,
  ): Promise<OrganizationRequestListResponse> {
    return this.accessService.listPlatformOrganizationRequests(query);
  }

  @Post('org-requests/:requestId/approve')
  @ZodResponse({
    status: 201,
    description: 'Approve an organization request',
    type: OrganizationRequestDto,
  })
  async approveOrganizationRequest(
    @CurrentAuth() auth: ServirAuthContext,
    @Param() params: OrganizationRequestIdParamDto,
    @Body() body: ApproveOrganizationRequestDto,
  ): Promise<OrganizationRequest> {
    return this.accessService.approveOrganizationRequest(
      params.requestId,
      auth.userId,
      body.reason,
    );
  }

  @Post('org-requests/:requestId/retry-approve')
  @ZodResponse({
    status: 201,
    description: 'Retry an organization request approval',
    type: OrganizationRequestDto,
  })
  async retryApproveOrganizationRequest(
    @CurrentAuth() auth: ServirAuthContext,
    @Param() params: OrganizationRequestIdParamDto,
    @Body() body: ApproveOrganizationRequestDto,
  ): Promise<OrganizationRequest> {
    return this.accessService.retryApproveOrganizationRequest(
      params.requestId,
      auth.userId,
      body.reason,
    );
  }

  @Post('org-requests/:requestId/deny')
  @ZodResponse({
    status: 201,
    description: 'Deny an organization request',
    type: OrganizationRequestDto,
  })
  async denyOrganizationRequest(
    @CurrentAuth() auth: ServirAuthContext,
    @Param() params: OrganizationRequestIdParamDto,
    @Body() body: DenyOrganizationRequestDto,
  ): Promise<OrganizationRequest> {
    return this.accessService.denyOrganizationRequest(
      params.requestId,
      auth.userId,
      body.reason,
    );
  }

  @Get('users')
  @ZodResponse({
    status: 200,
    description: 'List users for platform administrators',
    type: PlatformUserListResponseDto,
  })
  async listUsers(
    @Query() query: ListPlatformUsersQueryDto,
  ): Promise<PlatformUserListResponse> {
    return this.accessService.listPlatformUsers(query);
  }
}
