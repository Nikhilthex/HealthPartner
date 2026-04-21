import { z } from 'zod';

export const aiAnalysisSchema = z.object({
  summaryLayman: z.string().min(10),
  risks: z.array(z.string()).min(1),
  medicineSuggestions: z.array(z.string()).min(1),
  vitaminSuggestions: z.array(z.string()).min(1),
  importantNotes: z.array(z.string()).min(1)
});

export type AiAnalysisPayload = z.infer<typeof aiAnalysisSchema>;
