import { env } from '../../config/env';
import { errorFactory } from '../../shared/errors';
import { logger } from '../../shared/logger';
import { aiAnalysisSchema, type AiAnalysisPayload } from './schemas';
import { buildAiProvider } from './providers';

export interface NormalizedAnalysis extends AiAnalysisPayload {
  disclaimer: string;
  aiModel: string;
}

const DISCLAIMER = 'This analysis is informational only and not a diagnosis.';

const provider = buildAiProvider();

export async function generateNormalizedAnalysis(input: {
  reportName: string;
  mimeType: string;
  extractedText: string;
  correlationId?: string;
}): Promise<NormalizedAnalysis> {
  try {
    const providerResult = await provider.runAnalysis({
      extractedText: input.extractedText,
      reportName: input.reportName,
      mimeType: input.mimeType
    });

    const parsed = aiAnalysisSchema.safeParse(providerResult);
    if (!parsed.success) {
      logger.error('ai_analysis_schema_validation_failed', {
        correlationId: input.correlationId,
        issues: parsed.error.issues
      });
      throw errorFactory.dependency('AI response format was invalid.');
    }

    return {
      ...parsed.data,
      disclaimer: DISCLAIMER,
      aiModel: env.AI_MODEL
    };
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }

    logger.error('ai_analysis_failed', {
      correlationId: input.correlationId,
      message: error instanceof Error ? error.message : 'unknown_error'
    });
    throw errorFactory.dependency('Failed to generate report analysis.');
  }
}
