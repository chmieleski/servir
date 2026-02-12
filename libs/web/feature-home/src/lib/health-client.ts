import { HealthResponseSchema, type HealthResponse } from '@servir/contracts';
import { loadClientEnv } from '@servir/config';

export type HealthClientResult =
  | { ok: true; data: HealthResponse }
  | { ok: false; error: string };

export async function fetchHealth(): Promise<HealthClientResult> {
  const env = loadClientEnv(process.env);

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return { ok: false, error: `Health endpoint failed with status ${response.status}` };
    }

    const json = await response.json();
    const parsed = HealthResponseSchema.safeParse(json);

    if (!parsed.success) {
      return { ok: false, error: 'Health response did not match the shared contract' };
    }

    return { ok: true, data: parsed.data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown health fetch error',
    };
  }
}
