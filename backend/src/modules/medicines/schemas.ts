import { z } from 'zod';
import { isValidHHmm } from '../../shared/time';

const slotSchema = z.enum(['morning', 'noon', 'evening']);

export const medicineIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const baseScheduleSchema = z
  .object({
    slot: slotSchema,
    enabled: z.boolean(),
    doseTime: z.string().optional(),
    qty: z.number().nonnegative().optional()
  })
  .superRefine((value, ctx) => {
    if (value.enabled) {
      if (!value.doseTime || !isValidHHmm(value.doseTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['doseTime'],
          message: 'Enabled schedules must include a valid doseTime in HH:mm.'
        });
      }
      if (!value.qty || value.qty <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['qty'],
          message: 'Enabled schedules must include qty greater than 0.'
        });
      }
    }
  });

const schedulesArraySchema = z.array(baseScheduleSchema).superRefine((schedules, ctx) => {
  const enabled = schedules.filter((item) => item.enabled);
  if (enabled.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: 'At least one schedule must be enabled.'
    });
  }

  const slotSet = new Set<string>();
  for (const item of schedules) {
    if (slotSet.has(item.slot)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: `Duplicate schedule slot: ${item.slot}.`
      });
      break;
    }
    slotSet.add(item.slot);
  }
});

export const createMedicineBodySchema = z.object({
  rxName: z.string().trim().min(1).max(200),
  daysOfSupply: z.number().int().positive(),
  totalAvailableQty: z.number().positive(),
  notes: z.string().trim().max(1000).optional(),
  schedules: schedulesArraySchema
});

export const updateMedicineBodySchema = z.object({
  rxName: z.string().trim().min(1).max(200),
  daysOfSupply: z.number().int().positive(),
  totalAvailableQty: z.number().positive(),
  remainingQty: z.number().nonnegative().optional(),
  notes: z.string().trim().max(1000).optional(),
  schedules: schedulesArraySchema
});

export const listMedicinesQuerySchema = z.object({
  includeInactive: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') {
        return value;
      }
      return value === 'true';
    })
});

export const intakeBodySchema = z.object({
  reminderEventId: z.number().int().positive(),
  qtyTaken: z.number().positive(),
  takenAt: z.string().datetime()
});

export type CreateMedicineInput = z.infer<typeof createMedicineBodySchema>;
export type UpdateMedicineInput = z.infer<typeof updateMedicineBodySchema>;
export type IntakeInput = z.infer<typeof intakeBodySchema>;
