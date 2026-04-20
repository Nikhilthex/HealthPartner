import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ApiError } from '../../shared/api/apiClient';
import { StatusMessage } from '../../shared/ui/StatusMessage';
import { getAlertSettings, updateAlertSettings } from './api';
import type { AlertSettings } from './types';
import { validateAlertSettings } from './validation';

const defaults: AlertSettings = {
  morningTime: '08:00',
  noonTime: '13:00',
  eveningTime: '20:00',
  preAlertMinutes: 15,
  onTimeEnabled: true,
  timezone: 'Asia/Kolkata'
};

export function AlertSettingsModule() {
  const [settings, setSettings] = useState(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setSettings(await getAlertSettings());
        setStatus('ready');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof ApiError ? error.message : 'Unable to load alert settings.');
      }
    }

    void load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateAlertSettings(settings);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      const response = await updateAlertSettings(settings);
      setSettings(response.data);
      setMessage(response.meta?.futureRemindersRebuilt ? 'Alert settings saved and future reminders rebuilt.' : 'Alert settings saved.');
      setStatus('ready');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Unable to save alert settings.');
    } finally {
      setIsSaving(false);
    }
  }

  function update<K extends keyof AlertSettings>(key: K, value: AlertSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="feature-section" aria-labelledby="alerts-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Customize Alerts</p>
          <h2 id="alerts-title">Set default reminder timing</h2>
        </div>
      </div>

      {status === 'loading' && <StatusMessage>Loading alert settings...</StatusMessage>}
      {status === 'error' && <StatusMessage tone="error">{message || 'Unable to load alert settings.'}</StatusMessage>}
      {message && status !== 'error' && <StatusMessage tone={message.includes('Unable') ? 'error' : 'success'}>{message}</StatusMessage>}

      <form className="panel form-grid" onSubmit={handleSubmit} noValidate>
        <TimeField id="morningTime" label="Morning time" value={settings.morningTime} error={errors.morningTime} onChange={(value) => update('morningTime', value)} />
        <TimeField id="noonTime" label="Noon time" value={settings.noonTime} error={errors.noonTime} onChange={(value) => update('noonTime', value)} />
        <TimeField id="eveningTime" label="Evening time" value={settings.eveningTime} error={errors.eveningTime} onChange={(value) => update('eveningTime', value)} />

        <div className="field">
          <label htmlFor="preAlertMinutes">Pre-alert minutes</label>
          <input
            id="preAlertMinutes"
            type="number"
            min="0"
            max="240"
            value={settings.preAlertMinutes}
            onChange={(event) => update('preAlertMinutes', Number(event.target.value))}
          />
          {errors.preAlertMinutes && <span className="field-error">{errors.preAlertMinutes}</span>}
        </div>

        <div className="field">
          <label htmlFor="timezone">Timezone</label>
          <input id="timezone" value={settings.timezone} onChange={(event) => update('timezone', event.target.value)} />
          {errors.timezone && <span className="field-error">{errors.timezone}</span>}
        </div>

        <label className="toggle-row field-wide">
          <input
            type="checkbox"
            checked={settings.onTimeEnabled}
            onChange={(event) => update('onTimeEnabled', event.target.checked)}
          />
          On-time reminders enabled
        </label>

        <button className="primary-button field-wide" type="submit" disabled={isSaving || status === 'loading'}>
          {isSaving ? 'Saving alerts...' : 'Save alert settings'}
        </button>
      </form>
    </section>
  );
}

function TimeField({
  id,
  label,
  value,
  error,
  onChange
}: {
  id: keyof AlertSettings;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="time" value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
