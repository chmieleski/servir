import { Controller, Get } from '@nestjs/common';
import type { AuthMeResponse } from '@servir/contracts';
import { CurrentAuth, type ServirAuthContext } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import { AccessService } from './access.service.js';
import { AuthMeResponseDto } from './access.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly accessService: AccessService) {}

  @Get('me')
  @ZodResponse({
    status: 200,
    description: 'Authenticated user context',
    type: AuthMeResponseDto,
  })
  getMe(@CurrentAuth() auth: ServirAuthContext): AuthMeResponse {
    return this.accessService.getMe(auth);
  }
}
