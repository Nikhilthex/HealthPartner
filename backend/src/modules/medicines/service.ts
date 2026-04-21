import type { MedicineSchedule, Medicine } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { errorFactory } from '../../shared/errors';
import { calculateEstimatedDepletionDate, getDailyQtyPlanned, SLOT_ORDER } from '../../shared/time';
import { clearFutureReminderEventsForMedicine } from '../reminders/service';
import type { CreateMedicineInput, IntakeInput, UpdateMedicineInput } from './schemas';

type MedicineWithSchedules = Medicine & { schedules: MedicineSchedule[] };

const REMINDER_STATUS = {
  PENDING: 'pending',
  SHOWN: 'shown',
  TAKEN: 'taken'
} as const;

function mapMedicine(medicine: MedicineWithSchedules) {
  const schedules = [...medicine.schedules].sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot]);
  const dailyQtyPlanned = getDailyQtyPlanned(schedules.map((item) => ({ enabled: item.enabled, qty: item.qty })));
  const estimatedDepletionDate = calculateEstimatedDepletionDate(medicine.remainingQty, dailyQtyPlanned);

  return {
    id: medicine.id,
    rxName: medicine.rxName,
    daysOfSupply: medicine.daysOfSupply,
    totalAvailableQty: medicine.totalAvailableQty,
    remainingQty: medicine.remainingQty,
    dailyQtyPlanned,
    estimatedDepletionDate,
    notes: medicine.notes,
    schedules: schedules.map((schedule) => ({
      id: schedule.id,
      slot: schedule.slot,
      doseTime: schedule.doseTime,
      qty: schedule.qty,
      enabled: schedule.enabled
    })),
    createdAt: medicine.createdAt.toISOString(),
    updatedAt: medicine.updatedAt.toISOString()
  };
}

async function fetchDefaultTimes(userId: number): Promise<Record<string, string>> {
  const settings = await prisma.userAlertSettings.findUnique({
    where: { userId }
  });

  if (!settings) {
    return {
      morning: '08:00',
      noon: '13:00',
      evening: '20:00'
    };
  }

  return {
    morning: settings.morningTime,
    noon: settings.noonTime,
    evening: settings.eveningTime
  };
}

export async function listMedicines(userId: number, includeInactive = false) {
  const rows = await prisma.medicine.findMany({
    where: {
      userId,
      ...(includeInactive ? {} : { isActive: true })
    },
    include: {
      schedules: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return rows.map(mapMedicine);
}

export async function getMedicineById(userId: number, medicineId: number) {
  const medicine = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      userId
    },
    include: {
      schedules: true
    }
  });

  if (!medicine) {
    throw errorFactory.notFound();
  }

  return mapMedicine(medicine);
}

export async function createMedicine(userId: number, input: CreateMedicineInput) {
  const defaults = await fetchDefaultTimes(userId);

  const created = await prisma.$transaction(async (tx) => {
    const medicine = await tx.medicine.create({
      data: {
        userId,
        rxName: input.rxName,
        daysOfSupply: input.daysOfSupply,
        totalAvailableQty: input.totalAvailableQty,
        remainingQty: input.totalAvailableQty,
        notes: input.notes ?? null,
        isActive: true
      }
    });

    for (const schedule of input.schedules) {
      await tx.medicineSchedule.create({
        data: {
          medicineId: medicine.id,
          slot: schedule.slot,
          enabled: schedule.enabled,
          doseTime: schedule.doseTime ?? defaults[schedule.slot],
          qty: schedule.qty ?? 0
        }
      });
    }

    return tx.medicine.findUniqueOrThrow({
      where: { id: medicine.id },
      include: { schedules: true }
    });
  });

  return mapMedicine(created);
}

