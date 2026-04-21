export type ScheduleSlot = 'morning' | 'noon' | 'evening';

export type MedicineSchedule = {
  id?: number;
  slot: ScheduleSlot;
  enabled: boolean;
  doseTime: string;
  qty: number;
};

export type Medicine = {
  id: number;
  rxName: string;
  daysOfSupply: number;
  totalAvailableQty: number;
  remainingQty: number;
  dailyQtyPlanned: number;
  estimatedDepletionDate: string;
  notes?: string;
  schedules: MedicineSchedule[];
  createdAt?: string;
  updatedAt?: string;
};

export type MedicinePayload = {
  rxName: string;
  daysOfSupply: number;
  totalAvailableQty: number;
  notes?: string;
  schedules: MedicineSchedule[];
};

export type DueReminder = {
  id: number;
  medicineId: number;
  rxName: string;
  slot: ScheduleSlot;
  alertType: 'pre' | 'on_time';
  doseTime: string;
  qty: number;
  scheduledFor: string;
  status: string;
  displayMessage: string;
};
