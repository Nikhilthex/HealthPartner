import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '../../test/fetchMock';
import { ReportAnalyzerModule } from './ReportAnalyzerModule';

describe('ReportAnalyzerModule', () => {
  it('shows upload validation for unsupported files', async () => {
    mockFetch({ '/api/reports': { body: { data: [] } } });
    render(<ReportAnalyzerModule />);

    await screen.findByText(/no reports uploaded yet/i);
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText(/report file/i), file, { applyAccept: false });

    expect(screen.getByText(/only pdf, png, and jpg/i)).toBeInTheDocument();
  });

  it('uploads and renders completed analysis', async () => {
    const { fetchMock } = mockFetch({
      '/api/reports': { body: { data: [] } },
      '/api/reports/upload': {
        status: 201,
        body: {
          data: {
            id: 77,
            originalFilename: 'blood-report.pdf',
            mimeType: 'application/pdf',
            fileSize: 1200,
            analysisStatus: 'uploaded',
            createdAt: '2026-04-20T10:10:00.000Z'
          }
        }
      },
      '/api/reports/77/analyze': {
        status: 202,
        body: { data: { reportId: 77, analysisStatus: 'processing' } }
      },
      '/api/reports/77/analysis': {
        body: {
          data: {
            reportId: 77,
            summaryLayman: 'Blood sugar is above the expected range.',
            risks: ['May need follow-up testing'],
            medicineSuggestions: ['Discuss medicine review with your doctor'],
            vitaminSuggestions: ['Ask whether vitamin D testing is needed'],
            importantNotes: ['Do not change medicine without medical advice'],
            disclaimer: 'This analysis is informational only and not a diagnosis.',
            aiModel: 'gpt-5.4-mini',
            createdAt: '2026-04-20T10:11:10.000Z'
          }
        }
      }
    });

    render(<ReportAnalyzerModule />);

    await screen.findByText(/no reports uploaded yet/i);
    const file = new File(['pdf'], 'blood-report.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText(/report file/i), file);
    await userEvent.click(screen.getByRole('button', { name: /upload report/i }));
    expect(await screen.findByText(/report uploaded/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /analyze selected report/i }));
    expect(await screen.findByText('Blood sugar is above the expected range.')).toBeInTheDocument();
    expect(screen.getByText(/medical disclaimer/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/reports/77/analysis', expect.any(Object)));
  });
});
