import { formatEnvIssues, safeParseEnv } from '@servir/config';

export function validateEnv(rawEnv: Record<string, unknown>) {
  const parsedEnv = safeParseEnv(rawEnv);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatEnvIssues(parsedEnv.error)}`,
    );
  }

  return parsedEnv.data;
}
