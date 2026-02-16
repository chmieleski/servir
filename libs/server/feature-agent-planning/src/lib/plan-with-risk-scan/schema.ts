import { z } from 'zod';
import { REQUIRED_RISK_CATEGORIES, RISK_CATEGORIES } from './taxonomy.js';

export const riskCategorySchema = z.enum(RISK_CATEGORIES);

export const riskItemSchema = z
  .object({
    id: z.string().min(1),
    risco: z.string().min(10),
    categoria: riskCategorySchema,
    probabilidade: z.number().int().min(1).max(5),
    impacto: z.number().int().min(1).max(5),
    score: z.number().int().min(1).max(25),
    mitigacao: z.string().min(10),
    contingencia: z.string().min(10),
    sinaisDeAlerta: z.string().min(8),
    owner: z.string().min(2),
  })
  .superRefine((value, ctx) => {
    if (value.score !== value.probabilidade * value.impacto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['score'],
        message: 'score must be probabilidade * impacto',
      });
    }
  });

export const riskRegisterSchema = z.array(riskItemSchema).min(8).superRefine((items, ctx) => {
  const categories = new Set(items.map((item) => item.categoria));

  for (const requiredCategory of REQUIRED_RISK_CATEGORIES) {
    if (!categories.has(requiredCategory)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoria'],
        message: `missing required category: ${requiredCategory}`,
      });
    }
  }
});