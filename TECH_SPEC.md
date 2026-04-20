# Health Partner Technical Specification

## 1. Overview

Health Partner is a Node.js + React + SQLite modular monolith that supports:
- Basic username/password authentication
- Medicine reminder scheduling with customizable alert timing
- AI-assisted report analysis with patient-friendly summaries

The application is intended to be simple to deploy, easy to test, and structured so each domain module can evolve independently inside one codebase.

## 2. Goals

- Ship a lightweight web app with three primary tabs:
  - `Add Medicine`
  - `Customize Alerts`
  - `Analyze Reports`
- Keep deployment simple with a modular monolith architecture
- Persist data locally in SQLite for straightforward setup
- Centralize alert scheduling and AI analysis in backend modules
- Enforce test coverage for all API and UI work

## 3. Non-Goals For Initial Release

- Multi-tenant enterprise administration
- External pharmacy integration
- Push notifications to mobile devices when the browser is closed
- Clinical diagnosis or automated prescription issuance
- Advanced EMR integration

## 4. Recommended Stack

### Backend
- Node.js 22+
- Express
- TypeScript
- SQLite via `better-sqlite3` or Prisma + SQLite
- Zod for request/response validation
- Multer for report uploads
- `node-cron` or a lightweight scheduler for reminder polling

### Frontend
- React 19
- Vite
- React Router
- React Hook Form for complex forms
- TanStack Query or a thin service layer for server state

### Testing
- Vitest or Jest for unit tests
- Supertest for API integration tests
- React Testing Library for UI tests

## 5. Architecture

## 5.1 Pattern

Use a **modular monolith**:
- One repository
- One backend app
- One React client
- SQLite as the only database
- Clear domain boundaries inside the monolith

## 5.2 Modules

### `auth`
- Login/logout
- Session validation
- Password hashing
- Auth middleware

### `medicines`
- Medicine CRUD
- Dose schedule creation
- Available quantity tracking
- Refill warning calculation

### `alerts`
- Default schedule time management
- Reminder offset configuration
- Reminder event generation
- Due reminder delivery to UI

### `reports`
- File upload
- File metadata persistence
- Report extraction orchestration
- Analysis result retrieval

### `ai-analysis`
- Prompt building
- AI provider integration
- Output schema validation
- Medical disclaimer injection

### `shared`
- Validation utilities
- Error handling
- Logging
- Date/time helpers

## 5.3 Deployment Model

- Production backend serves the React build as static assets
- API is mounted under `/api`
- SQLite database stored under a local `data/` directory
- Uploaded files stored under `uploads/`

## 6. Functional Requirements

## 6.1 Authentication

### Scope
- User logs in with username and password
- Access to app routes requires authentication
- Passwords must be hashed

### Suggested Routes
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Notes
- If self-registration is not required, seed the first user through a setup script or admin command
- Return only minimal profile info to the client

## 6.2 Add Medicine Tab

### Required Fields
- Rx name
- Days of supply
- Total available quantity
- Schedule entries for:
  - Morning
  - Noon
  - Evening
- Quantity per enabled schedule slot

### Behavior
- User can enable one or more of morning, noon, or evening
- Each enabled slot requires:
  - Time
  - Quantity to consume
- System computes daily usage and estimated depletion date
- System warns when stock is low

### Suggested UI
- Medicine form at top
- Existing medicines list/table below
- Editable schedule chips or rows
- Remaining quantity badge

## 6.3 Customize Alerts Tab

### Required Settings
- Default morning time
- Default noon time
- Default evening time
- Pre-alert offset in minutes
- On-time reminder enabled/disabled

### Default Values
- Morning: `08:00`
- Noon: `13:00`
- Evening: `20:00`
- Pre-alert: `15`

### Behavior
- User can change default slot times globally
- User can override times per medicine if needed
- System creates two reminder points by default:
  - `dose_time - offset`
  - `dose_time`

## 6.4 Analyze Reports Tab

### Upload Support
- PDF
- PNG
- JPG/JPEG

### Required Flow
1. User uploads a report file
2. File is stored securely on the server
3. Backend extracts text
4. Extracted data is sent to AI provider
5. AI returns structured output
6. Backend validates output and stores it
7. UI displays analysis cards/sections

### Required Output Sections
- `Report Summary`
- `Risks`
- `Medicine Suggestions`
- `Vitamin Suggestions`
- `Important Notes`

### Layman Summary Rule
- Summary must use simple patient-friendly language
- Avoid heavy clinical jargon unless paired with an explanation

## 7. Data Model

