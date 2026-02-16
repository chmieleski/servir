import type { RiskCategory } from './taxonomy.js';

export interface RiskItem {
  id: string;
  risco: string;
  categoria: RiskCategory;
  probabilidade: number;
  impacto: number;
  score: number;
  mitigacao: string;
  contingencia: string;
  sinaisDeAlerta: string;
  owner: string;
}

export interface PlanWithRiskScanInput {
  titulo: string;
  objetivo: string;
  escopoInclui: string[];
  escopoNaoInclui: string[];
  assuncoes: string[];
  planoPassos: string[];
  decisoesTradeoffs?: string[];
  checklistFinal?: string[];
  existingMarkdown?: string;
  planId?: string;
  ownersByCategory?: Partial<Record<RiskCategory, string>>;
}

export interface TopRisk {
  id: string;
  score: number;
  resumo: string;
  monitoramento: string;
}

export interface PlanWithRiskScanResult {
  planMarkdown: string;
  risks: RiskItem[];
  combinedMarkdown: string;
  top3: TopRisk[];
}

export interface PreMortemReason {
  id: string;
  motivo: string;
  categoriaSugerida: RiskCategory;
}