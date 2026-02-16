import { planWithRiskScan } from './index.js';

describe('planWithRiskScan contract', () => {
  it('always returns combined markdown with mandatory risk section and at least 8 risks', () => {
    const result = planWithRiskScan({
      titulo: 'Plano de implementação de feature crítica',
      objetivo: 'Entregar feature sem regressões de segurança e dados.',
      escopoInclui: ['API Nest', 'UI Next.js', 'Migração de dados'],
      escopoNaoInclui: ['Refatoração completa do domínio legado'],
      assuncoes: ['Equipe completa disponível', 'Dependência externa com SLA estável'],
      planoPassos: ['Detalhar escopo', 'Implementar backend', 'Implementar frontend', 'Validar rollout'],
    });

    expect(result.risks.length).toBeGreaterThanOrEqual(8);
    expect(result.combinedMarkdown).toContain('## Riscos e Mitigações');
    expect(result.combinedMarkdown).toContain('## Top 3 riscos');

    const requiredCategories = [
      'dependencias_externas',
      'dados_migracao',
      'seguranca',
      'operacao_observabilidade',
      'cronograma',
    ];

    for (const category of requiredCategories) {
      expect(result.risks.some((risk) => risk.categoria === category)).toBe(true);
    }
  });
});