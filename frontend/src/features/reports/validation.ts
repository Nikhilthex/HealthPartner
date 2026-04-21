const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
const maxBytes = 10 * 1024 * 1024;

export function validateReportFile(file: File | null) {
  if (!file) {
    return 'Choose a PDF, PNG, or JPG report.';
  }

  if (!allowedTypes.includes(file.type)) {
    return 'Only PDF, PNG, and JPG reports are supported.';
  }

  if (file.size > maxBytes) {
    return 'Report must be 10 MB or smaller.';
  }

  return '';
}
