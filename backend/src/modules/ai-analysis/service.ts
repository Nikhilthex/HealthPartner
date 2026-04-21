import { AppError, errorFactory } from '../../shared/errors';
import { logger } from '../../shared/logger';
import { aiAnalysisSchema, type AiAnalysisPayload } from './schemas';
import {
  buildDeterministicFallbackProvider,
  buildOpenAiProvider,
  type AiProviderAdapter
} from './providers';

export interface NormalizedAnalysis extends AiAnalysisPayload {
  disclaimer: string;
  aiModel: string;
}

const DISCLAIMER = 'This analysis is informational only and not a diagnosis.';

interface GenerateNormalizedAnalysisOptions {
  primaryProvider?: AiProviderAdapter | null;
  fallbackProvider?: AiProviderAdapter;
}

async function runValidatedProvider(
  provider: AiProviderAdapter,
  input: {
    reportName: string;
    mimeType: string;
    extractedText: string;
    correlationId?: string;
  }
): Promise<NormalizedAnalysis> {
  const providerResult = await provider.runAnalysis({
    extractedText: input.extractedText,
    reportName: input.reportName,
    mimeType: input.mimeType
  });

  const parsed = aiAnalysisSchema.safeParse(providerResult);
  if (!parsed.success) {
    logger.error('ai_analysis_schema_validation_failed', {
      correlationId: input.correlationId,
      provider: provider.providerName,
      issues: parsed.error.issues
    });
    throw errorFactory.dependency('AI response format was invalid.');
  }

  return {
    ...parsed.data,
    disclaimer: DISCLAIMER,
    aiModel: provider.modelName
  };
}

function logProviderFailure(provider: AiProviderAdapter, correlationId: string | undefined, error: unknown): void {
  logger.warn('ai_analysis_provider_failed_using_fallback', {
    correlationId,
    provider: provider.providerName,
    model: provider.modelName,
    message: error instanceof Error ? error.message : 'unknown_error'
  });
}

export async function generateNormalizedAnalysis(
  input: {
    reportName: string;
    mimeType: string;
    extractedText: string;
    correlationId?: string;
  },
  options: GenerateNormalizedAnalysisOptions = {}
): Promise<NormalizedAnalysis> {
  const primaryProvider = options.primaryProvider === undefined ? buildOpenAiProvider() : options.primaryProvider;
  const fallbackProvider = options.fallbackProvider ?? buildDeterministicFallbackProvider();

  if (primaryProvider) {
    try {
      return await runValidatedProvider(primaryProvider, input);
    } catch (error) {
      logProviderFailure(primaryProvider, input.correlationId, error);
    }
  }

  try {
    return await runValidatedProvider(fallbackProvider, input);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logger.error('ai_analysis_failed', {
      correlationId: input.correlationId,
      provider: fallbackProvider.providerName,
      model: fallbackProvider.modelName,
      message: error instanceof Error ? error.message : 'unknown_error'
    });
    throw errorFactory.dependency('Failed to generate report analysis.');
  }
}
