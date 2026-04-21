import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError, medicinesApi } from "../../lib/api";
import type { Medicine } from "../../lib/api";

const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm.");

const scheduleSchema = z.object({
  enabled: z.boolean(),
  doseTime: hhmmSchema,
  qty: z.coerce.number().min(0, "Must be 0 or more.")
});

const medicineFormSchema = z
  .object({
    rxName: z.string().trim().min(1, "Medicine name is required."),
    daysOfSupply: z.coerce.number().int().positive("Days of supply must be greater than 0."),
    totalAvailableQty: z.coerce.number().positive("Total quantity must be greater than 0."),
    remainingQty: z.coerce.number().min(0, "Remaining quantity cannot be negative."),
    notes: z.string().max(1000, "Notes must be 1000 characters or less.").optional(),
    morning: scheduleSchema,
    noon: scheduleSchema,
    evening: scheduleSchema
  })
  .superRefine((value, ctx) => {
    const enabledCount = [value.morning, value.noon, value.evening].filter((item) => item.enabled).length;
    if (enabledCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["morning", "enabled"],
        message: "Enable at least one schedule."
      });
    }
  });

type MedicineFormValues = z.output<typeof medicineFormSchema>;

const defaultValues: MedicineFormValues = {
  rxName: "",
  daysOfSupply: 30,
  totalAvailableQty: 60,
  remainingQty: 60,
  notes: "",
  morning: { enabled: true, doseTime: "08:00", qty: 1 },
  noon: { enabled: false, doseTime: "13:00", qty: 0 },
  evening: { enabled: true, doseTime: "20:00", qty: 1 }
};

function toFormValues(medicine: Medicine): MedicineFormValues {
  const findSlot = (slot: "morning" | "noon" | "evening") =>
    medicine.schedules.find((item) => item.slot === slot) ?? {
      slot,
      enabled: false,
      doseTime: slot === "morning" ? "08:00" : slot === "noon" ? "13:00" : "20:00",
      qty: 0
    };

  const morning = findSlot("morning");
  const noon = findSlot("noon");
  const evening = findSlot("evening");

  return {
    rxName: medicine.rxName,
    daysOfSupply: medicine.daysOfSupply,
    totalAvailableQty: medicine.totalAvailableQty,
    remainingQty: medicine.remainingQty,
    notes: medicine.notes ?? "",
    morning: { enabled: morning.enabled, doseTime: morning.doseTime, qty: morning.qty },
    noon: { enabled: noon.enabled, doseTime: noon.doseTime, qty: noon.qty },
    evening: { enabled: evening.enabled, doseTime: evening.doseTime, qty: evening.qty }
  };
}

function toPayload(values: MedicineFormValues, includeRemainingQty: boolean) {
  return {
    rxName: values.rxName.trim(),
    daysOfSupply: values.daysOfSupply,
    totalAvailableQty: values.totalAvailableQty,
    ...(includeRemainingQty ? { remainingQty: values.remainingQty } : {}),
    ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
    schedules: [
      { slot: "morning" as const, ...values.morning },
      { slot: "noon" as const, ...values.noon },
      { slot: "evening" as const, ...values.evening }
    ]
  };
}

