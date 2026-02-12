import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiValidatedConfig } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<ApiValidatedConfig, true>) {}

  getNodeEnv(): ApiValidatedConfig['app']['nodeEnv'] {
    return this.configService.get('app.nodeEnv', { infer: true });
  }

  getHost(): ApiValidatedConfig['app']['host'] {
    return this.configService.get('app.host', { infer: true });
  }

  getPort(): ApiValidatedConfig['app']['port'] {
    return this.configService.get('app.port', { infer: true });
  }

  getApiPrefix(): ApiValidatedConfig['app']['apiPrefix'] {
    return this.configService.get('app.apiPrefix', { infer: true });
  }

  isApiDocsEnabled(): ApiValidatedConfig['app']['apiDocsEnabled'] {
    return this.configService.get('app.apiDocsEnabled', { infer: true });
  }

  getApiDocsPath(): ApiValidatedConfig['app']['apiDocsPath'] {
    return this.configService.get('app.apiDocsPath', { infer: true });
  }

  isCorsEnabled(): ApiValidatedConfig['app']['corsEnabled'] {
    return this.configService.get('app.corsEnabled', { infer: true });
  }

  getCorsOrigin(): string | string[] {
    const origins = this.configService.get('app.corsOrigin', { infer: true });

    if (origins.length <= 1) {
      return origins[0] ?? '*';
    }

    return origins;
  }

  getAppVersion(): ApiValidatedConfig['app']['version'] {
    return this.configService.get('app.version', { infer: true });
  }

  getAppUrl(host = this.getHost()): string {
    return `http://${this.resolvePublicHost(host)}:${this.getPort()}/${this.getApiPrefix()}`;
  }

  getApiDocsUrl(host = this.getHost()): string {
    return `http://${this.resolvePublicHost(host)}:${this.getPort()}/${this.getApiDocsPath()}`;
  }

  private resolvePublicHost(host: string): string {
    if (host === '0.0.0.0') {
      return 'localhost';
    }

    return host;
  }
}
