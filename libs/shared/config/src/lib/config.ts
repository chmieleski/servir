import { z, ZodError } from 'zod';

const EnvBooleanSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.union([z.boolean(), z.enum(['true', 'false', '1', '0'])]).transform((value) => {
    if (typeof value === 'boolean') {
      return value;
    }

    return value === 'true' || value === '1';
  }),
);

const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().trim().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_PREFIX: z.string().trim().default('api/v1'),
  API_DOCS_ENABLED: EnvBooleanSchema.default(true),
  API_DOCS_PATH: z.string().trim().min(1).default('api/docs'),
  CORS_ENABLED: EnvBooleanSchema.default(true),
  CORS_ORIGIN: z.string().trim().min(1).default('*'),
  APP_VERSION: z.string().trim().min(1).default('0.0.0'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3000/api/v1'),
  EXPO_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:3000/api/v1'),
  DATABASE_URL: z
    .string()
    .trim()
    .min(1)
    .default('postgresql://servir:servir@localhost:5432/servir?schema=public'),
  CLERK_PUBLISHABLE_KEY: z.string().trim().min(1).default('pk_test_placeholder'),
  CLERK_SECRET_KEY: z.string().trim().min(1).default('sk_test_placeholder'),
  CLERK_AUTHORIZED_PARTIES: z
    .string()
    .trim()
    .min(1)
    .default('http://localhost:3000,http://localhost:3001'),
  AUTH_E2E_TEST_MODE: EnvBooleanSchema.default(false),
  AUTH_E2E_TEST_SECRET: z.string().trim().min(1).default('servir-e2e-secret'),
  CLERK_WEBHOOK_SIGNING_SECRET: z
    .string()
    .trim()
    .min(1)
    .default('whsec_replace_me'),
  BILLING_ENFORCEMENT_ENABLED: EnvBooleanSchema.default(true),
  BILLING_ALLOWED_PATHS: z
    .string()
    .trim()
    .min(1)
    .default(
      '/api/v1/health,/api/docs,/api/v1/auth/me,/api/v1/org-requests,/api/v1/platform,/api/v1/organizations,/api/v1/billing,/api/v1/internal/webhooks/clerk',
    ),
  BILLING_ACTIVE_STATUSES: z
    .string()
    .trim()
    .min(1)
    .default('active,trialing'),
  BILLING_INACTIVE_GRACE_DAYS: z.coerce.number().int().min(0).default(0),
});

export const EnvSchema = BaseEnvSchema;

export const ClientEnvSchema = BaseEnvSchema.pick({
  NEXT_PUBLIC_API_BASE_URL: true,
});

export const ExpoEnvSchema = BaseEnvSchema.pick({
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
