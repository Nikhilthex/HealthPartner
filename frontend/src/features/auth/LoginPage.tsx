import { FormEvent, useState } from 'react';
import type { LoginPayload } from './types';
import { LoginErrors, validateLoginPayload } from './validation';

type LoginPageProps = {
  errorMessage: string;
  isSubmitting: boolean;
  onLogin: (payload: LoginPayload) => Promise<void>;
};

export function LoginPage({ errorMessage, isSubmitting, onLogin }: LoginPageProps) {
  const [values, setValues] = useState<LoginPayload>({
    username: 'demo',
    password: 'secret123'
  });
  const [errors, setErrors] = useState<LoginErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginPayload(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onLogin({
      username: values.username.trim(),
      password: values.password
    });
  }

  return (
    <main className="auth-layout">
      <section className="auth-intro" aria-labelledby="login-title">
        <p className="eyebrow">Health Partner</p>
        <h1 id="login-title">Sign in to manage your health workspace</h1>
        <p>Use your account to access medicine reminders, alert preferences, and report analysis.</p>
      </section>

      <section className="auth-panel" aria-label="Login form">
        <h2>Login</h2>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={values.username}
              aria-invalid={errors.username ? 'true' : undefined}
              aria-describedby={errors.username ? 'username-error' : undefined}
              onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))}
            />
            {errors.username && (
              <span className="field-error" id="username-error">
                {errors.username}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            />
            {errors.password && (
              <span className="field-error" id="password-error">
                {errors.password}
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="status status-error" role="alert">
              {errorMessage}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}
