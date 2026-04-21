# Health Partner Frontend

React + Vite frontend for the authenticated Health Partner workspace. Login is implemented against the session-cookie auth API exposed by `server/`; medicines, alerts, reminders, and reports are implemented against `backend/`. API calls use `credentials: include` so the browser sends the `health_partner_session` cookie to auth routes.

## Local End-To-End Setup

Run the feature backend first:

```bash
cd backend
npm run dev
```

`backend/` should listen on `http://127.0.0.1:4000` and owns:
- `GET|POST|PUT|DELETE /api/medicines`
- `GET|PUT /api/alert-settings`
- `GET|POST /api/reminders`
- `GET|POST /api/reports`

In a second terminal:

```bash
cd server
PORT=4001 npm run dev
```

On Windows PowerShell:

```powershell
cd server
$env:PORT="4001"; npm run dev
```

`server/` should listen on `http://127.0.0.1:4001` and owns:
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`

In a third terminal:

```bash
cd frontend
npm run dev
```

The default frontend proxy targets are:
- Auth: `VITE_AUTH_API_TARGET` or `http://127.0.0.1:4001`
- App APIs: `VITE_APP_API_TARGET` or `http://127.0.0.1:4000`

Override them only if you run the services on different ports:

```bash
cd frontend
VITE_AUTH_API_TARGET=http://127.0.0.1:4101 VITE_APP_API_TARGET=http://127.0.0.1:4100 npm run dev
```

Login with:
- Username: `demo`
- Password: `secret123`

## Modules

### `features/auth`

Inputs:
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Outputs:
- Login payload with username and password.
- Authenticated user state used to protect the three-tab workspace.

Tests:
- Session failure renders login.
- Field-level login validation.
- Successful login renders the authenticated tabs.

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
