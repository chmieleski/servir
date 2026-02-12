import { ConfigService } from '@nestjs/config';
import type { Env } from '@servir/config';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('should return a valid health response shape', () => {
    const service = new HealthService({
      get: (key: keyof Env) => {
        if (key === 'APP_VERSION') {
          return '1.2.3';
        }

        return undefined;
      },
    } as unknown as ConfigService<Env, true>);
    const result = service.getHealth();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'api',
        version: '1.2.3',
      }),
    );
    expect(typeof result.timestamp).toBe('string');
  });
});
