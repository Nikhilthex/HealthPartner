import { test, expect } from '@playwright/test';
import { loginAsDemo } from './helpers';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAwMBASsJTYQAAAAASUVORK5CYII=',
  'base64'
);

test.describe('Reports APIs', () => {
  test.beforeEach(async ({ request }) => {
    await loginAsDemo(request);
  });

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
    expect(analyzeBody.data.analysis.summaryLayman).toContain('blood sugar');
    expect(analyzeBody.data.analysis.risks).toContain('Blood sugar markers may be above the expected range.');
    expect(analyzeBody.data.analysis.risks).toContain('Vitamin levels may need follow-up review.');

    const analysisResponse = await request.get(`/api/reports/${reportId}/analysis`);
    expect(analysisResponse.status()).toBe(200);
    const analysisBody = await analysisResponse.json();
    expect(analysisBody.data.reportId).toBe(reportId);
    expect(Array.isArray(analysisBody.data.risks)).toBeTruthy();
    expect(analysisBody.data.summaryLayman).toContain('blood sugar');
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

  test('PNG upload can be analyzed and returns a safe summary even when OCR text is limited', async ({ request }) => {
    const uploadResponse = await request.post('/api/reports/upload', {
      multipart: {
        reportFile: {
          name: 'scan.png',
          mimeType: 'image/png',
          buffer: tinyPng
        }
      }
    });

    expect(uploadResponse.status()).toBe(201);
    const uploadBody = await uploadResponse.json();
    const reportId = uploadBody.data.id as number;

    const analyzeResponse = await request.post(`/api/reports/${reportId}/analyze`, {
      data: {
        analysisMode: 'sync'
      }
    });

    expect(analyzeResponse.status()).toBe(200);
    const analyzeBody = await analyzeResponse.json();
    expect(analyzeBody.data.analysisStatus).toBe('completed');
    expect(analyzeBody.data.analysis.disclaimer).toContain('informational only');
    expect(typeof analyzeBody.data.analysis.summaryLayman).toBe('string');
    expect(analyzeBody.data.analysis.summaryLayman.length).toBeGreaterThan(20);
  });

  test('POST /api/reports/upload requires auth', async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL });
    const response = await request.post('/api/reports/upload', {
      multipart: {
        reportFile: {
          name: 'blood-report.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 mock report content')
        }
      }
    });
    expect(response.status()).toBe(401);
    await request.dispose();
  });
});
