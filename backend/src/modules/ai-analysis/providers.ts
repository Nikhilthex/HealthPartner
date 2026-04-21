import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { env } from '../../config/env';
import { aiAnalysisSchema, type AiAnalysisPayload } from './schemas';

export interface AiProviderAdapter {
  readonly providerName: string;
  readonly modelName: string;
  runAnalysis(input: { extractedText: string; reportName: string; mimeType: string }): Promise<unknown>;
}

export interface OpenAiResponsesClient {
  responses: {
    parse(request: unknown): Promise<{ output_parsed: unknown | null }>;
  };
}

const STRUCTURED_OUTPUT_NAME = 'health_partner_report_analysis';

const OPENAI_ANALYSIS_INSTRUCTIONS = `
You analyze uploaded health reports for a patient support application.
Return only the structured fields requested by the schema.
Keep the tone clear, cautious, and non-diagnostic.
Do not prescribe treatment, diagnose conditions, or claim certainty beyond the extracted report text.
Medicine and vitamin suggestions must be framed as discussion points for a clinician, not instructions.
If the report text is sparse, say that clearly and keep the output conservative.
`.trim();

function buildOpenAiInput(input: { extractedText: string; reportName: string; mimeType: string }): string {
  return [
    `Report name: ${input.reportName}`,
    `Report mime type: ${input.mimeType}`,
    'Extracted report text:',
    input.extractedText.slice(0, 12_000)
  ].join('\n\n');
}

export class OpenAiProviderAdapter implements AiProviderAdapter {
  public readonly providerName = 'openai';

  public constructor(
    private readonly client: OpenAiResponsesClient,
    public readonly modelName: string
  ) {}

  public async runAnalysis(input: { extractedText: string; reportName: string; mimeType: string }): Promise<unknown> {
    const response = await this.client.responses.parse({
      model: this.modelName,
      instructions: OPENAI_ANALYSIS_INSTRUCTIONS,
      input: buildOpenAiInput(input),
      text: {
        format: zodTextFormat(
          aiAnalysisSchema as unknown as Parameters<typeof zodTextFormat>[0],
          STRUCTURED_OUTPUT_NAME
        )
      }
    });

    return response.output_parsed;
  }
}

export class DeterministicFallbackAdapter implements AiProviderAdapter {
  public readonly providerName = 'deterministic-fallback';
  public readonly modelName = 'deterministic-fallback';

  public async runAnalysis(input: { extractedText: string }): Promise<AiAnalysisPayload> {
    const normalizedText = input.extractedText.toLowerCase();
    const highSugar = normalizedText.includes('glucose') || normalizedText.includes('hba1c');
    const lowVitamin = normalizedText.includes('vitamin d') || normalizedText.includes('b12');
    const inflammation = normalizedText.includes('crp') || normalizedText.includes('inflammation');
    const cholesterol = normalizedText.includes('cholesterol') || normalizedText.includes('ldl');
    const poorExtraction =
      normalizedText.includes('no readable text preview available') ||
      normalizedText.replace(/\s+/g, ' ').trim().length < 80;

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
    if (cholesterol) {
      risks.push('Cholesterol-related markers may need follow-up review.');
    }
    if (risks.length === 0) {
      risks.push(
        poorExtraction
          ? 'The uploaded file did not expose enough readable text for a confident automatic summary.'
          : 'No critical pattern was automatically detected, but a clinician should review the report.'
      );
    }

    const summaryParts: string[] = [];
    if (highSugar) {
      summaryParts.push('The report appears to mention blood sugar findings that may need clinician follow-up.');
    }
    if (lowVitamin) {
      summaryParts.push('It also appears to mention vitamin-related markers that may be lower than expected.');
    }
    if (inflammation) {
      summaryParts.push('There may be inflammation-related findings worth discussing with a clinician.');
    }
    if (cholesterol) {
      summaryParts.push('Cholesterol markers may also deserve review.');
    }
    if (summaryParts.length === 0) {
      summaryParts.push(
        poorExtraction
          ? 'The file was uploaded successfully, but the system could not extract enough readable report text to produce a detailed summary.'
          : 'This report has been summarized for quick understanding and should still be reviewed with your clinician.'
      );
    }

    return {
      summaryLayman: `${summaryParts.join(' ')} Please review the details with your doctor before making any health decisions.`,
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

export function createOpenAiClient(apiKey: string, baseURL?: string): OpenAiResponsesClient {
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {})
  });
}

export function buildOpenAiProvider(): AiProviderAdapter | null {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAiProviderAdapter(
    createOpenAiClient(env.OPENAI_API_KEY, env.OPENAI_BASE_URL),
    env.OPENAI_MODEL
  );
}

export function buildDeterministicFallbackProvider(): AiProviderAdapter {
  return new DeterministicFallbackAdapter();
}
