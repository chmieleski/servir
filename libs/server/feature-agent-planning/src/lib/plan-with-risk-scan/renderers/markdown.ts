import type { RiskItem, TopRisk, PlanWithRiskScanInput } from '../types.js';

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
}

function renderList(items: string[]): string {
  if (items.length === 0) {
    return '- (nenhum item informado)';
  }

  return items.map((item) => `- ${item}`).join('\n');
}

export function renderRiskTable(risks: RiskItem[]): string {
  const header =
    '| ID | Risco | Categoria | Probabilidade (1-5) | Impacto (1-5) | Score | Mitigação (prevenção) | Contingência (se acontecer) | Sinais de alerta (monitoramento) | Owner |';
  const separator =
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';

  const lines = risks.map(
    (risk) =>
      `| ${risk.id} | ${escapeCell(risk.risco)} | ${risk.categoria} | ${risk.probabilidade} | ${risk.impacto} | ${risk.score} | ${escapeCell(risk.mitigacao)} | ${escapeCell(risk.contingencia)} | ${escapeCell(risk.sinaisDeAlerta)} | ${escapeCell(risk.owner)} |`,
  );

  return [header, separator, ...lines].join('\n');
}

export function renderTop3Risks(top3: TopRisk[]): string {
  if (top3.length === 0) {
    return '1. Não há riscos disponíveis para ranqueamento.';
  }

  return top3
    .map(
      (risk, index) =>
        `${index + 1}. **${risk.id} (Score ${risk.score})** - ${risk.resumo}\nMonitoramento: ${risk.monitoramento}`,
    )
    .join('\n');
}

export function renderPlanMarkdown(input: PlanWithRiskScanInput): string {
  const tradeoffs = input.decisoesTradeoffs ?? ['Sem decisões registradas nesta versão.'];
  const checklist =
    input.checklistFinal ?? [
      'Conferir consistência do escopo com objetivo.',
      'Validar riscos obrigatórios e Top 3 por score.',
      'Confirmar owners e sinais de monitoramento.',
    ];

  return [
    `# ${input.titulo}`,
    '',
    '## Objetivo',
    input.objetivo,
    '',
    '## Escopo',
    '### Inclui',
    renderList(input.escopoInclui),
    '',
    '### Não inclui',
    renderList(input.escopoNaoInclui),
    '',
    '## Assunções',
    renderList(input.assuncoes),
    '',
    '## Plano',
    input.planoPassos.map((step, index) => `${index + 1}. ${step}`).join('\n'),
    '',
    '## Decisões / Trade-offs',
    tradeoffs.map((item, index) => `${index + 1}. ${item}`).join('\n'),
    '',
    '## Checklist final do AGENT',
    checklist.map((item) => `- [ ] ${item}`).join('\n'),
    '',
  ].join('\n');
}

export function renderRiskSection(risks: RiskItem[], top3: TopRisk[]): string {
  return [
    '## Riscos e Mitigações',
    renderRiskTable(risks),
    '',
    '## Top 3 riscos',
    renderTop3Risks(top3),
    '',
  ].join('\n');
}