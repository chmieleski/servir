import { renderRiskTable } from './renderers/markdown.js';

describe('markdown renderer', () => {
  it('renders a valid github markdown table with required columns', () => {
    const markdown = renderRiskTable([
      {
        id: 'R1',
        risco: 'Falha de integração com parceiro externo.',
        categoria: 'dependencias_externas',
        probabilidade: 3,
        impacto: 4,
        score: 12,
        mitigacao: 'Definir SLA e plano de testes de integração.',
        contingencia: 'Usar fallback temporário no fluxo crítico.',
        sinaisDeAlerta: 'Atraso em SLA e erro frequente nas chamadas.',
        owner: 'Integration Owner',
      },
    ]);

    expect(markdown).toContain('| ID | Risco | Categoria |');
    expect(markdown).toContain('| R1 | Falha de integração com parceiro externo. | dependencias_externas | 3 | 4 | 12 |');
  });
});