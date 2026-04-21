import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAuth } from "../../state/auth-context";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required.")
});

type LoginValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login, loginPending, errorMessage } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "demo",
      password: "demo123"
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    await login(values);
  });

  return (
    <div className="auth-layout">
      <section className="auth-layout__hero">
        <p className="eyebrow">Health Partner</p>
        <h1>Simple medication support with a safer starting point.</h1>
        <p className="muted">
          Sign in to access your protected workspace for medicines, reminders, and report analysis.
        </p>
      </section>

      <section className="auth-card">
        <div className="auth-card__header">
          <h2>Login</h2>
          <p className="muted">Use your Health Partner username and password to continue.</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <label className="field">
            <span>Username</span>
            <input {...register("username")} autoComplete="username" placeholder="Enter your username" />
            {errors.username ? <small className="field__error">{errors.username.message}</small> : null}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            {errors.password ? <small className="field__error">{errors.password.message}</small> : null}
          </label>

          {errorMessage ? (
            <div className="form-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <button className="button" type="submit" disabled={loginPending}>
            {loginPending ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
};
