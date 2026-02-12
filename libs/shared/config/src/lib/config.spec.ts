import { describe, expect, it } from 'vitest';
import { parseEnv, safeParseEnv } from './config.js';

describe('config', () => {
  it('should parse valid env', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      PORT: '4100',
      API_PREFIX: 'api/v1',
      API_DOCS_PATH: 'api/docs',
      APP_VERSION: '1.0.0',
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:4100/api/v1',
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:4100/api/v1',
    });

    expect(env.PORT).toBe(4100);
    expect(env.NODE_ENV).toBe('production');
    expect(env.EXPO_PUBLIC_API_BASE_URL).toBe('http://localhost:4100/api/v1');
  });

  it('should fail on invalid env', () => {
    const parsed = safeParseEnv({
      NODE_ENV: 'development',
      PORT: 'not-a-number',
      NEXT_PUBLIC_API_BASE_URL: 'invalid-url',
      EXPO_PUBLIC_API_BASE_URL: 'also-invalid-url',
    });

    expect(parsed.success).toBe(false);
  });
});
