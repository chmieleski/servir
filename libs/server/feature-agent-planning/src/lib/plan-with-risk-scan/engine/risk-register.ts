import { normalizeCategory, RISK_CATEGORIES, type RiskCategory } from '../taxonomy.js';
import type { PlanWithRiskScanInput, PreMortemReason, RiskItem, TopRisk } from '../types.js';

const PROBABILITY_BY_CATEGORY: Record<RiskCategory, number> = {
  escopo_requisitos: 4,
  cronograma: 3,
  dependencias_externas: 3,
  arquitetura_performance: 3,
  dados_migracao: 3,
  seguranca: 2,
  privacidade_compliance: 2,
  operacao_observabilidade: 3,
  qualidade_testes: 3,
  custo: 2,
  adocao_ux: 3,
};

const IMPACT_BY_CATEGORY: Record<RiskCategory, number> = {
  escopo_requisitos: 5,
  cronograma: 4,
  dependencias_externas: 4,
  arquitetura_performance: 4,
  dados_migracao: 5,
  seguranca: 5,
  privacidade_compliance: 4,
  operacao_observabilidade: 4,
  qualidade_testes: 5,
  custo: 3,
  adocao_ux: 3,
};

const DEFAULT_OWNER_BY_CATEGORY: Record<RiskCategory, string> = {
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

const MITIGATION_BY_CATEGORY: Record<RiskCategory, string> = {
  escopo_requisitos: 'Formalizar critérios de aceite e congelar baseline de escopo por milestone.',
  cronograma: 'Separar buffer para validação, homologação e correções não planejadas.',
  dependencias_externas: 'Mapear dependências críticas com prazos e responsáveis formalizados.',
  arquitetura_performance: 'Executar testes de carga e revisar limites antes do rollout.',
  dados_migracao: 'Planejar migração com checklist, dry-run e estratégia de rollback validada.',
  seguranca: 'Executar revisão de ameaças e checklist de hardening antes do deploy.',
  privacidade_compliance: 'Revisar requisitos regulatórios e minimizar dados sensíveis processados.',
  operacao_observabilidade: 'Instrumentar logs, métricas e alertas para fluxos críticos.',
  qualidade_testes: 'Cobrir testes de contrato, integração e regressão para fluxos de maior risco.',
  custo: 'Definir orçamento por fase e monitorar consumo com alertas de desvio.',
  adocao_ux: 'Validar hipóteses de UX com pilotos e feedback contínuo de usuários.',
};

const CONTINGENCY_BY_CATEGORY: Record<RiskCategory, string> = {
  escopo_requisitos: 'Repriorizar backlog e congelar novas entradas até normalizar baseline.',
  cronograma: 'Acionar plano de recuperação com recorte de escopo e replanejamento formal.',
  dependencias_externas: 'Ativar fallback temporário e renegociar SLA com parceiro externo.',
  arquitetura_performance: 'Escalar capacidade e desativar funcionalidades não críticas temporariamente.',
  dados_migracao: 'Executar rollback controlado e restaurar dados a partir de backup validado.',
  seguranca: 'Isolar fluxo impactado e seguir playbook de resposta a incidentes.',
  privacidade_compliance: 'Suspender processamento afetado e executar plano de remediação regulatória.',
  operacao_observabilidade: 'Ativar monitoramento manual e modo de contingência operacional.',
  qualidade_testes: 'Bloquear rollout, corrigir falhas e rerodar suíte crítica completa.',
  custo: 'Congelar expansão e reduzir consumo para manter teto orçamentário.',
  adocao_ux: 'Executar plano de comunicação e ajustes rápidos no fluxo de uso.',
};

const SIGNAL_BY_CATEGORY: Record<RiskCategory, string> = {
  escopo_requisitos: 'Aumento de mudanças fora do baseline e tickets de requisito conflitantes.',
  cronograma: 'Marcos sem conclusão na data e aumento de tarefas em atraso.',
  dependencias_externas: 'SLA descumprido, backlog de integração crescente e bloqueios recorrentes.',
  arquitetura_performance: 'Latência/P95 degradando e saturação de recursos acima do limiar.',
  dados_migracao: 'Erros de consistência, divergência de contagem e falhas de transformação.',
  seguranca: 'Alertas de vulnerabilidade, acessos anômalos e falhas em controles críticos.',
  privacidade_compliance: 'Não conformidades em auditoria e tratamento indevido de dados sensíveis.',
  operacao_observabilidade: 'Alertas ausentes para incidentes e MTTR acima da meta.',
  qualidade_testes: 'Bugs críticos pós-deploy e queda de cobertura em áreas sensíveis.',
  custo: 'Consumo acima da curva prevista e alertas de orçamento frequentes.',
  adocao_ux: 'Baixa taxa de uso, abandono em etapas-chave e feedback negativo recorrente.',
};

function buildRiskFromReason(
  reason: PreMortemReason,
  index: number,
  ownersByCategory: PlanWithRiskScanInput['ownersByCategory'],
): RiskItem {
  const categoria = normalizeCategory(reason.categoriaSugerida);
  const probabilidade = PROBABILITY_BY_CATEGORY[categoria];
  const impacto = IMPACT_BY_CATEGORY[categoria];

  return {
    id: `R${index + 1}`,
    risco: reason.motivo,
    categoria,
    probabilidade,
    impacto,
    score: probabilidade * impacto,
    mitigacao: MITIGATION_BY_CATEGORY[categoria],
    contingencia: CONTINGENCY_BY_CATEGORY[categoria],
    sinaisDeAlerta: SIGNAL_BY_CATEGORY[categoria],
    owner: ownersByCategory?.[categoria] ?? DEFAULT_OWNER_BY_CATEGORY[categoria],
  };
}

function ensureMinimumRisks(items: RiskItem[], ownersByCategory: PlanWithRiskScanInput['ownersByCategory']): RiskItem[] {
  if (items.length >= 8) {
    return items;
  }

  const result = [...items];
  let cursor = 0;
  while (result.length < 8) {
    const categoria = RISK_CATEGORIES[cursor % RISK_CATEGORIES.length];
    const probabilidade = PROBABILITY_BY_CATEGORY[categoria];
    const impacto = IMPACT_BY_CATEGORY[categoria];

    result.push({
      id: `R${result.length + 1}`,
      risco: `Risco complementar para garantir cobertura operacional da categoria ${categoria}.`,
      categoria,
      probabilidade,
      impacto,
      score: probabilidade * impacto,
      mitigacao: MITIGATION_BY_CATEGORY[categoria],
      contingencia: CONTINGENCY_BY_CATEGORY[categoria],
      sinaisDeAlerta: SIGNAL_BY_CATEGORY[categoria],
      owner: ownersByCategory?.[categoria] ?? DEFAULT_OWNER_BY_CATEGORY[categoria],
    });

    cursor += 1;
  }

  return result;
}

export function buildRiskRegister(
  reasons: PreMortemReason[],
  input: PlanWithRiskScanInput,
): RiskItem[] {
  const built = reasons.map((reason, index) => buildRiskFromReason(reason, index, input.ownersByCategory));
  const withMin = ensureMinimumRisks(built, input.ownersByCategory);

  return withMin
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .map((risk, index) => ({ ...risk, id: `R${index + 1}` }));
}

export function pickTop3Risks(risks: RiskItem[]): TopRisk[] {
  return [...risks]
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((risk) => ({
      id: risk.id,
      score: risk.score,
      resumo: `${risk.risco} (${risk.categoria})`,
      monitoramento: `Monitorar: ${risk.sinaisDeAlerta}`,
    }));
}

export function recalculateScore(risk: RiskItem): RiskItem {
  return { ...risk, score: risk.probabilidade * risk.impacto };
}