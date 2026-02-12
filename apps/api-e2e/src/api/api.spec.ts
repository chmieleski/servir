import axios from 'axios';
import { ApiErrorSchema, HealthResponseSchema } from '@servir/contracts';

describe('servir api', () => {
  it('GET /api/v1/health should conform to HealthResponseSchema', async () => {
    const response = await axios.get('/api/v1/health');
    const parsed = HealthResponseSchema.safeParse(response.data);

    expect(response.status).toBe(200);
    expect(parsed.success).toBe(true);
  });

  it('GET /api/v1/health with invalid query should return standardized 400 envelope', async () => {
    const response = await axios.get('/api/v1/health', {
      params: { format: 'bad-value' },
      validateStatus: () => true,
    });

    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(400);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('GET /api/docs should expose swagger docs', async () => {
    const response = await axios.get('/api/docs', {
      validateStatus: () => true,
    });

    expect(response.status).toBe(200);
    expect(String(response.data)).toContain('Swagger UI');
  });

  it('should fail invalid response payload through serializer interceptor', async () => {
    const response = await axios.get('/api/v1/health/serialization-check', {
      validateStatus: () => true,
    });
    const parsed = ApiErrorSchema.safeParse(response.data);

    expect(response.status).toBe(500);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.error.code).toBe('SERIALIZATION_ERROR');
    }
  });
});
