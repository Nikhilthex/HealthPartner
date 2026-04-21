import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { ApiError, reportsApi } from "../../lib/api";
import type { ReportAnalysis, ReportRecord } from "../../lib/api";

function formatAnalysisDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export const ReportsPage = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedReport = reports.find((item) => item.id === selectedReportId) ?? null;

  const loadReports = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const result = await reportsApi.list();
      setReports(result);
      if (!result.some((item) => item.id === selectedReportId)) {
        setSelectedReportId(result[0]?.id ?? null);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  useEffect(() => {
    if (!selectedReportId) {
      setAnalysis(null);
      setAnalysisLoading(false);
      setAnalysisError(null);
      return;
    }

    let active = true;
    setAnalysisLoading(true);
    setAnalysisError(null);

    reportsApi
      .getAnalysis(selectedReportId)
      .then((result) => {
        if (active) {
          setAnalysis(result);
          setAnalysisError(null);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setAnalysis(null);

        if (error instanceof ApiError && error.status === 404) {
          setAnalysisError(null);
          return;
        }

        setAnalysisError(error instanceof Error ? error.message : "Unable to load saved analysis.");
      })
      .finally(() => {
        if (active) {
          setAnalysisLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedReportId]);

  const uploadReport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const uploaded = await reportsApi.upload(file);
      setSuccessMessage(`Uploaded ${uploaded.originalFilename}.`);
      await loadReports();
      setSelectedReportId(uploaded.id);
      setAnalysis(null);
      setAnalysisError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to upload report.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const analyzeSelectedReport = async () => {
    if (!selectedReportId) {
      return;
    }

    setAnalyzing(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const result = await reportsApi.analyze(selectedReportId);
      setAnalysis(result.analysis);
      setAnalysisError(null);
      setSuccessMessage("Analysis completed successfully.");
      await loadReports();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to analyze report.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="feature-grid">
      <div className="panel stack-gap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Analyze Reports</p>
            <h2>Upload and review analysis</h2>
          </div>
        </div>

        <label className="upload-dropzone">
          <span className="upload-dropzone__title">Upload PDF, PNG, or JPEG</span>
          <span className="muted">Files larger than 5 MB are rejected by the backend.</span>
          <input
            aria-label="Upload report file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={uploadReport}
          />
        </label>

        {uploading ? <p className="muted">Uploading report...</p> : null}
        {actionError ? <div className="form-error">{actionError}</div> : null}
        {successMessage ? <div className="form-success">{successMessage}</div> : null}

        {loading ? <p className="muted">Loading reports...</p> : null}
        {loadError ? (
          <div className="stack-gap">
            <div className="form-error">{loadError}</div>
            <button className="button button--ghost" type="button" onClick={() => void loadReports()}>
              Retry
            </button>
          </div>
        ) : null}
        {!loading && !loadError && reports.length === 0 ? (
          <div className="empty-state">
            <h3>No reports uploaded</h3>
            <p className="muted">Upload a file to start the analysis flow.</p>
          </div>
        ) : null}
        {!loading && !loadError && reports.length > 0 ? (
          <div className="list-stack">
            {reports.map((report) => (
              <button
                key={report.id}
                className={report.id === selectedReportId ? "list-card list-card--active" : "list-card"}
                type="button"
                onClick={() => setSelectedReportId(report.id)}
              >
                <div className="list-card__row">
                  <strong>{report.originalFilename}</strong>
                  <span className="pill">{report.analysisStatus}</span>
                </div>
                <p className="muted">
                  {report.mimeType} • {(report.fileSize / 1024).toFixed(1)} KB
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="panel stack-gap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Analysis Result</p>
            <h2>{selectedReport ? selectedReport.originalFilename : "Select a report"}</h2>
          </div>
          <button className="button" type="button" onClick={() => void analyzeSelectedReport()} disabled={!selectedReportId || analyzing}>
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>

        {!selectedReport ? (
          <div className="empty-state">
            <h3>No report selected</h3>
            <p className="muted">Choose an uploaded report to review or analyze it.</p>
          </div>
        ) : null}

        {selectedReport ? (
          <div className="list-card">
            <div className="list-card__row">
              <strong>Status</strong>
              <span className="pill">{selectedReport.analysisStatus}</span>
            </div>
            {analysis?.aiModel ? <p className="muted">Generated by {analysis.aiModel}</p> : null}
            {analysis?.createdAt ? <p className="muted">Analyzed on {formatAnalysisDate(analysis.createdAt)}</p> : null}
          </div>
        ) : null}

        {selectedReport && analysisLoading ? (
          <div className="empty-state">
            <h3>Loading saved analysis</h3>
            <p className="muted">Checking whether this report already has a stored AI summary.</p>
          </div>
        ) : null}

        {selectedReport && !analysisLoading && analysisError ? (
          <div className="empty-state">
            <h3>Analysis unavailable</h3>
            <div className="form-error">{analysisError}</div>
          </div>
        ) : null}

        {selectedReport && !analysisLoading && !analysis && !analysisError && selectedReport.analysisStatus === "processing" ? (
          <div className="empty-state">
            <h3>Analysis in progress</h3>
            <p className="muted">This report is still being processed. Refresh or run analysis again in a moment.</p>
          </div>
        ) : null}

        {selectedReport && !analysisLoading && !analysis && !analysisError && selectedReport.analysisStatus === "failed" ? (
          <div className="empty-state">
            <h3>Previous analysis failed</h3>
            <p className="muted">Try running analysis again after confirming the report file is readable.</p>
          </div>
        ) : null}

        {selectedReport &&
        !analysisLoading &&
        !analysis &&
        !analysisError &&
        selectedReport.analysisStatus !== "processing" &&
        selectedReport.analysisStatus !== "failed" ? (
          <div className="empty-state">
            <h3>No analysis yet</h3>
            <p className="muted">Run analysis to generate a patient-friendly summary and discussion points.</p>
          </div>
        ) : null}

        {analysis && !analysisLoading ? (
          <div className="stack-gap">
            <div className="notice notice--warning">
              <strong>Disclaimer:</strong> {analysis.disclaimer}
            </div>
            <section className="result-block">
              <h3>Summary</h3>
              <p>{analysis.summaryLayman}</p>
            </section>
            <section className="result-block">
              <h3>Risks To Discuss</h3>
              <ul className="result-list">
                {analysis.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="result-block">
              <h3>Vitamin Suggestions</h3>
              <ul className="result-list">
                {analysis.vitaminSuggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="result-block">
              <h3>Medicine Suggestions</h3>
              <ul className="result-list">
                {analysis.medicineSuggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="result-block">
              <h3>Important Notes</h3>
              <ul className="result-list">
                {analysis.importantNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  );
};
