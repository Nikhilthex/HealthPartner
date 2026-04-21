import { z } from 'zod';

export const reportIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const analyzeReportBodySchema = z.object({
  analysisMode: z.enum(['sync']).optional().default('sync')
});
