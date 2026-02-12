import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@servir/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  getNodeEnv(): Env['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  getPort(): Env['PORT'] {
    return this.configService.get('PORT', { infer: true });
  }

  getApiPrefix(): Env['API_PREFIX'] {
    return this.configService.get('API_PREFIX', { infer: true });
  }

  getApiDocsPath(): Env['API_DOCS_PATH'] {
    return this.configService.get('API_DOCS_PATH', { infer: true });
  }

  getAppVersion(): Env['APP_VERSION'] {
    return this.configService.get('APP_VERSION', { infer: true });
  }

  getAppUrl(host = 'localhost'): string {
    return `http://${host}:${this.getPort()}/${this.getApiPrefix()}`;
  }
}
