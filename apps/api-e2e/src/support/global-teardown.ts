import { killPort } from '@nx/node/utils';
import { execSync } from 'node:child_process';
import path from 'node:path';

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const workspaceRoot = path.resolve(__dirname, '../../../../');
  await killPort(port);
  try {
    execSync('docker compose stop postgres', {
      stdio: 'inherit',
      cwd: workspaceRoot,
    });
  } catch (error) {
    console.warn('Unable to stop postgres via docker compose.');
    console.warn(error);
  }
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
