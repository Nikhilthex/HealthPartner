import { useEffect, useState } from "react";

import { medicinesApi, remindersApi } from "../lib/api";
import type { Reminder } from "../lib/api";

type ReminderPopupProps = {
  onRefreshMedicines: () => Promise<void> | void;
};

export const ReminderPopup = ({ onRefreshMedicines }: ReminderPopupProps) => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    let active = true;

    const loadReminders = async () => {
      try {
        const due = await remindersApi.due(new Date().toISOString(), 30);
        if (!active || due.length === 0) {
          return;
        }

        const next = due[0];
        setReminder((current) => (current?.id === next.id ? current : next));
        if (!reminder || reminder.id !== next.id) {
          await remindersApi.acknowledge(next.id);
        }
      } catch {
        if (active) {
          setActionError(null);
        }
      }
    };

    void loadReminders();
    const intervalId = window.setInterval(() => {
      void loadReminders();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [reminder]);

  if (!reminder) {
    return null;
  }

  const takeDose = async () => {
    setTaking(true);
    setActionError(null);

    try {
      await medicinesApi.logIntake(reminder.medicineId, {
        reminderEventId: reminder.id,
        qtyTaken: reminder.qty,
        takenAt: new Date().toISOString()
      });
      setReminder(null);
      await onRefreshMedicines();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to mark this reminder as taken.");
    } finally {
      setTaking(false);
    }
  };

  const dismissReminder = async () => {
    setDismissing(true);
    setActionError(null);

    try {
      await remindersApi.dismiss(reminder.id);
      setReminder(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to dismiss this reminder.");
    } finally {
      setDismissing(false);
    }
  };

  return (
    <aside className="reminder-popup" aria-live="polite">
      <p className="eyebrow">Reminder Popup</p>
      <h3>{reminder.rxName}</h3>
      <p>{reminder.displayMessage}</p>
      <p className="muted">
        {reminder.alertType === "pre" ? "Pre-alert" : "On-time alert"} for {reminder.slot} at {reminder.doseTime}
      </p>
      {actionError ? <div className="form-error">{actionError}</div> : null}
      <div className="action-row">
        <button className="button" type="button" onClick={() => void takeDose()} disabled={taking}>
          {taking ? "Saving..." : `Mark ${reminder.qty} Taken`}
        </button>
        <button className="button button--ghost" type="button" onClick={() => void dismissReminder()} disabled={dismissing}>
          {dismissing ? "Dismissing..." : "Dismiss"}
        </button>
      </div>
    </aside>
  );
};
