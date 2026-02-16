import { cpSync, existsSync, readdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const pnpmStoreDir = path.join(workspaceRoot, 'node_modules', '.pnpm');

if (!existsSync(pnpmStoreDir)) {
  throw new Error(`Could not find pnpm store at ${pnpmStoreDir}.`);
}

const prismaClientStoreEntries = readdirSync(pnpmStoreDir).filter((entry) =>
  entry.startsWith('@prisma+client@'),
);

if (prismaClientStoreEntries.length === 0) {
  throw new Error('No @prisma/client entries were found in the pnpm store.');
}

const generatedCandidates = prismaClientStoreEntries
  .map((entry) =>
    path.join(pnpmStoreDir, entry, 'node_modules', '.prisma'),
  )
  .filter((candidate) => existsSync(candidate));

const fallbackGeneratedPrismaDir = generatedCandidates[0];

for (const entry of prismaClientStoreEntries) {
  const packageDir = path.join(
    pnpmStoreDir,
    entry,
    'node_modules',
    '@prisma',
    'client',
  );
  const generatedPrismaDirCandidate = path.join(
    pnpmStoreDir,
    entry,
    'node_modules',
    '.prisma',
  );
  const generatedPrismaDir = existsSync(generatedPrismaDirCandidate)
    ? generatedPrismaDirCandidate
    : fallbackGeneratedPrismaDir;
  const localPrismaDir = path.join(packageDir, '.prisma');

  if (!existsSync(packageDir) || !generatedPrismaDir || !existsSync(generatedPrismaDir)) {
    continue;
  }

  if (existsSync(localPrismaDir)) {
    rmSync(localPrismaDir, { recursive: true, force: true });
  }

  try {
    symlinkSync(generatedPrismaDir, localPrismaDir, 'junction');
  } catch {
    cpSync(generatedPrismaDir, localPrismaDir, { recursive: true });
  }

  process.stdout.write(
    `Ensured Prisma runtime path for ${entry} at ${localPrismaDir}.\n`,
  );
}
