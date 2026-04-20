export type ReportStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export type UploadedReport = {
  id: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  analysisStatus: ReportStatus;
  createdAt: string;
  updatedAt?: string;
};

export type ReportAnalysis = {
  reportId: number;
  summaryLayman: string;
  risks: string[];
  medicineSuggestions: string[];
  vitaminSuggestions: string[];
  importantNotes: string[];
  disclaimer: string;
  aiModel: string;
  createdAt: string;
};
