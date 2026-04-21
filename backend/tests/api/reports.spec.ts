import { test, expect } from '@playwright/test';

test.describe('Reports APIs', () => {
  test('POST /api/reports/upload validates mime type', async ({ request }) => {
    const response = await request.post('/api/reports/upload', {
      multipart: {
        reportFile: {
          name: 'notes.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('invalid file')
        }
      }
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('upload, list, get, analyze sync, and fetch analysis flow', async ({ request }) => {
    const uploadResponse = await request.post('/api/reports/upload', {
      multipart: {
        reportFile: {
          name: 'blood-report.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 mock report content glucose vitamin d')
        }
      }
    });

    expect(uploadResponse.status()).toBe(201);
    const uploadBody = await uploadResponse.json();
    const reportId = uploadBody.data.id as number;
    expect(uploadBody.data.analysisStatus).toBe('uploaded');

    const listResponse = await request.get('/api/reports');
    expect(listResponse.status()).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data.some((item: { id: number }) => item.id === reportId)).toBeTruthy();

    const getResponse = await request.get(`/api/reports/${reportId}`);
    expect(getResponse.status()).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody.data.id).toBe(reportId);

    const analyzeResponse = await request.post(`/api/reports/${reportId}/analyze`, {
      data: {
        analysisMode: 'sync'
      }
    });
    expect(analyzeResponse.status()).toBe(200);
    const analyzeBody = await analyzeResponse.json();
    expect(analyzeBody.data.analysisStatus).toBe('completed');
    expect(analyzeBody.data.analysis.disclaimer).toContain('informational only');

    const analysisResponse = await request.get(`/api/reports/${reportId}/analysis`);
    expect(analysisResponse.status()).toBe(200);
    const analysisBody = await analysisResponse.json();
    expect(analysisBody.data.reportId).toBe(reportId);
    expect(Array.isArray(analysisBody.data.risks)).toBeTruthy();
  });

  test('POST /api/reports/:id/analyze validates body and handles 404', async ({ request }) => {
    const invalidResponse = await request.post('/api/reports/1/analyze', {
      data: {
        analysisMode: 'async'
      }
    });
    expect(invalidResponse.status()).toBe(422);

    const notFoundResponse = await request.post('/api/reports/99999999/analyze', {
      data: {
        analysisMode: 'sync'
      }
    });
    expect(notFoundResponse.status()).toBe(404);
  });

  test('GET /api/reports/:id/analysis returns 404 when analysis is missing', async ({ request }) => {
    const uploadResponse = await request.post('/api/reports/upload', {
      multipart: {
        reportFile: {
          name: 'pending-report.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 pending analysis file')
        }
      }
    });
    const uploadBody = await uploadResponse.json();
    const reportId = uploadBody.data.id as number;

    const analysisResponse = await request.get(`/api/reports/${reportId}/analysis`);
    expect(analysisResponse.status()).toBe(404);
  });
});
