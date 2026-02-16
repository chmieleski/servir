import { riskRegisterSchema } from '../schema.js';
import { normalizeCategory, REQUIRED_RISK_CATEGORIES, RISK_CATEGORIES, type RiskCategory } from '../taxonomy.js';
import type { RiskItem } from '../types.js';
import { recalculateScore } from './risk-register.js';

const FALLBACK_OWNER_BY_CATEGORY: Record<RiskCategory, string> = {
  escopo_requisitos: 'Tech Lead',
  cronograma: 'Engineering Manager',
  dependencias_externas: 'Integration Owner',
  arquitetura_performance: 'Arquiteto(a) de Software',
  dados_migracao: 'Data Owner',
  seguranca: 'Security Champion',
  privacidade_compliance: 'Compliance Owner',
  operacao_observabilidade: 'SRE',
  qualidade_testes: 'QA Owner',
  custo: 'FinOps Owner',
  adocao_ux: 'Product Manager',
};

function clampRange(value: number): number {
  if (value < 1) {
    return 1;
  }
  if (value > 5) {
    return 5;
  }
  return Math.round(value);
}

function normalizeRiskItem(item: RiskItem, index: number): RiskItem {
  const categoria = normalizeCategory(item.categoria);
  const normalized: RiskItem = {
    id: item.id || `R${index + 1}`,
    risco: item.risco || `Risco sem descrição detalhada na categoria ${categoria}.`,
    categoria,
    probabilidade: clampRange(item.probabilidade),
    impacto: clampRange(item.impacto),
    score: item.score,
    mitigacao: item.mitigacao || 'Definir ação preventiva antes da execução.',
    contingencia: item.contingencia || 'Definir resposta rápida para reduzir impacto.',
    sinaisDeAlerta: item.sinaisDeAlerta || 'Monitorar indicadores de desvio semanalmente.',
    owner: item.owner || FALLBACK_OWNER_BY_CATEGORY[categoria],
  };

  return recalculateScore(normalized);
}

function ensureRequiredCategories(items: RiskItem[]): RiskItem[] {
  const result = [...items];
  const present = new Set(result.map((item) => item.categoria));

  for (const required of REQUIRED_RISK_CATEGORIES) {
    if (!present.has(required)) {
      result.push({
        id: `R${result.length + 1}`,
        risco: `Risco complementar obrigatório para a categoria ${required}.`,
        categoria: required,
        probabilidade: 3,
        impacto: required === 'dados_migracao' || required === 'seguranca' ? 5 : 4,
        score: required === 'dados_migracao' || required === 'seguranca' ? 15 : 12,
        mitigacao: 'Adicionar controle preventivo específico para este risco antes do rollout.',
        contingencia: 'Ativar plano de contingência documentado e comunicar responsáveis.',
        sinaisDeAlerta: 'Indicadores de falha desta categoria acima do limite definido.',
        owner: FALLBACK_OWNER_BY_CATEGORY[required],
      });
      present.add(required);
    }
  }

  return result;
}

function ensureMinimumCount(items: RiskItem[]): RiskItem[] {
  const result = [...items];
  let cursor = 0;

  while (result.length < 8) {
    const category = RISK_CATEGORIES[cursor % RISK_CATEGORIES.length];
    result.push({
      id: `R${result.length + 1}`,
      risco: `Risco complementar para manter o mínimo obrigatório de 8 riscos (${category}).`,
      categoria: category,
      probabilidade: 3,
      impacto: 3,
      score: 9,
      mitigacao: 'Executar prevenção padrão desta categoria.',
      contingencia: 'Acionar contingência padrão desta categoria.',
      sinaisDeAlerta: 'Desvio dos indicadores definidos para a categoria.',
      owner: FALLBACK_OWNER_BY_CATEGORY[category],
    });
    cursor += 1;
  }

  return result;
}

function compactAndRenumber(items: RiskItem[]): RiskItem[] {
  return items
    .map((item, index) => normalizeRiskItem(item, index))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .map((item, index) => ({ ...item, id: `R${index + 1}` }));
}

export function validateRiskRegisterOrThrow(items: RiskItem[]): RiskItem[] {
  return riskRegisterSchema.parse(items);
}

export function validateAndHealRiskRegister(items: RiskItem[]): RiskItem[] {
  const firstPass = riskRegisterSchema.safeParse(items);
  if (firstPass.success) {
    return firstPass.data;
  }

  const healed = compactAndRenumber(ensureMinimumCount(ensureRequiredCategories(items)));
  const secondPass = riskRegisterSchema.safeParse(healed);
  if (secondPass.success) {
    return secondPass.data;
  }

  throw new Error(`Risk register validation failed after retry: ${secondPass.error.message}`);
}