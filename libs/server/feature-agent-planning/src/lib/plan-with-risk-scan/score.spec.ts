import { recalculateScore } from './engine/risk-register.js';

describe('score calculation', () => {
  it('always recalculates score as probabilidade * impacto', () => {
    const updated = recalculateScore({
      id: 'R1',
      risco: 'Teste de score',
      categoria: 'cronograma',
      probabilidade: 4,
      impacto: 5,
      score: 1,
      mitigacao: 'Mitigacao preventiva longa suficiente.',
      contingencia: 'Plano de contingencia longa suficiente.',
      sinaisDeAlerta: 'Sinal de alerta observado.',
      owner: 'Engineering Manager',
    });

    expect(updated.score).toBe(20);
  });
});