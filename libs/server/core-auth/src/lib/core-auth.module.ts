import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from './clerk-auth.guard.js';
import { ClerkAuthService } from './clerk-auth.service.js';
import { OrgAdminGuard } from './org-admin.guard.js';
import { PlatformAdminGuard } from './platform-admin.guard.js';

@Module({
  providers: [
    ClerkAuthService,
    PlatformAdminGuard,
    OrgAdminGuard,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
  exports: [ClerkAuthService, PlatformAdminGuard, OrgAdminGuard],
})
export class CoreAuthModule {}
