#!/usr/bin/env ts-node
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const plansRoot = join(process.cwd(), 'docs', 'plans');
const riskHeadingRegex = /##\s+Riscos e Mitiga(?:\u00e7|c)(?:\u00f5|o)es/i;

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (fullPath.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function countRiskRows(markdown: string): number {
  const sectionMatch = markdown.match(
    /##\s+Riscos e Mitiga(?:\u00e7|c)(?:\u00f5|o)es([\s\S]*?)(\n##\s+|$)/i,
  );
  if (!sectionMatch) {
    return 0;
  }

  const section = sectionMatch[1];
  const tableRows = section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'));

  if (tableRows.length < 3) {
    return 0;
  }

  return tableRows.length - 2;
}

function main(): void {
  let markdownFiles: string[] = [];

  try {
    markdownFiles = walk(plansRoot);
  } catch {
    console.log('docs/plans directory not found; skipping validation.');
    return;
  }

  if (markdownFiles.length === 0) {
    console.log('No markdown plans found under docs/plans; skipping validation.');
    return;
  }

  const errors: string[] = [];

  for (const file of markdownFiles) {
    const content = readFileSync(file, 'utf8');
    const relativePath = relative(process.cwd(), file);

    if (!riskHeadingRegex.test(content)) {
      errors.push(`${relativePath}: missing section "## Riscos e Mitigacoes"`);
      continue;
    }

    if (!/##\s+Top 3 riscos/i.test(content)) {
      errors.push(`${relativePath}: missing section "## Top 3 riscos"`);
    }

    const riskRowCount = countRiskRows(content);
    if (riskRowCount < 8) {
      errors.push(`${relativePath}: expected at least 8 risk rows, found ${riskRowCount}`);
    }
  }

  if (errors.length > 0) {
    console.error('Risk docs validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Risk docs validation passed (${markdownFiles.length} file(s) checked).`);
}

main();
