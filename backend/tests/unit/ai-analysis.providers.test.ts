import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DeterministicFallbackAdapter,
  OpenAiProviderAdapter,
  type OpenAiResponsesClient
} from '../../src/modules/ai-analysis/providers';

test('OpenAiProviderAdapter returns the parsed structured analysis payload', async () => {
  const client: OpenAiResponsesClient = {
    responses: {
      async parse(params: unknown) {
        const request = params as { model?: string; input?: string };
        assert.equal(request.model, 'gpt-5.4-mini');
        assert.match(request.input ?? '', /blood-report\.pdf/);

        return {
          output_parsed: {
            summaryLayman: 'The report suggests higher blood sugar markers that should be reviewed by a clinician.',
            risks: ['Blood sugar markers may be above the expected range.'],
            medicineSuggestions: ['Ask whether your current medicine plan should be reviewed.'],
            vitaminSuggestions: ['Ask whether vitamin-related follow-up is needed.'],
            importantNotes: ['This summary is informational support only.']
          }
        };
      }
    }
  };

  const adapter = new OpenAiProviderAdapter(client, 'gpt-5.4-mini');
  const result = await adapter.runAnalysis({
    extractedText: 'Glucose is elevated on the uploaded report.',
    reportName: 'blood-report.pdf',
    mimeType: 'application/pdf'
  });

  assert.match(String((result as { summaryLayman: string }).summaryLayman), /blood sugar/i);
});

test('DeterministicFallbackAdapter returns a safe low-confidence summary for low-signal files', async () => {
  const adapter = new DeterministicFallbackAdapter();
  const result = await adapter.runAnalysis({
    extractedText: 'No readable text preview available.'
  });

  assert.match(result.summaryLayman, /could not extract enough readable report text/i);
  assert.equal(result.importantNotes.length, 1);
});
