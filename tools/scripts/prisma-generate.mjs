import { spawnSync } from 'node:child_process';

const generateResult = spawnSync(
  'pnpm',
  ['prisma', 'generate', '--schema', 'apps/api/prisma/schema.prisma'],
  {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: '1',
    },
  },
);

if ((generateResult.status ?? 1) !== 0) {
  process.exit(generateResult.status ?? 1);
}

const ensureResult = spawnSync('node', ['tools/scripts/ensure-prisma-client.mjs'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(ensureResult.status ?? 1);
