import { Controller, Get, Query } from '@nestjs/common';
import type { HealthResponse } from '@servir/contracts';
import { Public } from '@servir/core-auth';
import { ZodResponse } from 'nestjs-zod';
import { HealthQueryDto, HealthResponseDto } from './health.dto.js';
import { HealthService } from './health.service.js';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ZodResponse({
    status: 200,
    description: 'API health state',
    type: HealthResponseDto,
  })
  getHealth(@Query() query: HealthQueryDto): HealthResponse {
    return this.healthService.getHealth(query);
  }

  @Get('serialization-check')
  @ZodResponse({
    status: 200,
    description: 'Serializer contract enforcement check',
    type: HealthResponseDto,
  })
  getSerializationCheck(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      version: '' as unknown as string,
      timestamp: 'invalid-timestamp',
    };
  }
}
