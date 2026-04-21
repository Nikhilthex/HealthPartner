import type { MedicinePayload, MedicineSchedule, ScheduleSlot } from './types';

export type MedicineFormErrors = Partial<Record<string, string>>;

export const defaultSchedules: MedicineSchedule[] = [
  { slot: 'morning', enabled: true, doseTime: '08:00', qty: 1 },
  { slot: 'noon', enabled: false, doseTime: '13:00', qty: 0 },
  { slot: 'evening', enabled: true, doseTime: '20:00', qty: 1 }
];

export function validateMedicine(payload: MedicinePayload): MedicineFormErrors {
  const errors: MedicineFormErrors = {};

  if (!payload.rxName.trim()) {
    errors.rxName = 'Rx name is required.';
  }

  if (!Number.isFinite(payload.daysOfSupply) || payload.daysOfSupply <= 0) {
    errors.daysOfSupply = 'Days of supply must be greater than zero.';
  }

  if (!Number.isFinite(payload.totalAvailableQty) || payload.totalAvailableQty <= 0) {
    errors.totalAvailableQty = 'Total quantity must be greater than zero.';
  }

  const enabledSchedules = payload.schedules.filter((schedule) => schedule.enabled);
  if (enabledSchedules.length === 0) {
    errors.schedules = 'Enable at least one schedule.';
  }

  enabledSchedules.forEach((schedule) => {
    if (!isTime(schedule.doseTime)) {
      errors[`${schedule.slot}Time`] = 'Enter a valid time.';
    }

    if (!Number.isFinite(schedule.qty) || schedule.qty <= 0) {
      errors[`${schedule.slot}Qty`] = 'Quantity must be greater than zero.';
    }
  });

  return errors;
}

export function hasErrors(errors: MedicineFormErrors) {
  return Object.keys(errors).length > 0;
}

export function labelForSlot(slot: ScheduleSlot) {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

function isTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
