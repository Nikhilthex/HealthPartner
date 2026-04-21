import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { recognize } from 'tesseract.js';

function cleanExtractedText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractReadableSegments(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const matches = raw.match(/[A-Za-z0-9][A-Za-z0-9 ,.%:+\-_/()]{3,}/g) ?? [];
  const ignored = new Set([
    'obj',
    'endobj',
    'stream',
    'endstream',
    'xref',
    'trailer',
    'startxref',
    'Type',
    'Length',
    'Filter',
    'Root',
    'Size',
    'Pages',
    'Page',
    'Catalog',
    'Font',
    'ProcSet'
  ]);

  const unique = new Set<string>();
  const segments: string[] = [];

  for (const match of matches) {
    const normalized = cleanExtractedText(match);
    if (normalized.length < 4) {
      continue;
    }

    if (!/[A-Za-z]{2,}/.test(normalized)) {
      continue;
    }

    if (ignored.has(normalized)) {
      continue;
    }

    const lowered = normalized.toLowerCase();
    if (unique.has(lowered)) {
      continue;
    }

    unique.add(lowered);
    segments.push(normalized);

    if (segments.join(' ').length > 4000) {
      break;
    }
  }

  return segments.join(' ');
}

async function tryExtractPdfText(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return cleanExtractedText(parsed.text ?? '');
  } catch {
    return '';
  }
}

async function tryExtractImageText(buffer: Buffer): Promise<string> {
  if (buffer.length < 1024) {
    return '';
  }

  try {
    const result = await recognize(buffer, 'eng');
    return cleanExtractedText(result.data.text ?? '');
  } catch {
    return '';
  }
}

export async function extractReportText(report: {
  storedPath: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
}): Promise<string> {
  const absolutePath = path.resolve(process.cwd(), report.storedPath);
  const buffer = await fs.readFile(absolutePath);

  let preview = '';

  if (report.mimeType === 'application/pdf') {
    preview = await tryExtractPdfText(buffer);
    if (!preview) {
      preview = extractReadableSegments(buffer);
    }
  } else if (report.mimeType === 'image/png' || report.mimeType === 'image/jpeg') {
    preview = await tryExtractImageText(buffer);
  } else {
    preview = cleanExtractedText(buffer.toString('utf8'));
  }

  if (!preview) {
    preview = 'No readable text preview available.';
  }

  return [
    `File Name: ${report.originalFilename}`,
    `MIME: ${report.mimeType}`,
    `File Size: ${report.fileSize}`,
    `Preview: ${preview}`
  ].join('\n');
}
