export const RISK_SCAN_PROMPT = `
Converta motivos de falha em Risk Register com campos:
- categoria normalizada
- probabilidade 1-5
- impacto 1-5
- score = probabilidade * impacto
- mitigação
- contingência
- sinais de alerta
- owner
`;