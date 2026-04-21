import { Router } from 'express';
import { validateRequest } from '../../shared/http/validate';
import { sendSuccess } from '../../shared/http/responses';
import { getCurrentUserId } from '../../shared/user-context';
import {
  createMedicineBodySchema,
  intakeBodySchema,
  listMedicinesQuerySchema,
  medicineIdParamSchema,
  updateMedicineBodySchema
} from './schemas';
import {
  archiveMedicine,
  createMedicine,
  getMedicineById,
  listMedicines,
  logMedicineIntake,
  updateMedicine
} from './service';

export function createMedicinesRouter(): Router {
  const router = Router();

  router.get('/', validateRequest({ query: listMedicinesQuerySchema }), async (req, res, next) => {
    try {
      const query = listMedicinesQuerySchema.parse(req.query);
      const result = await listMedicines(getCurrentUserId(), query.includeInactive ?? false);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id', validateRequest({ params: medicineIdParamSchema }), async (req, res, next) => {
    try {
      const params = medicineIdParamSchema.parse(req.params);
      const result = await getMedicineById(getCurrentUserId(), params.id);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/', validateRequest({ body: createMedicineBodySchema }), async (req, res, next) => {
    try {
      const payload = createMedicineBodySchema.parse(req.body);
      const result = await createMedicine(getCurrentUserId(), payload);
      return sendSuccess(res, 201, result);
    } catch (error) {
      return next(error);
    }
  });

  router.put(
    '/:id',
    validateRequest({ params: medicineIdParamSchema, body: updateMedicineBodySchema }),
    async (req, res, next) => {
      try {
        const params = medicineIdParamSchema.parse(req.params);
        const payload = updateMedicineBodySchema.parse(req.body);
        const result = await updateMedicine(getCurrentUserId(), params.id, payload);
        return sendSuccess(res, 200, result);
      } catch (error) {
        return next(error);
      }
    }
  );

  router.delete('/:id', validateRequest({ params: medicineIdParamSchema }), async (req, res, next) => {
    try {
      const params = medicineIdParamSchema.parse(req.params);
      const result = await archiveMedicine(getCurrentUserId(), params.id);
      return sendSuccess(res, 200, result);
    } catch (error) {
      return next(error);
    }
  });

  router.post(
    '/:id/intake',
    validateRequest({ params: medicineIdParamSchema, body: intakeBodySchema }),
    async (req, res, next) => {
      try {
        const params = medicineIdParamSchema.parse(req.params);
        const payload = intakeBodySchema.parse(req.body);
        const result = await logMedicineIntake(getCurrentUserId(), params.id, payload);
        return sendSuccess(res, 200, result);
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
