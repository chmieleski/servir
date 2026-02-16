import { describe, expect, it } from 'vitest';
import { parseEnv, safeParseEnv } from './config.js';

describe('config', () => {
  it('should parse valid env', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: '4100',
      API_PREFIX: 'api/v1',
      API_DOCS_ENABLED: 'false',
      API_DOCS_PATH: 'api/docs',
      CORS_ENABLED: 'true',
      CORS_ORIGIN: 'http://localhost:3000,https://servir.app',
      APP_VERSION: '1.0.0',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:4100/api/v1',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:4100/api/v1',
      DATABASE_HOST: 'db.example.internal',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'servir',
      DATABASE_USER: 'servir',
      DATABASE_PASSWORD: 'secret',
    });

    expect(env.PORT).toBe(4100);
    expect(env.HOST).toBe('127.0.0.1');
    expect(env.NODE_ENV).toBe('production');
    expect(env.API_DOCS_ENABLED).toBe(false);
    expect(env.CORS_ENABLED).toBe(true);
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000,https://servir.app');
    expect(env.EXPO_PUBLIC_API_BASE_URL).toBe('http://localhost:4100/api/v1');
    expect(env.DATABASE_SSL).toBe(true);
  });

  it('should fail on invalid env', () => {
    const parsed = safeParseEnv({
      NODE_ENV: 'development',
      PORT: 'not-a-number',
      API_DOCS_ENABLED: 'maybe',
      CORS_ENABLED: '2',
      NEXT_PUBLIC_API_BASE_URL: 'invalid-url',
      EXPO_PUBLIC_API_BASE_URL: 'also-invalid-url',
    });

    expect(parsed.success).toBe(false);
  });

  it('should allow empty API_PREFIX for subdomain-based routing', () => {
    const env = parseEnv({
      API_PREFIX: '',
    });

    expect(env.API_PREFIX).toBe('');
  });
});
