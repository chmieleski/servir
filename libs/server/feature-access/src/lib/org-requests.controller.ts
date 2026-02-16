import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type {
  CreateOrganizationRequest,
  OrganizationRequest,
  OrganizationRequestListResponse,
} from '@servir/contracts';
import { CurrentAuth, type ServirAuthContext } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import { AccessService } from './access.service.js';
import {
  CreateOrganizationRequestDto,
  ListOrganizationRequestsQueryDto,
  OrganizationRequestDto,
  OrganizationRequestListResponseDto,
} from './access.dto.js';

@Controller('org-requests')
export class OrgRequestsController {
  constructor(private readonly accessService: AccessService) {}

  @Post()
  @ZodResponse({
    status: 201,
    description: 'Create a new organization request',
    type: OrganizationRequestDto,
  })
  async createRequest(
    @CurrentAuth() auth: ServirAuthContext,
    @Body() body: CreateOrganizationRequestDto,
  ): Promise<OrganizationRequest> {
    return this.accessService.createOrganizationRequest(
      auth,
      body as CreateOrganizationRequest,
    );
  }

  @Get('me')
  @ZodResponse({
    status: 200,
    description: 'List my organization requests',
    type: OrganizationRequestListResponseDto,
  })
  async listMyRequests(
    @CurrentAuth() auth: ServirAuthContext,
    @Query() query: ListOrganizationRequestsQueryDto,
  ): Promise<OrganizationRequestListResponse> {
    return this.accessService.listMyOrganizationRequests(auth, query);
  }
}
