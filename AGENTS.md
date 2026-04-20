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
