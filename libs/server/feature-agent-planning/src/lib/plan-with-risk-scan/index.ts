import { generatePreMortemReasons } from './engine/pre-mortem.js';
import { buildRiskRegister, pickTop3Risks } from './engine/risk-register.js';
import { validateAndHealRiskRegister } from './engine/self-heal.js';
import { renderPlanMarkdown, renderRiskSection } from './renderers/markdown.js';
import { upsertRiskSection } from './renderers/upsert-risk-section.js';
import type { PlanWithRiskScanInput, PlanWithRiskScanResult } from './types.js';

export * from './types.js';
export * from './taxonomy.js';
export * from './schema.js';

export function planWithRiskScan(input: PlanWithRiskScanInput): PlanWithRiskScanResult {
  const planMarkdown = renderPlanMarkdown(input);
  const preMortem = generatePreMortemReasons(input);
  const rawRisks = buildRiskRegister(preMortem, input);
  const risks = validateAndHealRiskRegister(rawRisks);
  const top3 = pickTop3Risks(risks);
  const riskSection = renderRiskSection(risks, top3);
  const baseMarkdown = input.existingMarkdown ?? planMarkdown;
  const combinedMarkdown = upsertRiskSection(baseMarkdown, riskSection);

  return {
    planMarkdown,
    risks,
    combinedMarkdown,
    top3,
  };
}