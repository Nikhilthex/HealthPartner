import { apiRequest } from '../../shared/api/apiClient';
import type { ReportAnalysis, UploadedReport } from './types';

export async function listReports() {
  const response = await apiRequest<UploadedReport[]>('/api/reports');
  return response.data;
}

export async function uploadReport(file: File) {
  const formData = new FormData();
  formData.append('reportFile', file);
  const response = await apiRequest<UploadedReport>('/api/reports/upload', {
    method: 'POST',
    body: formData
  });
  return response.data;
}

export async function startAnalysis(reportId: number) {
  const response = await apiRequest<{ reportId: number; analysisStatus: string }>(`/api/reports/${reportId}/analyze`, {
    method: 'POST',
    body: { analysisMode: 'sync' }
  });
  return response.data;
}

export async function getAnalysis(reportId: number) {
  const response = await apiRequest<ReportAnalysis>(`/api/reports/${reportId}/analysis`);
  return response.data;
}
