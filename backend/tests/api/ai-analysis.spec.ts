import { expect, test } from '@playwright/test';
import {
  DeterministicFallbackAdapter,
  OpenAiProviderAdapter
} from '../../src/modules/ai-analysis/providers';
import { generateNormalizedAnalysis } from '../../src/modules/ai-analysis/service';

test.describe('AI analysis provider contract', () => {
  test('OpenAI adapter sends a structured parse request and returns parsed output', async () => {
    let capturedRequest: unknown;

    const adapter = new OpenAiProviderAdapter(
      {
        responses: {
          async parse(request: unknown) {
            capturedRequest = request;
            return {
              output_parsed: {
                summaryLayman: 'Layman summary from OpenAI.',
                risks: ['One risk to review.'],
                medicineSuggestions: ['Discuss medicine questions with your clinician.'],
                vitaminSuggestions: ['Ask whether vitamin follow-up is needed.'],
                importantNotes: ['This is informational support only.']
              }
            };
          }
        }
      },
      'gpt-5.4-mini'
    );

    const result = await adapter.runAnalysis({
      extractedText: 'Glucose elevated. Vitamin D low.',
      reportName: 'lab-report.pdf',
      mimeType: 'application/pdf'
    });

    expect(result).toEqual({
      summaryLayman: 'Layman summary from OpenAI.',
      risks: ['One risk to review.'],
      medicineSuggestions: ['Discuss medicine questions with your clinician.'],
      vitaminSuggestions: ['Ask whether vitamin follow-up is needed.'],
      importantNotes: ['This is informational support only.']
    });

    expect(capturedRequest).toMatchObject({
      model: 'gpt-5.4-mini',
      instructions: expect.stringContaining('You analyze uploaded health reports'),
      input: expect.stringContaining('lab-report.pdf')
    });
  });

  test('service falls back to deterministic analysis when OpenAI output is malformed', async () => {
    const analysis = await generateNormalizedAnalysis(
      {
        reportName: 'blood-report.pdf',
        mimeType: 'application/pdf',
        extractedText: 'Glucose elevated and vitamin d low on this blood report.',
        correlationId: 'test-correlation-id'
      },
      {
        primaryProvider: new OpenAiProviderAdapter(
          {
            responses: {
              async parse() {
                return {
                  output_parsed: {
                    summaryLayman: 'too short',
                    risks: [],
                    medicineSuggestions: [],
                    vitaminSuggestions: [],
                    importantNotes: []
                  }
                };
              }
            }
          },
          'gpt-5.4-mini'
        ),
        fallbackProvider: new DeterministicFallbackAdapter()
      }
    );

    expect(analysis.aiModel).toBe('deterministic-fallback');
    expect(analysis.disclaimer).toContain('informational only');
    expect(analysis.summaryLayman.toLowerCase()).toContain('blood sugar');
    expect(analysis.risks).toContain('Blood sugar markers may be above the expected range.');
  });
});
