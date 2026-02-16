import { Module } from '@nestjs/common';
import { CoreAuthModule } from '@servir/core-auth';
import { DataAccessModule } from '@servir/data-access';
import { AccessService } from './access.service.js';
import { AuthController } from './auth.controller.js';
import { OrgRequestsController } from './org-requests.controller.js';
import { OrganizationMembersController } from './organization-members.controller.js';
import { PlatformController } from './platform.controller.js';

@Module({
  imports: [CoreAuthModule, DataAccessModule],
  controllers: [
    AuthController,
    OrgRequestsController,
    PlatformController,
    OrganizationMembersController,
  ],
  providers: [AccessService],
})
export class FeatureAccessModule {}
