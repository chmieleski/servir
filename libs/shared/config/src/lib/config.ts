import { z, ZodError } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_PREFIX: z.string().trim().min(1).default('api/v1'),
  API_DOCS_PATH: z.string().trim().min(1).default('api/docs'),
  APP_VERSION: z.string().trim().min(1).default('0.0.0'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3000/api/v1'),
  EXPO_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3000/api/v1'),
});

export const ClientEnvSchema = EnvSchema.pick({
  NEXT_PUBLIC_API_BASE_URL: true,
});

export const ExpoEnvSchema = EnvSchema.pick({
  EXPO_PUBLIC_API_BASE_URL: true,
});

export type Env = z.infer<typeof EnvSchema>;
export type ClientEnv = z.infer<typeof ClientEnvSchema>;
export type ExpoEnv = z.infer<typeof ExpoEnvSchema>;

export function parseEnv(rawEnv: Record<string, unknown>): Env {
  return EnvSchema.parse(rawEnv);
}

export function safeParseEnv(rawEnv: Record<string, unknown>) {
  return EnvSchema.safeParse(rawEnv);
}

export function loadServerEnv(rawEnv: Record<string, unknown> = process.env): Env {
  return parseEnv(rawEnv);
}

export function loadClientEnv(rawEnv: Record<string, unknown> = process.env): ClientEnv {
  return ClientEnvSchema.parse(rawEnv);
}

export function loadExpoEnv(rawEnv: Record<string, unknown> = process.env): ExpoEnv {
  return ExpoEnvSchema.parse(rawEnv);
}

export function formatEnvIssues(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('\n');
}
