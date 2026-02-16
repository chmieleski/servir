export const RISK_CATEGORIES = [
  'escopo_requisitos',
  'cronograma',
  'dependencias_externas',
  'arquitetura_performance',
  'dados_migracao',
  'seguranca',
  'privacidade_compliance',
  'operacao_observabilidade',
  'qualidade_testes',
  'custo',
  'adocao_ux',
] as const;

export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const REQUIRED_RISK_CATEGORIES: readonly RiskCategory[] = [
  'dependencias_externas',
  'dados_migracao',
  'seguranca',
  'operacao_observabilidade',
  'cronograma',
] as const;

const ALIASES: Record<string, RiskCategory> = {
  escopo: 'escopo_requisitos',
  escopo_requisito: 'escopo_requisitos',
  requisitos: 'escopo_requisitos',
  cronograma: 'cronograma',
  prazo: 'cronograma',
  dependencias: 'dependencias_externas',
  dependencia_externa: 'dependencias_externas',
  integracoes: 'dependencias_externas',
  arquitetura: 'arquitetura_performance',
  performance: 'arquitetura_performance',
  dados: 'dados_migracao',
  migracao: 'dados_migracao',
  migracao_dados: 'dados_migracao',
  seguranca: 'seguranca',
  security: 'seguranca',
  privacidade: 'privacidade_compliance',
  compliance: 'privacidade_compliance',
  observabilidade: 'operacao_observabilidade',
  operacao: 'operacao_observabilidade',
  testes: 'qualidade_testes',
  qualidade: 'qualidade_testes',
  custo: 'custo',
  ux: 'adocao_ux',
  adocao: 'adocao_ux',
};

function normalizeToken(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeCategory(category: string): RiskCategory {
  const normalized = normalizeToken(category);

  if ((RISK_CATEGORIES as readonly string[]).includes(normalized)) {
    return normalized as RiskCategory;
  }

  return ALIASES[normalized] ?? 'escopo_requisitos';
}