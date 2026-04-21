import type { FormEvent } from 'react';
import { useState } from 'react';
import type { MedicinePayload, MedicineSchedule } from './types';
import { defaultSchedules, hasErrors, labelForSlot, type MedicineFormErrors, validateMedicine } from './validation';

type MedicineFormProps = {
  isSaving: boolean;
  onSubmit: (payload: MedicinePayload) => Promise<void>;
};

export function MedicineForm({ isSaving, onSubmit }: MedicineFormProps) {
  const [rxName, setRxName] = useState('');
  const [daysOfSupply, setDaysOfSupply] = useState('30');
  const [totalAvailableQty, setTotalAvailableQty] = useState('60');
  const [notes, setNotes] = useState('');
  const [schedules, setSchedules] = useState<MedicineSchedule[]>(defaultSchedules);
  const [errors, setErrors] = useState<MedicineFormErrors>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: MedicinePayload = {
      rxName,
      daysOfSupply: Number(daysOfSupply),
      totalAvailableQty: Number(totalAvailableQty),
      notes: notes.trim() || undefined,
      schedules
    };
    const nextErrors = validateMedicine(payload);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    await onSubmit(payload);
    setRxName('');
    setDaysOfSupply('30');
    setTotalAvailableQty('60');
    setNotes('');
    setSchedules(defaultSchedules);
  }

  function updateSchedule(slot: MedicineSchedule['slot'], changes: Partial<MedicineSchedule>) {
    setSchedules((current) =>
      current.map((schedule) => (schedule.slot === slot ? { ...schedule, ...changes } : schedule))
    );
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit} noValidate>
      <div className="field field-wide">
        <label htmlFor="rxName">Rx name</label>
        <input id="rxName" value={rxName} onChange={(event) => setRxName(event.target.value)} />
        {errors.rxName && <span className="field-error">{errors.rxName}</span>}
      </div>

      <div className="field">
        <label htmlFor="daysOfSupply">Days of supply</label>
        <input
          id="daysOfSupply"
          type="number"
          min="1"
          value={daysOfSupply}
          onChange={(event) => setDaysOfSupply(event.target.value)}
        />
        {errors.daysOfSupply && <span className="field-error">{errors.daysOfSupply}</span>}
      </div>

      <div className="field">
        <label htmlFor="totalAvailableQty">Total available quantity</label>
        <input
          id="totalAvailableQty"
          type="number"
          min="1"
          step="0.5"
          value={totalAvailableQty}
          onChange={(event) => setTotalAvailableQty(event.target.value)}
        />
        {errors.totalAvailableQty && <span className="field-error">{errors.totalAvailableQty}</span>}
      </div>

      <div className="field field-wide">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
      </div>

      <fieldset className="schedule-editor field-wide">
        <legend>Daily schedule</legend>
        {errors.schedules && <span className="field-error">{errors.schedules}</span>}
        {schedules.map((schedule) => (
          <div className="schedule-row" key={schedule.slot}>
            <label className="check-label">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(event) => updateSchedule(schedule.slot, { enabled: event.target.checked })}
              />
              {labelForSlot(schedule.slot)}
            </label>

            <div className="field">
              <label htmlFor={`${schedule.slot}Time`}>Time</label>
              <input
                id={`${schedule.slot}Time`}
                type="time"
                value={schedule.doseTime}
                disabled={!schedule.enabled}
                onChange={(event) => updateSchedule(schedule.slot, { doseTime: event.target.value })}
              />
              {errors[`${schedule.slot}Time`] && (
                <span className="field-error">{errors[`${schedule.slot}Time`]}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor={`${schedule.slot}Qty`}>Qty</label>
              <input
                id={`${schedule.slot}Qty`}
                type="number"
                min="0"
                step="0.5"
                value={schedule.qty}
                disabled={!schedule.enabled}
                onChange={(event) => updateSchedule(schedule.slot, { qty: Number(event.target.value) })}
              />
              {errors[`${schedule.slot}Qty`] && <span className="field-error">{errors[`${schedule.slot}Qty`]}</span>}
            </div>
          </div>
        ))}
      </fieldset>

      <button className="primary-button field-wide" type="submit" disabled={isSaving}>
        {isSaving ? 'Saving medicine...' : 'Save medicine'}
      </button>
    </form>
  );
}
