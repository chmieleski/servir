import { z } from 'zod';

export const HealthQuerySchema = z.object({
  format: z.enum(['full', 'minimal']).optional(),
});

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
  version: z.string().min(1),
  timestamp: z.string().datetime(),
});

export const ApiErrorIssueSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string().min(1),
  code: z.string().min(1),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    issues: z.array(ApiErrorIssueSchema).default([]),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
    path: z.string().min(1),
  }),
});

export type HealthQuery = z.infer<typeof HealthQuerySchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type ApiErrorIssue = z.infer<typeof ApiErrorIssueSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
