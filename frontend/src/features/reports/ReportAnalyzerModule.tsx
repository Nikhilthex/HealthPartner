import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ApiError } from '../../shared/api/apiClient';
import { StatusMessage } from '../../shared/ui/StatusMessage';
import { AnalysisResult } from './AnalysisResult';
import { getAnalysis, listReports, startAnalysis, uploadReport } from './api';
import type { ReportAnalysis, UploadedReport } from './types';
import { validateReportFile } from './validation';

export function ReportAnalyzerModule() {
  const [reports, setReports] = useState<UploadedReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState<'uploading' | 'analyzing' | null>(null);

  useEffect(() => {
    void loadReports();
  }, []);

  async function loadReports() {
    setStatus('loading');
    try {
      const loaded = await listReports();
      setReports(loaded);
      setSelectedReportId(loaded[0]?.id ?? null);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof ApiError ? error.message : 'Unable to load reports.');
    }
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    const nextError = validateReportFile(file);
    setFileError(nextError);
    if (nextError || !file) {
      return;
    }

    setBusyAction('uploading');
    setMessage('');
    try {
      const uploaded = await uploadReport(file);
      setReports((current) => [uploaded, ...current]);
      setSelectedReportId(uploaded.id);
      setFile(null);
      setMessage('Report uploaded. You can start analysis now.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to upload report.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAnalyze() {
    if (!selectedReportId) {
      setMessage('Choose a report to analyze.');
      return;
    }

    setBusyAction('analyzing');
    setMessage('');
    setAnalysis(null);
    try {
      await startAnalysis(selectedReportId);
      const result = await getAnalysis(selectedReportId);
      setAnalysis(result);
      setMessage('Analysis completed.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to analyze this report.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="feature-section" aria-labelledby="reports-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Analyze Reports</p>
          <h2 id="reports-title">Upload a report for AI-assisted review</h2>
        </div>
      </div>

      {status === 'loading' && <StatusMessage>Loading report history...</StatusMessage>}
      {status === 'error' && <StatusMessage tone="error">{message || 'Unable to load reports.'}</StatusMessage>}
      {message && status !== 'error' && <StatusMessage tone={message.includes('Unable') ? 'error' : 'success'}>{message}</StatusMessage>}

      <form className="panel upload-panel" onSubmit={handleUpload} noValidate>
        <div className="field">
          <label htmlFor="reportFile">Report file</label>
          <input
            id="reportFile"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              setFileError(validateReportFile(nextFile));
            }}
          />
          {fileError && <span className="field-error">{fileError}</span>}
        </div>

        <button className="primary-button" type="submit" disabled={busyAction === 'uploading'}>
          {busyAction === 'uploading' ? 'Uploading...' : 'Upload report'}
        </button>
      </form>

      <div className="panel analysis-controls">
        <div className="field">
          <label htmlFor="reportSelect">Uploaded reports</label>
          <select
            id="reportSelect"
            value={selectedReportId ?? ''}
            onChange={(event) => setSelectedReportId(Number(event.target.value))}
          >
            {reports.length === 0 && <option value="">No uploaded reports</option>}
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.originalFilename} · {report.analysisStatus}
              </option>
            ))}
          </select>
        </div>

        <button className="primary-button" type="button" onClick={() => void handleAnalyze()} disabled={!selectedReportId || busyAction === 'analyzing'}>
          {busyAction === 'analyzing' ? 'Analyzing...' : 'Analyze selected report'}
        </button>
      </div>

      {status === 'ready' && reports.length === 0 && <div className="empty-state">No reports uploaded yet.</div>}
      {analysis && <AnalysisResult analysis={analysis} />}
    </section>
  );
}