export const MedicinesPage = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState<number | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<z.input<typeof medicineFormSchema>, unknown, MedicineFormValues>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues
  });

  const selectedMedicine = medicines.find((item) => item.id === selectedMedicineId) ?? null;

  const loadMedicines = async (nextIncludeInactive = includeInactive) => {
    setLoading(true);
    setLoadError(null);

    try {
      const result = await medicinesApi.list(nextIncludeInactive);
      setMedicines(result);
      if (!result.some((item) => item.id === selectedMedicineId)) {
        setSelectedMedicineId(null);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMedicines(includeInactive);
  }, [includeInactive]);

  useEffect(() => {
    if (selectedMedicine) {
      reset(toFormValues(selectedMedicine));
      setSubmitMessage(null);
      setSubmitError(null);
    } else {
      reset(defaultValues);
    }
  }, [selectedMedicine, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      if (selectedMedicine) {
        const updated = await medicinesApi.update(selectedMedicine.id, toPayload(values, true));
        setSubmitMessage(`Updated ${updated.rxName}.`);
      } else {
        const created = await medicinesApi.create(toPayload(values, false));
        setSubmitMessage(`Added ${created.rxName}.`);
        setSelectedMedicineId(created.id);
      }

      await loadMedicines(includeInactive);
    } catch (error) {
      if (error instanceof ApiError && error.details?.length) {
        setSubmitError(error.details.map((detail) => detail.message).join(" "));
      } else {
        setSubmitError(error instanceof Error ? error.message : "Unable to save medicine.");
      }
    } finally {
      setSubmitting(false);
    }
  });

  const startCreate = () => {
    setSelectedMedicineId(null);
    reset(defaultValues);
    setSubmitMessage(null);
    setSubmitError(null);
  };

  const archiveMedicine = async (medicineId: number) => {
    setArchivingId(medicineId);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      await medicinesApi.archive(medicineId);
      if (selectedMedicineId === medicineId) {
        setSelectedMedicineId(null);
        reset(defaultValues);
      }
      setSubmitMessage("Medicine archived.");
      await loadMedicines(includeInactive);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to archive medicine.");
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <section className="feature-grid">
      <div className="panel stack-gap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Add Medicine</p>
            <h2>Track schedules and quantity</h2>
          </div>
          <button className="button button--ghost" type="button" onClick={startCreate}>
            Add New
          </button>
        </div>

        <form className="stack-gap" onSubmit={onSubmit} noValidate>
          <label className="field">
            <span>Medicine name</span>
            <input {...register("rxName")} placeholder="Metformin" />
            {errors.rxName ? <small className="field__error">{errors.rxName.message}</small> : null}
          </label>

          <div className="field-row">
            <label className="field">
              <span>Days of supply</span>
              <input {...register("daysOfSupply")} type="number" min="1" />
              {errors.daysOfSupply ? <small className="field__error">{errors.daysOfSupply.message}</small> : null}
            </label>

            <label className="field">
              <span>Total quantity</span>
              <input {...register("totalAvailableQty")} type="number" min="0" step="0.5" />
              {errors.totalAvailableQty ? (
                <small className="field__error">{errors.totalAvailableQty.message}</small>
              ) : null}
            </label>

            <label className="field">
              <span>Remaining quantity</span>
              <input {...register("remainingQty")} type="number" min="0" step="0.5" />
              {errors.remainingQty ? <small className="field__error">{errors.remainingQty.message}</small> : null}
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea {...register("notes")} rows={3} placeholder="Optional notes about the medicine" />
            {errors.notes ? <small className="field__error">{errors.notes.message}</small> : null}
          </label>

          <div className="schedule-card-grid">
            {(["morning", "noon", "evening"] as const).map((slot) => {
              const slotState = watch(slot);
              return (
                <div className="schedule-card" key={slot}>
                  <label className="checkbox-row">
                    <input type="checkbox" {...register(`${slot}.enabled`)} />
                    <span>{slot[0].toUpperCase() + slot.slice(1)} schedule</span>
                  </label>

                  <label className="field">
                    <span>Time</span>
                    <input {...register(`${slot}.doseTime`)} type="time" disabled={!slotState.enabled} />
                    {errors[slot]?.doseTime ? (
                      <small className="field__error">{errors[slot]?.doseTime?.message}</small>
                    ) : null}
                  </label>

                  <label className="field">
                    <span>Quantity per dose</span>
                    <input {...register(`${slot}.qty`)} type="number" min="0" step="0.5" disabled={!slotState.enabled} />
                    {errors[slot]?.qty ? <small className="field__error">{errors[slot]?.qty?.message}</small> : null}
                  </label>
                </div>
              );
            })}
          </div>

          {errors.morning?.enabled ? <div className="form-error">{errors.morning.enabled.message}</div> : null}
          {submitError ? <div className="form-error">{submitError}</div> : null}
          {submitMessage ? <div className="form-success">{submitMessage}</div> : null}

          <div className="action-row">
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : selectedMedicine ? "Save Changes" : "Create Medicine"}
            </button>
            {selectedMedicine ? (
              <button
                className="button button--ghost"
                type="button"
                onClick={() => void archiveMedicine(selectedMedicine.id)}
                disabled={archivingId === selectedMedicine.id}
              >
                {archivingId === selectedMedicine.id ? "Archiving..." : "Archive"}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="panel stack-gap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Medicine List</p>
            <h2>Your saved medicines</h2>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            <span>Show archived</span>
          </label>
        </div>

        {loading ? <p className="muted">Loading medicines...</p> : null}
        {loadError ? (
          <div className="stack-gap">
            <div className="form-error">{loadError}</div>
            <button className="button button--ghost" type="button" onClick={() => void loadMedicines()}>
              Retry
            </button>
          </div>
        ) : null}
        {!loading && !loadError && medicines.length === 0 ? (
          <div className="empty-state">
            <h3>No medicines yet</h3>
            <p className="muted">Create your first medicine schedule to start generating reminders.</p>
          </div>
        ) : null}
        {!loading && !loadError && medicines.length > 0 ? (
          <div className="list-stack">
            {medicines.map((medicine) => (
              <button
                key={medicine.id}
                className={medicine.id === selectedMedicineId ? "list-card list-card--active" : "list-card"}
                type="button"
                onClick={() => setSelectedMedicineId(medicine.id)}
              >
                <div className="list-card__row">
                  <strong>{medicine.rxName}</strong>
                  <span className="pill">{medicine.remainingQty} left</span>
                </div>
                <p className="muted">
                  {medicine.dailyQtyPlanned} planned per day
                  {medicine.estimatedDepletionDate ? ` • Estimated depletion ${medicine.estimatedDepletionDate}` : ""}
                </p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