## 7.1 Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| username | text | unique, indexed |
| password_hash | text | hashed password only |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `user_alert_settings`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| user_id | integer | FK to users |
| morning_time | text | `HH:mm` |
| noon_time | text | `HH:mm` |
| evening_time | text | `HH:mm` |
| pre_alert_minutes | integer | default 15 |
| on_time_enabled | integer | boolean |
| timezone | text | IANA timezone |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `medicines`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| user_id | integer | FK to users |
| rx_name | text | required |
| days_of_supply | integer | required |
| total_available_qty | real | required |
| remaining_qty | real | mutable |
| notes | text | optional |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `medicine_schedules`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| medicine_id | integer | FK to medicines |
| slot | text | `morning`, `noon`, `evening` |
| enabled | integer | boolean |
| dose_time | text | `HH:mm` |
| qty | real | quantity per dose |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `reminder_events`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| user_id | integer | FK to users |
| medicine_id | integer | FK to medicines |
| schedule_id | integer | FK to medicine_schedules |
| alert_type | text | `pre` or `on_time` |
| scheduled_for | text | UTC ISO timestamp |
| status | text | `pending`, `shown`, `taken`, `missed`, `dismissed` |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `medicine_intake_logs`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| reminder_event_id | integer | FK to reminder_events |
| medicine_id | integer | FK to medicines |
| qty_taken | real | required |
| taken_at | text | ISO timestamp |
| created_at | text | ISO timestamp |

### `uploaded_reports`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| user_id | integer | FK to users |
| original_filename | text | required |
| stored_path | text | server path |
| mime_type | text | required |
| file_size | integer | required |
| extracted_text | text | nullable |
| analysis_status | text | `uploaded`, `processing`, `completed`, `failed` |
| created_at | text | ISO timestamp |
| updated_at | text | ISO timestamp |

### `report_analyses`
| Column | Type | Notes |
|---|---|---|
| id | integer | primary key |
| report_id | integer | FK to uploaded_reports |
| summary_layman | text | required |
| risks_json | text | JSON array |
| medicine_suggestions_json | text | JSON array |
| vitamin_suggestions_json | text | JSON array |
| notes_json | text | JSON array |
| disclaimer | text | required |
| ai_model | text | provider/model name |
| created_at | text | ISO timestamp |

## 8. API Design

## 8.1 Auth API

### `POST /api/auth/login`
Request:
```json
{
  "username": "demo",
  "password": "secret"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "demo"
  }
}
```

### `POST /api/auth/logout`
Response:
```json
{
  "success": true
}
```

### `GET /api/auth/me`
Response:
```json
{
  "user": {
    "id": 1,
    "username": "demo"
  }
}
```

## 8.2 Medicines API

### `GET /api/medicines`
- Returns all medicines for the authenticated user

### `POST /api/medicines`
Request:
```json
{
  "rxName": "Metformin",
  "daysOfSupply": 30,
  "totalAvailableQty": 60,
  "schedules": [
    {
      "slot": "morning",
      "enabled": true,
      "doseTime": "08:00",
      "qty": 1
    },
    {
      "slot": "evening",
      "enabled": true,
      "doseTime": "20:00",
      "qty": 1
    }
  ]
}
```

### `PUT /api/medicines/:id`
- Updates base medicine details and schedules

### `DELETE /api/medicines/:id`
- Soft delete is preferred if audit history matters

### `POST /api/medicines/:id/intake`
Request:
```json
{
  "reminderEventId": 123,
  "qtyTaken": 1
}
```

Behavior:
- Create intake log
- Decrement `remaining_qty`
- Mark reminder as `taken`

## 8.3 Alert Settings API

### `GET /api/alert-settings`
- Returns the current user's default alert settings

### `PUT /api/alert-settings`
Request:
```json
{
  "morningTime": "08:00",
  "noonTime": "13:00",
  "eveningTime": "20:00",
  "preAlertMinutes": 15,
  "onTimeEnabled": true,
  "timezone": "Asia/Kolkata"
}
```

Behavior:
- Update defaults
- Rebuild future reminder events for active medicines

## 8.4 Reports API

### `POST /api/reports/upload`
- Multipart file upload
- Persists metadata
- Returns report id

### `POST /api/reports/:id/analyze`
- Starts analysis
- Option A: synchronous for small files
- Option B: async background job with status polling

### `GET /api/reports/:id`
- Returns file metadata and current analysis status

### `GET /api/reports/:id/analysis`
Response:
```json
{
  "summaryLayman": "Your report suggests that your blood sugar is higher than the usual range.",
  "risks": [
    "May indicate poor blood sugar control"
  ],
  "medicineSuggestions": [
    "Discuss diabetic medication review with your doctor"
  ],
  "vitaminSuggestions": [
    "Ask whether vitamin D testing is needed"
  ],
  "importantNotes": [
    "Do not start or stop any medicine without medical advice"
  ],
  "disclaimer": "This analysis is informational only and not a diagnosis."
}
```

