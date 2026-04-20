# Health Partner Frontend

React + Vite frontend for the authenticated Health Partner workspace. Login is intentionally not implemented in this package; API calls use `credentials: include` and assume the backend session cookie already exists.

## Modules

### `features/medicines`

Inputs:
- `GET /api/medicines`
- `POST /api/medicines`
- `DELETE /api/medicines/:id`
- `GET /api/reminders/due`
- `POST /api/reminders/:id/acknowledge`
- `POST /api/reminders/:id/dismiss`

Outputs:
- Medicine creation payload with Rx name, supply quantity, optional notes, and morning/noon/evening schedules.
- Accessible reminder popup actions for acknowledgement and dismissal.

Tests:
- Medicine form validation and successful payload submission.
- Reminder popup rendering and acknowledgement flow.

### `features/alerts`

Inputs:
- `GET /api/alert-settings`
- `PUT /api/alert-settings`

Outputs:
- Alert settings payload with default slot times, pre-alert offset, on-time toggle, and IANA timezone.

Tests:
- Loading, error, save interaction, and success confirmation states.

### `features/reports`

Inputs:
- `GET /api/reports`
- `POST /api/reports/upload`
- `POST /api/reports/:id/analyze`
- `GET /api/reports/:id/analysis`

Outputs:
- Multipart upload with `reportFile`.
- Analysis view with report summary, risks, medicine suggestions, vitamin suggestions, important notes, and medical disclaimer.

Tests:
- File validation.
- Upload, analysis trigger, result rendering, and disclaimer display.

## Commands

```bash
npm install
npm test
npm run build
npm run dev
```
