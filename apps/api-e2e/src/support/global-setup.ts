import { waitForPortOpen } from '@nx/node/utils';
import { execSync } from 'node:child_process';
import path from 'node:path';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

module.exports = async function () {
  // Start services that the app needs to run.
  console.log('\nSetting up...\n');
  const workspaceRoot = path.resolve(__dirname, '../../../../');
  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://servir:servir@localhost:5432/servir?schema=public';

  try {
    execSync('docker compose up -d postgres', {
      stdio: 'inherit',
      cwd: workspaceRoot,
    });
  } catch (error) {
    console.warn('Unable to start postgres via docker compose. Continuing with existing DB.');
    console.warn(error);
  }

  await waitForPortOpen(5432, { host: process.env.DATABASE_HOST ?? 'localhost' });
  execSync('pnpm prisma migrate deploy --schema apps/api/prisma/schema.prisma', {
    stdio: 'inherit',
    cwd: workspaceRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await waitForPortOpen(port, { host });

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