export async function updateMedicine(userId: number, medicineId: number, input: UpdateMedicineInput) {
  const existing = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      userId
    },
    include: {
      schedules: true
    }
  });

  if (!existing) {
    throw errorFactory.notFound();
  }

  const defaults = await fetchDefaultTimes(userId);

  const result = await prisma.$transaction(async (tx) => {
    const nextRemainingQty = input.remainingQty ?? Math.min(existing.remainingQty, input.totalAvailableQty);
    if (nextRemainingQty > input.totalAvailableQty) {
      throw errorFactory.validation([
        {
          field: 'remainingQty',
          message: 'remainingQty cannot exceed totalAvailableQty.'
        }
      ]);
    }

    await tx.medicine.update({
      where: { id: medicineId },
      data: {
        rxName: input.rxName,
        daysOfSupply: input.daysOfSupply,
        totalAvailableQty: input.totalAvailableQty,
        remainingQty: nextRemainingQty,
        notes: input.notes ?? null
      }
    });

    for (const schedule of input.schedules) {
      await tx.medicineSchedule.upsert({
        where: {
          medicineId_slot: {
            medicineId,
            slot: schedule.slot
          }
        },
        create: {
          medicineId,
          slot: schedule.slot,
          enabled: schedule.enabled,
          doseTime: schedule.doseTime ?? defaults[schedule.slot],
          qty: schedule.qty ?? 0
        },
        update: {
          enabled: schedule.enabled,
          doseTime: schedule.doseTime ?? defaults[schedule.slot],
          qty: schedule.qty ?? 0
        }
      });
    }

    await clearFutureReminderEventsForMedicine(userId, medicineId, tx);

    return tx.medicine.findUniqueOrThrow({
      where: { id: medicineId },
      include: {
        schedules: true
      }
    });
  });

  return mapMedicine(result);
}

export async function archiveMedicine(userId: number, medicineId: number): Promise<{ success: boolean; id: number }> {
  const medicine = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      userId
    }
  });

  if (!medicine) {
    throw errorFactory.notFound();
  }

  await prisma.$transaction(async (tx) => {
    await tx.medicine.update({
      where: { id: medicineId },
      data: {
        isActive: false
      }
    });

    await clearFutureReminderEventsForMedicine(userId, medicineId, tx);
  });

  return {
    success: true,
    id: medicineId
  };
}

export async function logMedicineIntake(
  userId: number,
  medicineId: number,
  input: IntakeInput
): Promise<{
  medicineId: number;
  remainingQty: number;
  reminderEventId: number;
  reminderStatus: string;
  intakeLogId: number;
}> {
  return prisma.$transaction(async (tx) => {
    const medicine = await tx.medicine.findFirst({
      where: {
        id: medicineId,
        userId
      }
    });

    if (!medicine) {
      throw errorFactory.notFound();
    }

    if (input.qtyTaken > medicine.remainingQty) {
      throw errorFactory.conflict('qtyTaken exceeds remaining medicine quantity.');
    }

    const reminder = await tx.reminderEvent.findFirst({
      where: {
        id: input.reminderEventId,
        userId,
        medicineId
      }
    });

    if (!reminder) {
      throw errorFactory.notFound('Reminder event was not found for this medicine.');
    }

    if (reminder.status !== REMINDER_STATUS.PENDING && reminder.status !== REMINDER_STATUS.SHOWN) {
      throw errorFactory.conflict('Reminder is already finalized.');
    }

    const intakeLog = await tx.medicineIntakeLog.create({
      data: {
        reminderEventId: reminder.id,
        medicineId,
        qtyTaken: input.qtyTaken,
        takenAt: new Date(input.takenAt)
      }
    });

    const updatedMedicine = await tx.medicine.update({
      where: { id: medicineId },
      data: {
        remainingQty: medicine.remainingQty - input.qtyTaken
      }
    });

    const updatedReminder = await tx.reminderEvent.update({
      where: { id: reminder.id },
      data: {
        status: REMINDER_STATUS.TAKEN
      }
    });

    return {
      medicineId,
      remainingQty: updatedMedicine.remainingQty,
      reminderEventId: updatedReminder.id,
      reminderStatus: updatedReminder.status,
      intakeLogId: intakeLog.id
    };
  });
}
