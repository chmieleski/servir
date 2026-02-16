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
      DATABASE_URL: 'postgresql://servir:secret@db.example.internal:5432/servir?schema=public',
      CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      CLERK_SECRET_KEY: 'sk_test_123',
      CLERK_AUTHORIZED_PARTIES: 'http://localhost:3000,http://localhost:3001',
      AUTH_E2E_TEST_MODE: 'true',
      AUTH_E2E_TEST_SECRET: 'test-secret',
      CLERK_WEBHOOK_SIGNING_SECRET: 'whsec_test',
      BILLING_ENFORCEMENT_ENABLED: 'true',
      BILLING_ALLOWED_PATHS: '/api/v1/health,/api/docs',
      BILLING_ACTIVE_STATUSES: 'active,trialing',
      BILLING_INACTIVE_GRACE_DAYS: '0',
    });

    expect(env.PORT).toBe(4100);
    expect(env.HOST).toBe('127.0.0.1');
    expect(env.NODE_ENV).toBe('production');
    expect(env.API_DOCS_ENABLED).toBe(false);
    expect(env.CORS_ENABLED).toBe(true);
    expect(env.CORS_ORIGIN).toBe('http://localhost:3000,https://servir.app');
    expect(env.DATABASE_URL).toContain('postgresql://');
    expect(env.AUTH_E2E_TEST_MODE).toBe(true);
    expect(env.BILLING_ENFORCEMENT_ENABLED).toBe(true);
  });

  it('should fail on invalid env', () => {
    const parsed = safeParseEnv({
      NODE_ENV: 'development',
      PORT: 'not-a-number',
      API_DOCS_ENABLED: 'maybe',
      CORS_ENABLED: '2',
      NEXT_PUBLIC_API_BASE_URL: 'invalid-url',
      EXPO_PUBLIC_API_BASE_URL: 'also-invalid-url',
      DATABASE_URL: '',
      CLERK_PUBLISHABLE_KEY: '',
      CLERK_SECRET_KEY: '',
      CLERK_AUTHORIZED_PARTIES: '',
      AUTH_E2E_TEST_SECRET: '',
      CLERK_WEBHOOK_SIGNING_SECRET: '',
      BILLING_ALLOWED_PATHS: '',
      BILLING_ACTIVE_STATUSES: '',
      BILLING_INACTIVE_GRACE_DAYS: '-1',
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