## 9. Reminder Scheduling Design

## 9.1 Strategy

- Create reminder events for a rolling window, such as the next 7 to 14 days
- Rebuild future events when:
  - medicine schedule changes
  - alert settings change
  - timezone changes

## 9.2 Event Generation

For each enabled medicine schedule:
1. Determine local dose time for each day
2. Convert to UTC for storage
3. Create:
   - pre-alert event
   - on-time event

## 9.3 Delivery

Recommended initial approach:
- Backend polls for due reminders every minute
- Frontend fetches or subscribes to due reminders
- React UI shows modal/toast popup when reminders are due

Recommended upgrade path:
- Server-Sent Events or WebSocket channel for live push while the app is open

## 9.4 Edge Cases

- Prevent duplicate reminder events
- Handle user timezone correctly
- Skip past events during schedule edits
- Preserve taken/missed history when rebuilding future events

## 10. AI Report Analysis Design

## 10.1 Backend Flow

1. Validate uploaded file type and size
2. Extract text
3. Build a constrained prompt
4. Send request to AI provider
5. Validate returned JSON against schema
6. Save normalized analysis
7. Return response to UI

## 10.2 Prompt/Output Guardrails

The model should be instructed to return only structured JSON with:
- layman summary
- risk list
- medicine suggestion list
- vitamin suggestion list
- important notes

The model must not:
- claim definitive diagnosis
- prescribe dosage
- override existing clinician instructions

## 10.3 Safety Rule

Medicine suggestions must be phrased as:
- questions to discuss with a clinician
- possible categories to review
- non-prescriptive informational guidance

Not acceptable:
- direct prescription instructions
- dosage changes
- emergency care decisions without explicit severity rules

## 11. Frontend Design

## 11.1 Routes

- `/login`
- `/app/medicines`
- `/app/alerts`
- `/app/reports`

## 11.2 Tab Behavior

### Add Medicine
- Medicine creation form
- Editable medicine list
- Remaining quantity and estimated depletion date

### Customize Alerts
- Default slot times
- Pre-alert minutes
- On-time toggle
- Save confirmation state

### Analyze Reports
- Upload control
- Analysis trigger button
- Loading state
- Summary/result cards

## 11.3 State Boundaries

- Auth state isolated in auth provider/store
- Server state handled via API layer/query client
- Form state local to each feature
- Reminder popups managed through a shared notification component

## 12. Security And Privacy

- Hash passwords with bcrypt or argon2
- Never store raw passwords
- Validate all request payloads on the server
- Restrict uploads by MIME type and size
- Sanitize file names and storage paths
- Keep AI API key on backend only
- Avoid sending unnecessary personal data to AI provider
- Add a visible medical disclaimer to report results

## 13. Performance

- SQLite is sufficient for initial local/single-node deployment
- Index `users.username`, `medicines.user_id`, `reminder_events.user_id`, `reminder_events.scheduled_for`, and `uploaded_reports.user_id`
- Use paginated report history if volume grows

## 14. Testing Strategy

## 14.1 Backend

Every API must have:
- request validation test
- happy-path test
- auth/authorization test
- failure-path test

Every service must have:
- unit tests for business rules
- reminder calculation tests
- stock decrement tests
- AI response normalization tests

## 14.2 Frontend

Every major screen must have:
- render test
- user interaction test
- loading state test
- error state test
- success state test

Critical components needing direct tests:
- login form
- add medicine form
- schedule editor
- alert settings form
- report upload panel
- analysis result renderer
- reminder popup

## 14.3 Suggested Coverage Gate

- Statements: 80% minimum
- Branches: 75% minimum
- Higher bar for scheduling and AI normalization logic

## 15. Implementation Sequence

1. Scaffold backend and frontend projects
2. Implement SQLite schema and migrations
3. Implement auth
4. Implement medicine CRUD and schedule logic
5. Implement alert settings and reminder generation
6. Implement reminder popup delivery
7. Implement report upload and text extraction
8. Implement AI analysis integration and schema validation
9. Add automated tests for each module
10. Prepare deployment scripts and seed data

## 16. Open Decisions

- Session cookies vs JWT for auth
- OCR library choice for scanned reports
- SSE vs polling for live reminders
- Async job queue now vs simple inline analysis first

Recommended initial choices:
- session cookie auth
- polling first, SSE later
- inline analysis for small files, background processing later
