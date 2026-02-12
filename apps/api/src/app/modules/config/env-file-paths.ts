export function getApiEnvFilePaths(
  nodeEnv: string = process.env.NODE_ENV ?? 'development',
): string[] {
  return [
    `apps/api/.env.${nodeEnv}.local`,
    `apps/api/.env.${nodeEnv}`,
    'apps/api/.env.local',
    'apps/api/.env',
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    '.env.local',
    '.env',
  ];
}
