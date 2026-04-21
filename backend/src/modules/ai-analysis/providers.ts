import { env } from '../../config/env';
import { errorFactory } from '../../shared/errors';
import type { AiAnalysisPayload } from './schemas';

export interface AiProviderAdapter {
  runAnalysis(input: { extractedText: string; reportName: string; mimeType: string }): Promise<unknown>;
}

class HttpAiProviderAdapter implements AiProviderAdapter {
  public async runAnalysis(input: { extractedText: string; reportName: string; mimeType: string }): Promise<unknown> {
    if (!env.AI_PROVIDER_URL) {
      throw errorFactory.dependency('AI provider URL is not configured.');
    }

    const response = await fetch(env.AI_PROVIDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.AI_PROVIDER_API_KEY ? { Authorization: `Bearer ${env.AI_PROVIDER_API_KEY}` } : {})
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        report: {
          fileName: input.reportName,
          mimeType: input.mimeType
        },
        extractedText: input.extractedText.slice(0, 8000)
      })
    });

    if (!response.ok) {
      throw errorFactory.dependency(`AI provider responded with status ${response.status}.`);
    }

    return response.json();
  }
}

class DeterministicFallbackAdapter implements AiProviderAdapter {
  public async runAnalysis(input: { extractedText: string }): Promise<AiAnalysisPayload> {
    const normalizedText = input.extractedText.toLowerCase();
    const highSugar = normalizedText.includes('glucose') || normalizedText.includes('hba1c');
    const lowVitamin = normalizedText.includes('vitamin d') || normalizedText.includes('b12');
    const inflammation = normalizedText.includes('crp') || normalizedText.includes('inflammation');

    const risks: string[] = [];
    if (highSugar) {
      risks.push('Blood sugar markers may be above the expected range.');
    }
    if (lowVitamin) {
      risks.push('Vitamin levels may need follow-up review.');
    }
    if (inflammation) {
      risks.push('Inflammation-related markers may need clinician review.');
    }
    if (risks.length === 0) {
      risks.push('No critical pattern was automatically detected, but a clinician should review the report.');
    }

    return {
      summaryLayman:
        'This report has been summarized for quick understanding. Please review the details with your doctor before making any health decisions.',
      risks,
      medicineSuggestions: [
        'Discuss whether your current medicines should be reviewed based on these report findings.'
      ],
      vitaminSuggestions: [
        'Ask your clinician if vitamin evaluation is needed based on your symptoms and report findings.'
      ],
      importantNotes: [
        'Do not start, stop, or change medicines without consulting a qualified clinician.'
      ]
    };
  }
}

export function buildAiProvider(): AiProviderAdapter {
  if (env.AI_PROVIDER_URL) {
    return new HttpAiProviderAdapter();
  }
  return new DeterministicFallbackAdapter();
}
