import { formatEnvIssues, safeParseEnv } from '@servir/config';
import type { Env } from '@servir/config';

type AppSettings = {
  app: {
    nodeEnv: Env['NODE_ENV'];
    host: Env['HOST'];
    port: Env['PORT'];
    apiPrefix: Env['API_PREFIX'];
    apiDocsEnabled: Env['API_DOCS_ENABLED'];
    apiDocsPath: Env['API_DOCS_PATH'];
    corsEnabled: Env['CORS_ENABLED'];
    corsOrigin: string[];
    version: Env['APP_VERSION'];
  };
};

export type ApiValidatedConfig = Env & AppSettings;

function parseCorsOrigins(corsOrigin: Env['CORS_ORIGIN']): string[] {
  const origins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    return ['*'];
  }

  return origins;
}

export function validateEnv(rawEnv: Record<string, unknown>): ApiValidatedConfig {
  const parsedEnv = safeParseEnv(rawEnv);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatEnvIssues(parsedEnv.error)}`,
    );
  }

  const env = parsedEnv.data;

  return {
    ...env,
    app: {
      nodeEnv: env.NODE_ENV,
      host: env.HOST,
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
      apiDocsEnabled: env.API_DOCS_ENABLED,
      apiDocsPath: env.API_DOCS_PATH,
      corsEnabled: env.CORS_ENABLED,
      corsOrigin: parseCorsOrigins(env.CORS_ORIGIN),
      version: env.APP_VERSION,
    },
  } satisfies ApiValidatedConfig;
}
