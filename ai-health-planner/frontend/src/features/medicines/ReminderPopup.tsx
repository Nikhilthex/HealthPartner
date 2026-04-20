import { useEffect, useState } from 'react';
import { ApiError } from '../../shared/api/apiClient';
import { acknowledgeReminder, dismissReminder, listDueReminders } from './api';
import type { DueReminder } from './types';

export function ReminderPopup() {
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [error, setError] = useState('');
  const current = reminders[0];

  useEffect(() => {
    let isMounted = true;

    async function poll() {
      try {
        const due = await listDueReminders();
        if (isMounted) {
          setReminders(due);
          setError('');
        }
      } catch (pollError) {
        if (isMounted) {
          setError(pollError instanceof ApiError ? pollError.message : 'Reminder polling failed.');
        }
      }
    }

    void poll();
    const timer = window.setInterval(poll, 60_000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  async function closeWith(action: 'acknowledge' | 'dismiss') {
    if (!current) {
      return;
    }

    try {
      if (action === 'acknowledge') {
        await acknowledgeReminder(current.id);
      } else {
        await dismissReminder(current.id);
      }
      setReminders((items) => items.slice(1));
      setError('');
    } catch (actionError) {
      setError(actionError instanceof ApiError ? actionError.message : 'Unable to update reminder.');
    }
  }

  if (!current && !error) {
    return null;
  }

  return (
    <aside className="reminder-popup" role="dialog" aria-live="polite" aria-labelledby="reminder-title">
      {current ? (
        <>
          <p className="eyebrow">{current.alertType === 'pre' ? 'Upcoming dose' : 'Dose time'}</p>
          <h2 id="reminder-title">{current.rxName}</h2>
          <p>{current.displayMessage}</p>
          <p className="reminder-detail">
            {current.slot} · {current.qty} at {current.doseTime}
          </p>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => void closeWith('acknowledge')}>
              Acknowledge
            </button>
            <button type="button" className="ghost-button" onClick={() => void closeWith('dismiss')}>
              Dismiss
            </button>
          </div>
        </>
      ) : null}
      {error && <p className="field-error">{error}</p>}
    </aside>
  );
}
