import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthResponse, type HealthQuery } from '@servir/contracts';
import type { Env } from '@servir/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  getHealth(query?: HealthQuery): HealthResponse {
    const base: HealthResponse = {
      status: 'ok',
      service: 'api',
      version: this.configService.get('APP_VERSION', { infer: true }),
      timestamp: new Date().toISOString(),
    };

    if (query?.format === 'minimal') {
      return {
        ...base,
        version: 'minimal',
      };
    }

    return base;
  }
}
