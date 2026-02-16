# Registro Central de Riscos de Planos

Este arquivo consolida riscos gerados por planos usando `planWithRiskScan`.

## Como usar
- Adicione um bloco por plano gerado em `docs/plans/*`.
- Registre data, plano e Top 3 riscos por score.
- Mantenha owners e sinais de alerta atualizados.

## Entradas

### {{YYYY-MM-DD}} - {{plano}}
- Origem: `docs/plans/{{arquivo}}.md`
- Top 3:
1. `{{R1}}` score `{{s1}}` - {{resumo1}}
2. `{{R2}}` score `{{s2}}` - {{resumo2}}
3. `{{R3}}` score `{{s3}}` - {{resumo3}}