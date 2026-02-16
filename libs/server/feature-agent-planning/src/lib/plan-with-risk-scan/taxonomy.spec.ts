import { normalizeCategory } from './taxonomy.js';

describe('taxonomy normalization', () => {
  it('normalizes known aliases to canonical categories', () => {
    expect(normalizeCategory('seguranca')).toBe('seguranca');
    expect(normalizeCategory('dependencias')).toBe('dependencias_externas');
    expect(normalizeCategory('migracao_dados')).toBe('dados_migracao');
  });

  it('falls back to escopo_requisitos for unknown values', () => {
    expect(normalizeCategory('categoria_inexistente')).toBe('escopo_requisitos');
  });
});
