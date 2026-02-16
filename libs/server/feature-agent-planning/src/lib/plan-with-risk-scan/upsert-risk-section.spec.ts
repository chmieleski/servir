import { renderRiskSection } from './renderers/markdown.js';
import { upsertRiskSection } from './renderers/upsert-risk-section.js';

const riskSection = renderRiskSection(
  [
    {
      id: 'R1',
      risco: 'Risco de cronograma por dependência externa.',
      categoria: 'cronograma',
      probabilidade: 3,
      impacto: 4,
      score: 12,
      mitigacao: 'Planejar buffer de sprint e marcos intermediários.',
      contingencia: 'Reduzir escopo e priorizar entregas obrigatórias.',
      sinaisDeAlerta: 'Atraso recorrente de marcos planejados.',
      owner: 'Engineering Manager',
    },
    {
      id: 'R2',
      risco: 'Risco de segurança na exposição de dados sensíveis.',
      categoria: 'seguranca',
      probabilidade: 2,
      impacto: 5,
      score: 10,
      mitigacao: 'Executar hardening e revisão de permissões.',
      contingencia: 'Isolar rota e seguir playbook de incidentes.',
      sinaisDeAlerta: 'Alertas de acesso anômalo.',
      owner: 'Security Champion',
    },
    {
      id: 'R3',
      risco: 'Risco em migração de dados por janela curta.',
      categoria: 'dados_migracao',
      probabilidade: 3,
      impacto: 5,
      score: 15,
      mitigacao: 'Executar dry-run e validar rollback.',
      contingencia: 'Rollback automático para snapshot anterior.',
      sinaisDeAlerta: 'Divergência de contagem pós-migração.',
      owner: 'Data Owner',
    },
  ],
  [
    {
      id: 'R3',
      score: 15,
      resumo: 'Risco em migração de dados por janela curta. (dados_migracao)',
      monitoramento: 'Monitorar divergência de contagem pós-migração.',
    },
  ],
);

describe('upsert risk section', () => {
  it('is idempotent when applied multiple times', () => {
    const existing = [
      '# Plano A',
      '',
      '## Objetivo',
      'Entregar funcionalidade X.',
      '',
      '## Plano',
      '1. Etapa inicial',
      '',
      '## Decisões / Trade-offs',
      '1. Sem trade-off',
      '',
      '## Checklist final do AGENT',
      '- [ ] Item',
      '',
    ].join('\n');

    const first = upsertRiskSection(existing, riskSection);
    const second = upsertRiskSection(first, riskSection);

    expect(first).toBe(second);
    expect(second).toContain('## Riscos e Mitigações');
    expect(second).toContain('## Top 3 riscos');
  });

  it('replaces only risk block when top 3 heading is missing in existing markdown', () => {
    const existing = [
      '# Plano B',
      '',
      '## Objetivo',
      'Entregar funcionalidade Y.',
      '',
      '## Plano',
      '1. Etapa inicial',
      '',
      '## Riscos e Mitigações',
      '| ID | Risco | Categoria | Probabilidade (1-5) | Impacto (1-5) | Score | Mitigação (prevenção) | Contingência (se acontecer) | Sinais de alerta (monitoramento) | Owner |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      '| R1 | risco antigo | cronograma | 2 | 3 | 6 | mit | cont | sinal | owner |',
      '',
      '## Decisões / Trade-offs',
      '1. Manter estratégia atual',
    ].join('\n');

    const updated = upsertRiskSection(existing, riskSection);

    expect(updated).toContain('## Riscos e Mitigações');
    expect(updated).toContain('## Top 3 riscos');
    expect(updated).toContain('## Decisões / Trade-offs');
    expect(updated).toContain('1. Manter estratégia atual');
  });
});
