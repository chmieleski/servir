import type { PlanWithRiskScanInput, PreMortemReason } from '../types.js';

function hasKeyword(input: string[], pattern: RegExp): boolean {
  return input.some((value) => pattern.test(value));
}

export function generatePreMortemReasons(input: PlanWithRiskScanInput): PreMortemReason[] {
  const combined = [
    input.objetivo,
    ...input.escopoInclui,
    ...input.escopoNaoInclui,
    ...input.assuncoes,
    ...input.planoPassos,
  ];

  const reasons: PreMortemReason[] = [
    {
      id: 'PM-01',
      motivo: 'Requisitos mudaram durante a execução e o escopo aprovado ficou defasado.',
      categoriaSugerida: 'escopo_requisitos',
    },
    {
      id: 'PM-02',
      motivo: 'Dependência externa crítica atrasou integração e bloqueou entregas.',
      categoriaSugerida: 'dependencias_externas',
    },
    {
      id: 'PM-03',
      motivo: 'O cronograma subestimou atividades de validação e correção.',
      categoriaSugerida: 'cronograma',
    },
    {
      id: 'PM-04',
      motivo: 'Mudanças em dados e migração causaram inconsistências em produção.',
      categoriaSugerida: 'dados_migracao',
    },
    {
      id: 'PM-05',
      motivo: 'Controles de segurança ficaram incompletos para o novo fluxo.',
      categoriaSugerida: 'seguranca',
    },
    {
      id: 'PM-06',
      motivo: 'Falhas de observabilidade impediram detectar degradação cedo.',
      categoriaSugerida: 'operacao_observabilidade',
    },
    {
      id: 'PM-07',
      motivo: 'Arquitetura não sustentou volume esperado e houve degradação de performance.',
      categoriaSugerida: 'arquitetura_performance',
    },
    {
      id: 'PM-08',
      motivo: 'Cobertura de testes não validou cenários críticos e regressões escaparam.',
      categoriaSugerida: 'qualidade_testes',
    },
    {
      id: 'PM-09',
      motivo: 'Custos operacionais subiram acima do previsto para manter a solução.',
      categoriaSugerida: 'custo',
    },
    {
      id: 'PM-10',
      motivo: 'Baixa adesão de usuários reduziu impacto do plano.',
      categoriaSugerida: 'adocao_ux',
    },
  ];

  if (hasKeyword(combined, /(lgpd|compliance|privacidade|dados pessoais)/i)) {
    reasons.push({
      id: 'PM-11',
      motivo: 'Exigências de privacidade/compliance foram interpretadas de forma incompleta.',
      categoriaSugerida: 'privacidade_compliance',
    });
  }

  if (hasKeyword(combined, /(migrac|legacy|schema|database|prisma)/i)) {
    reasons.push({
      id: 'PM-12',
      motivo: 'Janela de migração foi insuficiente e exigiu rollback com impacto.',
      categoriaSugerida: 'dados_migracao',
    });
  }

  return reasons;
}