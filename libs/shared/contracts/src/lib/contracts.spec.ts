import {
  ApiErrorSchema,
  HealthQuerySchema,
  HealthResponseSchema,
} from './contracts.js';

describe('contracts', () => {
  it('should validate health response', () => {
    const parsed = HealthResponseSchema.parse({
      status: 'ok',
      service: 'api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    expect(parsed.status).toBe('ok');
  });

  it('should reject invalid health query format', () => {
    const parsed = HealthQuerySchema.safeParse({ format: 'bad-value' });

    expect(parsed.success).toBe(false);
  });

  it('should validate error envelope', () => {
    const parsed = ApiErrorSchema.parse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        issues: [],
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: '/api/v1/health',
      },
    });

    expect(parsed.error.code).toBe('VALIDATION_ERROR');
  });
});
