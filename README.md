# Health Partner

Health Partner is a modular monolith web application for basic medication management and AI-assisted health report analysis. The first release is designed around a simple username/password login, medicine reminders with customizable alerts, and report upload with AI-generated summaries and risk suggestions in plain language.

This repository currently contains the delivery blueprint and engineering guardrails for implementation.

## Planned Features

### 1. Basic Login
- Username/password authentication
- Secure password hashing
- Session-based or token-backed authenticated access to the main app

### 2. Medicine Reminder
- Add a medicine with:
  - Rx name
  - Days of supply
  - Total available quantity
  - Morning, noon, and evening schedule
  - Quantity per scheduled dose
- Default reminder windows:
  - 15 minutes before the dose time
  - At the exact dose time
- User-customizable alert timing and preferred schedule times

### 3. Report Analyze
- Upload a health report file
- Send extracted report data to an AI provider using a backend API key
- Return:
  - Report summary in layman terms
  - Potential risks to discuss with a clinician
  - Vitamin suggestions
  - Medicine suggestions as informational guidance

## Main App Tabs
- `Add Medicine`
- `Customize Alerts`
- `Analyze Reports`

## Recommended Tech Stack
- Backend: Node.js + Express
- Frontend: React + Vite
- Database: SQLite
- Validation: Zod
- Auth: bcrypt/argon2 + secure cookie session or JWT
- File upload: Multer
- Testing:
  - Backend: Vitest/Jest + Supertest
  - Frontend: Vitest + React Testing Library

TypeScript is strongly recommended for both backend and frontend to keep the modular monolith maintainable as the app grows.

## Architecture Approach

The app should be built as a **modular monolith**:
- One repository
- One backend deployable
- One frontend deployable served by the same backend in production
- Clear internal modules for `auth`, `medicines`, `alerts`, `reports`, `ai-analysis`, and `shared`

This gives us simple deployment with clean internal boundaries.

## Proposed Project Structure

```text
health-partner/
  README.md
  TECH_SPEC.md
  AGENTS.md
  frontend/
    src/
      features/
        medicines/
        alerts/
        reports/
      shared/
  server/
    src/
      app.ts
      config/
      db/
      modules/
        auth/
        medicines/
        alerts/
        reports/
        ai-analysis/
      shared/
    tests/
  client/
    src/
      app/
      components/
      features/
        auth/
        medicines/
        alerts/
        reports/
      services/
      test/
```

## Core User Flow

1. User logs in with username and password.
2. User adds medicines and chooses dose schedule and stock quantity.
3. User customizes default times for morning, noon, and evening reminders.
4. Backend creates reminder events for both pre-alert and on-time alert windows.
5. User uploads a medical report and clicks `Analyze`.
6. Backend extracts report text, sends it to the AI service, validates the response, and returns a patient-friendly summary.

## Planned Environment Variables

```bash
PORT=4000
NODE_ENV=development
DATABASE_URL=file:./data/healthpartner.db
SESSION_SECRET=change-me
AI_API_KEY=change-me
AI_MODEL=change-me
UPLOAD_DIR=./uploads
```

## Delivery Priorities

### Phase 1
- Authentication
- Medicine CRUD
- Reminder scheduling
- Alert customization UI
- Report upload and AI response persistence

### Phase 2
- Refill alerts based on remaining quantity
- Historical reminder completion tracking
- Better report extraction/OCR
- Export/share report summaries

## Testing Expectations

Every backend API and every major UI flow must ship with automated tests. Details are documented in [AGENTS.md](AGENTS.md) and [TECH_SPEC.md](TECH_SPEC.md).

## Code Compliance Checklist

All implementation work should pass the following compliance checks before it is considered complete:

- Module ownership is clear and the change lives in the correct backend or frontend domain.
- Route handlers/controllers stay thin and delegate business logic to services.
- All server inputs are validated with explicit schemas before use.
- Shared utilities are reused from `shared` instead of duplicated across modules.
- No secrets, tokens, or provider keys are hardcoded in source files or exposed to the client.
- AI responses are schema-validated and rendered with a user-facing disclaimer.
- Medicine quantity, reminder generation, and alert timing logic are tested for edge cases and data integrity.
- UI flows include loading, empty, error, validation, and success states.
- API, service, and UI tests are added or updated for every behavior change.
- Documentation is updated whenever contracts, workflows, or environment variables change.

## Security Guardrails

- Hash passwords with a strong one-way algorithm such as `bcrypt` or `argon2`.
- Protect authenticated routes with server-side auth checks and never trust client auth state by itself.
- Validate and sanitize all request payloads, uploaded files, and AI-provider responses.
- Keep `AI_API_KEY`, session secrets, and other credentials only in environment variables or secret stores.
- Use secure cookies if session auth is chosen, including `HttpOnly`, `Secure`, and appropriate `SameSite` settings.
- If JWTs are used, enforce strong signing secrets, expiration, and server-side verification on protected routes.
- Apply authorization checks so users can only access their own medicines, reminders, alerts, and reports.
- Make reminder regeneration idempotent to avoid duplicate future notifications.
- Store medicine stock changes with an audit trail so quantity updates remain traceable.
- Limit report data sent to the AI provider to the minimum fields required for analysis.
- Reject unsupported upload types and enforce file size limits for report uploads.
- Avoid logging passwords, raw secrets, full tokens, or unnecessary personally identifiable data.
- Return safe error messages to clients and keep detailed diagnostics in server logs only.

## Important Product Guardrail

AI-based report analysis must be framed as informational support only. The app must not present itself as a doctor, diagnosis engine, or prescription authority. Output should always include a short clinical-disclaimer message.
