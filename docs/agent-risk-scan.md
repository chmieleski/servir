# Agent Risk Scan

## Objetivo
Garantir que todo plano passe por `Plan -> RiskScan -> Render Markdown`, com seção obrigatória de riscos.

## Módulo
- Biblioteca: `@servir/feature-agent-planning`
- Entrada principal: `planWithRiskScan(input)`
- Saída: `{ planMarkdown, risks, combinedMarkdown, top3 }`

## Fluxo
1. Gera base do plano em Markdown.
2. Executa pre-mortem determinístico.
3. Converte para Risk Register estruturado.
4. Valida com Zod (mínimo 8 riscos + categorias obrigatórias).
5. Aplica self-heal uma vez se inválido.
6. Renderiza/atualiza `## Riscos e Mitigações` e `## Top 3 riscos`.

## Taxonomia obrigatória
- `escopo_requisitos`
- `cronograma`
- `dependencias_externas`
- `arquitetura_performance`
- `dados_migracao`
- `seguranca`
- `privacidade_compliance`
- `operacao_observabilidade`
- `qualidade_testes`
- `custo`
- `adocao_ux`

Categorias com presença obrigatória em qualquer plano:
- `dependencias_externas`
- `dados_migracao`
- `seguranca`
- `operacao_observabilidade`
- `cronograma`

## Extensão da taxonomia
1. Adicione categoria em `taxonomy.ts`.
2. Atualize aliases em `normalizeCategory`.
3. Atualize regras de score/mitigação/owner em `engine/risk-register.ts`.
4. Atualize validações em `schema.ts` quando necessário.
5. Adicione testes para normalização e cobertura da nova categoria.

## Uso rápido
```ts
import { planWithRiskScan } from '@servir/feature-agent-planning';

const result = planWithRiskScan({
  titulo: 'Plano X',
  objetivo: 'Objetivo X',
  escopoInclui: ['Item A'],
  escopoNaoInclui: ['Item B'],
  assuncoes: ['Assunção A'],
  planoPassos: ['Passo 1', 'Passo 2'],
});

console.log(result.combinedMarkdown);
```

## CI docs
- Script: `pnpm docs:lint`
- Valida `docs/plans/**/*.md` para:
  - presença de `## Riscos e Mitigações`
  - mínimo de 8 riscos na tabela
  - presença de `## Top 3 riscos`