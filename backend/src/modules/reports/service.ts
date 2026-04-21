import { errorFactory } from '../../shared/errors';
import { prisma } from '../../shared/prisma/client';
import { generateNormalizedAnalysis } from '../ai-analysis/service';
import { extractReportText } from './extraction';

const ANALYSIS_STATUS = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

export async function createUploadedReport(input: {
  userId: number;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  storedPath: string;
}) {
  const report = await prisma.uploadedReport.create({
    data: {
      userId: input.userId,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storedPath: input.storedPath,
      analysisStatus: ANALYSIS_STATUS.UPLOADED
    }
  });

  return {
    id: report.id,
    originalFilename: report.originalFilename,
    mimeType: report.mimeType,
    fileSize: report.fileSize,
    analysisStatus: report.analysisStatus,
    createdAt: report.createdAt.toISOString()
  };
}

export async function listReports(userId: number) {
  const rows = await prisma.uploadedReport.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map((row) => ({
    id: row.id,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    analysisStatus: row.analysisStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));
}

export async function getReportById(userId: number, reportId: number) {
  const report = await prisma.uploadedReport.findFirst({
    where: {
      id: reportId,
      userId
    }
  });

  if (!report) {
    throw errorFactory.notFound();
  }

  return {
    id: report.id,
    originalFilename: report.originalFilename,
    mimeType: report.mimeType,
    fileSize: report.fileSize,
    analysisStatus: report.analysisStatus,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString()
  };
}

export async function analyzeReportSync(input: {
  userId: number;
  reportId: number;
  correlationId?: string;
}) {
  const report = await prisma.uploadedReport.findFirst({
    where: {
      id: input.reportId,
      userId: input.userId
    }
  });

  if (!report) {
    throw errorFactory.notFound();
  }

  await prisma.uploadedReport.update({
    where: { id: report.id },
    data: {
      analysisStatus: ANALYSIS_STATUS.PROCESSING
    }
  });

  try {
    const extractedText = await extractReportText({
      storedPath: report.storedPath,
      originalFilename: report.originalFilename,
      mimeType: report.mimeType,
      fileSize: report.fileSize
    });

    const normalized = await generateNormalizedAnalysis({
      reportName: report.originalFilename,
      mimeType: report.mimeType,
      extractedText,
      correlationId: input.correlationId
    });

    const saved = await prisma.$transaction(async (tx) => {
      const analysis = await tx.reportAnalysis.upsert({
        where: { reportId: report.id },
        update: {
          summaryLayman: normalized.summaryLayman,
          risksJson: JSON.stringify(normalized.risks),
          medicineSuggestionsJson: JSON.stringify(normalized.medicineSuggestions),
          vitaminSuggestionsJson: JSON.stringify(normalized.vitaminSuggestions),
          notesJson: JSON.stringify(normalized.importantNotes),
          disclaimer: normalized.disclaimer,
          aiModel: normalized.aiModel
        },
        create: {
          reportId: report.id,
          summaryLayman: normalized.summaryLayman,
          risksJson: JSON.stringify(normalized.risks),
          medicineSuggestionsJson: JSON.stringify(normalized.medicineSuggestions),
          vitaminSuggestionsJson: JSON.stringify(normalized.vitaminSuggestions),
          notesJson: JSON.stringify(normalized.importantNotes),
          disclaimer: normalized.disclaimer,
          aiModel: normalized.aiModel
        }
      });

      await tx.uploadedReport.update({
        where: { id: report.id },
        data: {
          extractedText,
          analysisStatus: ANALYSIS_STATUS.COMPLETED
        }
      });

      return analysis;
    });

    return {
      reportId: report.id,
      analysisStatus: ANALYSIS_STATUS.COMPLETED,
      analysis: {
        reportId: report.id,
        summaryLayman: saved.summaryLayman,
        risks: parseJsonArray(saved.risksJson),
        medicineSuggestions: parseJsonArray(saved.medicineSuggestionsJson),
        vitaminSuggestions: parseJsonArray(saved.vitaminSuggestionsJson),
        importantNotes: parseJsonArray(saved.notesJson),
        disclaimer: saved.disclaimer,
        aiModel: saved.aiModel,
        createdAt: saved.createdAt.toISOString()
      }
    };
  } catch (error) {
    await prisma.uploadedReport.update({
      where: { id: report.id },
      data: {
        analysisStatus: ANALYSIS_STATUS.FAILED
      }
    });
    throw error;
  }
}

export async function getReportAnalysis(userId: number, reportId: number) {
  const report = await prisma.uploadedReport.findFirst({
    where: {
      id: reportId,
      userId
    },
    include: {
      analysis: true
    }
  });

  if (!report) {
    throw errorFactory.notFound();
  }

  if (!report.analysis) {
    throw errorFactory.notFound('Analysis was not found for this report.');
  }

  return {
    reportId: report.id,
    summaryLayman: report.analysis.summaryLayman,
    risks: parseJsonArray(report.analysis.risksJson),
    medicineSuggestions: parseJsonArray(report.analysis.medicineSuggestionsJson),
    vitaminSuggestions: parseJsonArray(report.analysis.vitaminSuggestionsJson),
    importantNotes: parseJsonArray(report.analysis.notesJson),
    disclaimer: report.analysis.disclaimer,
    aiModel: report.analysis.aiModel,
    createdAt: report.analysis.createdAt.toISOString()
  };
}
