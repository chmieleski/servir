function matchLevel2Headings(markdown: string): Array<{ title: string; index: number }> {
  const regex = /^##\s+(.+)$/gm;
  const result: Array<{ title: string; index: number }> = [];

  while (true) {
    const match = regex.exec(markdown);
    if (!match) {
      return result;
    }

    result.push({ title: match[1].trim(), index: match.index });
  }
}

function findSectionInsertionPoint(markdown: string): number {
  const headings = matchLevel2Headings(markdown);
  const planoIndex = headings.findIndex((heading) => heading.title.toLowerCase() === 'plano');
  if (planoIndex === -1) {
    return markdown.length;
  }

  const nextHeading = headings[planoIndex + 1];
  if (!nextHeading) {
    return markdown.length;
  }

  return nextHeading.index;
}

export function upsertRiskSection(existingMarkdown: string, riskSectionMarkdown: string): string {
  const headings = matchLevel2Headings(existingMarkdown);
  const riskHeadingIndex = headings.findIndex(
    (heading) => heading.title.toLowerCase() === 'riscos e mitigações',
  );

  if (riskHeadingIndex === -1) {
    const insertionPoint = findSectionInsertionPoint(existingMarkdown);
    const prefix = existingMarkdown.slice(0, insertionPoint).trimEnd();
    const suffix = existingMarkdown.slice(insertionPoint).trimStart();

    if (suffix.length === 0) {
      return `${prefix}\n\n${riskSectionMarkdown.trim()}\n`;
    }

    return `${prefix}\n\n${riskSectionMarkdown.trim()}\n\n${suffix}`;
  }

  const start = headings[riskHeadingIndex].index;
  const nextHeadingTitle = headings[riskHeadingIndex + 1]?.title.toLowerCase();
  const includesTop3 = nextHeadingTitle === 'top 3 riscos';
  const end = headings[riskHeadingIndex + (includesTop3 ? 2 : 1)]?.index ?? existingMarkdown.length;

  const before = existingMarkdown.slice(0, start).trimEnd();
  const after = existingMarkdown.slice(end).trimStart();

  if (after.length === 0) {
    return `${before}\n\n${riskSectionMarkdown.trim()}\n`;
  }

  return `${before}\n\n${riskSectionMarkdown.trim()}\n\n${after}`;
}
