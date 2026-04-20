import path from 'node:path';
import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { env } from '../../config/env';
import { errorFactory } from '../../shared/errors';
import { sendSuccess } from '../../shared/http/responses';
import { validateRequest } from '../../shared/http/validate';
import { getCurrentUserId } from '../../shared/user-context';
import { analyzeReportBodySchema, reportIdParamSchema } from './schemas';
import {
  analyzeReportSync,
  createUploadedReport,
  getReportAnalysis,
  getReportById,
  listReports
} from './service';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(null, false);
      return;
    }
    callback(null, true);
  }
});

function uploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  upload.single('reportFile')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(
        errorFactory.validation([
          {
            field: 'reportFile',
            message: 'Report file size must be 5 MB or less.'
          }
        ])
      );
      return;
    }
    next(error);
  });
}

export function createReportsRouter(): Router {
  const router = Router();

  router.post('/upload', uploadMiddleware, async (req, res, next) => {
    try {
      if (!req.file || !ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
        throw errorFactory.validation([
          {
            field: 'reportFile',
            message: 'reportFile is required and must be a PDF, PNG, or JPEG.'
          }
        ]);
      }

      const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
      const result = await createUploadedReport({
        userId: getCurrentUserId(),
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storedPath: relativePath
      });

      return sendSuccess(res, 201, result);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/', async (_req, res, next) => {
    try {
      const result = await listReports(getCurrentUserId());
      return sendSuccess(res, 200, result);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id', validateRequest({ params: reportIdParamSchema }), async (req, res, next) => {
    try {
      const params = reportIdParamSchema.parse(req.params);
      const result = await getReportById(getCurrentUserId(), params.id);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return next(error);
    }
  });

  router.post(
    '/:id/analyze',
    validateRequest({ params: reportIdParamSchema, body: analyzeReportBodySchema }),
    async (req, res, next) => {
      try {
        const params = reportIdParamSchema.parse(req.params);
        analyzeReportBodySchema.parse(req.body);
        const result = await analyzeReportSync({
          userId: getCurrentUserId(),
          reportId: params.id,
          correlationId: req.correlationId
        });
        return sendSuccess(res, 200, result);
      } catch (error) {
        return next(error);
      }
    }
  );

  router.get('/:id/analysis', validateRequest({ params: reportIdParamSchema }), async (req, res, next) => {
    try {
      const params = reportIdParamSchema.parse(req.params);
      const result = await getReportAnalysis(getCurrentUserId(), params.id);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
