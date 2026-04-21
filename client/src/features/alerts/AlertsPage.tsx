import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError, alertSettingsApi } from "../../lib/api";

const settingsSchema = z.object({
  morningTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm."),
  noonTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm."),
  eveningTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm."),
  preAlertMinutes: z.coerce.number().int().min(0).max(120),
  onTimeEnabled: z.boolean(),
  timezone: z.string().trim().min(1, "Timezone is required.")
});

type AlertFormValues = z.output<typeof settingsSchema>;

const fallbackValues: AlertFormValues = {
  morningTime: "08:00",
  noonTime: "13:00",
  eveningTime: "20:00",
  preAlertMinutes: 15,
  onTimeEnabled: true,
  timezone: "Asia/Kolkata"
};

export const AlertsPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<z.input<typeof settingsSchema>, unknown, AlertFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: fallbackValues
  });

  const loadSettings = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await alertSettingsApi.get();
      reset(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load alert settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const result = await alertSettingsApi.update(values);
      reset(result.settings);
      setSubmitMessage(
        result.futureRemindersRebuilt
          ? "Alert settings saved. Future reminders were rebuilt."
          : "Alert settings saved."
      );
    } catch (error) {
      if (error instanceof ApiError && error.details?.length) {
        setSubmitError(error.details.map((detail) => detail.message).join(" "));
      } else {
        setSubmitError(error instanceof Error ? error.message : "Unable to save alert settings.");
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <section className="panel stack-gap">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Customize Alerts</p>
          <h2>Set your default reminder windows</h2>
        </div>
      </div>

      {loading ? <p className="muted">Loading alert settings...</p> : null}
      {loadError ? (
        <div className="stack-gap">
          <div className="form-error">{loadError}</div>
          <button className="button button--ghost" type="button" onClick={() => void loadSettings()}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !loadError ? (
        <form className="stack-gap" onSubmit={onSubmit} noValidate>
          <div className="field-row">
            <label className="field">
              <span>Morning time</span>
              <input {...register("morningTime")} type="time" />
              {errors.morningTime ? <small className="field__error">{errors.morningTime.message}</small> : null}
            </label>

            <label className="field">
              <span>Noon time</span>
              <input {...register("noonTime")} type="time" />
              {errors.noonTime ? <small className="field__error">{errors.noonTime.message}</small> : null}
            </label>

            <label className="field">
              <span>Evening time</span>
              <input {...register("eveningTime")} type="time" />
              {errors.eveningTime ? <small className="field__error">{errors.eveningTime.message}</small> : null}
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Pre-alert minutes</span>
              <input {...register("preAlertMinutes")} type="number" min="0" max="120" />
              {errors.preAlertMinutes ? (
                <small className="field__error">{errors.preAlertMinutes.message}</small>
              ) : null}
            </label>

            <label className="field">
              <span>Timezone</span>
              <input {...register("timezone")} placeholder="Asia/Kolkata" />
              {errors.timezone ? <small className="field__error">{errors.timezone.message}</small> : null}
            </label>
          </div>

          <label className="checkbox-row checkbox-row--panel">
            <input type="checkbox" {...register("onTimeEnabled")} />
            <span>Also trigger an on-time reminder at the exact dose time.</span>
          </label>

          {submitError ? <div className="form-error">{submitError}</div> : null}
          {submitMessage ? <div className="form-success">{submitMessage}</div> : null}

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Alert Settings"}
          </button>
        </form>
      ) : null}
    </section>
  );
};
