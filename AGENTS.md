# AGENTS.md

## Mission

Build Health Partner as a modular monolith with strong internal boundaries, predictable APIs, and reliable automated tests for both backend and frontend work.

## Product Scope

The current scope includes:
- Basic username/password login
- Medicine reminder management
- Alert customization
- AI-assisted report analysis

The primary UI must expose exactly three authenticated tabs:
- `Add Medicine`
- `Customize Alerts`
- `Analyze Reports`

## Architecture Guardrails

- Keep the app as a modular monolith. Do not split into microservices.
- Backend modules must own their own routes, service logic, validation, and persistence helpers.
- Controllers/routes must stay thin. Business logic belongs in services.
- Shared helpers belong in `shared`, not copied across modules.
- Frontend feature code should be organized by domain, not by generic file type only.
- New modules must document their inputs, outputs, and test coverage.

## Backend Guardrails

- Every request payload must be validated on the server.
- Never trust frontend values for authentication, reminder timing, or quantity math without validation.
- Passwords must always be hashed.
- Never expose the AI API key to the client.
- Medicine quantity updates must be transactional and traceable through logs/history.
- Reminder generation must be idempotent. Regenerating future reminders must not create duplicates.
- Store user-facing schedule times separately from normalized timestamps when needed for auditability.

## Frontend Guardrails

- Every feature must have explicit loading, empty, error, and success states.
- Forms must show field-level validation messages.
- Reminder popups must be clear, dismissible, and accessible.
- Do not bury core actions behind unclear navigation. The three main tabs should remain obvious.
- Keep feature state local unless it is truly shared.
- Reuse shared UI primitives, but keep domain workflows inside feature folders.

## AI Analysis Guardrails

- AI output is informational support only, never a diagnosis.
- Do not present medicine suggestions as prescriptions.
- All AI responses must be schema-validated before being stored or shown.
- If the AI response is malformed, return a safe failure state and log the issue.
- Always show a disclaimer with report analysis results.
- Avoid sending unnecessary personally identifiable data to the AI provider.

## Code Compliance Checks

Every contribution must pass these compliance checks before it is merged or treated as complete:

- The owning module is identified before implementation starts.
- Validation schemas are added or updated before route and service wiring.
- Business logic remains in services, not controllers, route handlers, or React presentation components.
- Persistence access stays inside the owning backend module or approved shared infrastructure helpers.
- Shared logic is added to `shared` only when it is truly cross-module and documented.
- Contracts for new or changed modules include inputs, outputs, and test coverage notes.
- User-facing flows handle loading, empty, validation, error, and success states explicitly.
- Backend APIs, backend services, and UI flows have the required automated tests from this document.
- Documentation is updated when behavior, contracts, environment variables, or setup steps change.

## Security Guardrails

- Enforce authentication on all protected routes with server-side checks.
- Enforce authorization so each user can access only their own medicines, alerts, reminders, and uploaded reports.
- Hash passwords with `bcrypt`, `argon2`, or an equivalent modern password hashing function.
- Keep secrets in environment variables or a secret manager, never in client code or committed config.
- Use secure session or token settings, including expiration and transport protections.
- Validate, sanitize, and constrain all request bodies, query params, route params, and file uploads.
- Reject unsupported file types and oversized uploads before processing report content.
- Never trust client-provided schedule values, quantity math, reminder status, or ownership identifiers.
- Make inventory mutations transactional, auditable, and resilient to concurrent updates.
- Avoid logging sensitive personal data, secrets, access tokens, or raw AI-provider payloads unless redacted.
- Return safe client errors that do not leak stack traces, secret values, or internal infrastructure details.
- Minimize data sent to third-party AI providers and strip unnecessary personally identifiable information where possible.
- Schema-validate every AI response before persistence or rendering, and fail closed on malformed output.
- Dependency changes should be reviewed for known vulnerabilities and unnecessary package sprawl.

## Testing Guardrails

No feature is complete until both API and UI tests are in place.

### Required For Every Backend API
- Validation test
- Happy-path test
- Auth/permission test if protected
- Failure-path test

### Required For Every Backend Service
- Unit tests for business rules
- Edge-case tests for date/time calculations
- Data integrity tests for inventory and reminder status changes

### Required For Every UI Screen Or Major Component
- Render test
- User interaction test
- Loading state test
- Error state test
- Success state test

### Critical Paths That Must Always Have Tests
- login flow
- medicine creation and edit flow
- schedule and quantity calculations
- alert customization save flow
- reminder popup display and acknowledgement
- report upload
- analysis result rendering

## Definition Of Done

Work is done only when:
- requirements are implemented
- code follows module boundaries
- unit/integration tests pass
- UI tests pass
- error states are handled
- documentation is updated if contracts changed

## Preferred Workflow

1. Confirm the module that owns the change.
2. Add or update validation schema first.
3. Implement service logic.
4. Wire the route/controller.
5. Add or update backend tests.
6. Implement or update frontend UI.
7. Add or update frontend tests.
8. Verify the end-to-end flow manually if possible.

## Anti-Patterns To Avoid

- Business logic inside route handlers
- Direct database access from random UI-triggered utility code
- Hidden magic defaults without documentation
- Unvalidated AI responses
- Mixing alert scheduling logic into presentation components
- Shipping UI without tests because the flow "looks simple"

## Notes For Future Contributors

- Prefer simple, explicit code over clever abstractions.
- Preserve monolith simplicity while keeping module contracts clean.
- When in doubt, add the test first for the behavior being changed.
