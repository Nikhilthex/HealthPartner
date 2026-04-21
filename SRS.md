# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Health Partner

**Document Version:** 1.0  
**Date:** April 21, 2026  
**Project Name:** Health Partner  
**Application Type:** Web Application  
**Status:** Active Development

---

## Executive Summary

Health Partner is a modular monolith web application designed to assist users in managing their medications and analyzing health reports with AI-assisted insights. The application provides an intuitive interface for medicine reminder management, alert customization, and health report analysis with patient-friendly summaries.

The first release focuses on three primary authenticated features:
1. **Add Medicine** - Create and manage medication schedules
2. **Customize Alerts** - Configure reminder timing and preferences
3. **Analyze Reports** - Upload health reports and receive AI-generated summaries

---

## 1. INTRODUCTION

### 1.1 Purpose
This Software Requirements Specification (SRS) document defines the functional, non-functional, and technical requirements for the Health Partner application. It serves as the authoritative reference for development, testing, and deployment.

### 1.2 Scope
Health Partner is a lightweight, single-user focused web application that handles:
- User authentication via username and password
- Medicine inventory management with dose scheduling
- Customizable alert timing and reminder delivery
- Medical report file upload and AI-powered analysis
- Patient-friendly health insights and recommendations

### 1.3 Document Organization
- **Section 1-3:** Introduction and overview
- **Section 4:** Overall description and architecture
- **Section 5-7:** Functional requirements by feature
- **Section 8:** Data model and persistence
- **Section 9:** API specifications
- **Section 10:** Non-functional requirements
- **Section 11:** Security and compliance requirements

---

## 2. INTENDED AUDIENCE

- **Development Team:** Backend and frontend engineers responsible for implementation
- **QA/Test Team:** Test authors and quality assurance personnel
- **Product Team:** Product managers and stakeholders
- **DevOps/Infrastructure:** System administrators and deployment engineers

---

## 3. DEFINITIONS AND ACRONYMS

| Term | Definition |
|------|-----------|
| **API** | Application Programming Interface |
| **CRUD** | Create, Read, Update, Delete operations |
| **HH:mm** | Time format: Hours and minutes (e.g., 14:30) |
| **ISO 8601** | International standard for date/time format |
| **JWT** | JSON Web Token |
| **Modular Monolith** | Single deployable with clear internal module boundaries |
| **Pre-alert** | Reminder notification sent before scheduled dose time |
| **On-time Alert** | Reminder notification sent at exact scheduled dose time |
| **Rx Name** | Prescription medication name |
| **Timezone** | IANA timezone identifier (e.g., Asia/Kolkata) |
| **Depletion Date** | Estimated date when medication supply runs out |

---

## 4. OVERALL DESCRIPTION

### 4.1 Product Perspective
Health Partner operates as a self-contained web application. It does not integrate with external pharmacy systems, clinical databases, or push notification services in the initial release. The application is designed for individual users managing their own medication schedules and health records.

### 4.2 Product Functions
1. **Authentication Module** - Secure login and session management
2. **Medicines Module** - CRUD operations for medications with schedule configuration
3. **Alerts Module** - Global alert settings and reminder timing configuration
4. **Reminders Module** - Reminder event generation, delivery, and status tracking
5. **Reports Module** - File upload and metadata persistence
6. **AI Analysis Module** - Report text extraction, AI provider integration, and result formatting
7. **Shared Infrastructure** - Validation, error handling, logging, and utilities

### 4.3 User Classes and Characteristics

| User Class | Characteristics | Frequency |
|-----------|-----------------|-----------|
| Primary User | Individual managing their own medications | Daily/Weekly |
| Occasional User | User with intermittent report uploads | Monthly |
| Admin/Developer | Internal testing and setup | As needed |

### 4.4 Operating Environment

**Backend:**
- Node.js 22+
- Express.js framework
- TypeScript for type safety
- SQLite database (local file-based)

**Frontend:**
- React 19
- Vite bundler
- TypeScript

**Deployment:**
- Single backend instance serving both API and static React assets
- SQLite database stored locally in `data/` directory
- Uploaded files stored in `uploads/` directory
- Single production deployment

### 4.5 Design and Implementation Constraints

**Architecture:**
- Modular monolith pattern (single codebase, one deployment)
- Clear internal module boundaries
- Each module owns its routes, service logic, validation, and persistence
- Thin controllers/routes; business logic in services
- Shared utilities in `shared` module only

**Technology Stack:**
- Node.js + Express for backend
- React for frontend
- SQLite for database
- Zod for validation schemas
- bcrypt/argon2 for password hashing

**Deployment Model:**
- Production backend serves React build as static assets
- API mounted under `/api` path
- Session-based or token-backed authentication

---

## 5. FEATURE REQUIREMENTS

### 5.1 Authentication

#### 5.1.1 Overview
Users must authenticate with a username and password before accessing any protected features. The system uses secure session management with hashed passwords.

#### 5.1.2 Login

**Requirement ID:** AUTH-001

**Description:** User logs in with username and password

**Inputs:**
- Username (required, text)
- Password (required, text)

**Process:**
1. Validate username and password against stored credentials
2. Hash provided password and compare with stored hash
3. Return error if credentials invalid
4. Create secure session upon successful authentication
5. Return authenticated user info to client

**Outputs:**
- Success: User ID and username
- Failure: Unauthorized error with generic message

**Acceptance Criteria:**
- Valid credentials return authenticated session
- Invalid credentials return 401 Unauthorized
- Passwords are hashed with bcrypt or argon2
- Session contains user ID for authorization checks

#### 5.1.3 Logout

**Requirement ID:** AUTH-002

**Description:** User logs out and clears session

**Inputs:**
- Active session

**Process:**
1. Validate user is authenticated
2. Clear session data
3. Return success response

**Outputs:**
- Success confirmation

**Acceptance Criteria:**
- Session is cleared from server
- User can no longer access protected routes
- Returns 200 OK

#### 5.1.4 Session Validation

**Requirement ID:** AUTH-003

**Description:** System validates user session on protected requests

**Process:**
1. Check for valid session cookie on each request to protected routes
2. Validate session has not expired
3. Return 401 Unauthorized if session invalid

**Acceptance Criteria:**
- Unauthenticated requests return 401
- Valid sessions are accepted
- All protected routes enforce authentication

#### 5.1.5 Password Security

**Requirement ID:** AUTH-004

**Description:** Passwords are securely hashed and never stored in plain text

**Process:**
1. Hash password with bcrypt or argon2 before storage
2. Use appropriate cost factor (e.g., 10+ rounds for bcrypt)
3. Never expose raw password or hash to client

**Acceptance Criteria:**
- No plain text passwords in database
- Hash function uses industry-standard algorithm
- Hash cost factor is appropriate for security

### 5.2 Add Medicine Tab

#### 5.2.1 Overview
Users manage their medications through the Add Medicine interface. They can add new medicines, edit existing entries, configure dose schedules, and track remaining inventory.

#### 5.2.2 Medicine Creation

**Requirement ID:** MED-001

**Description:** User adds a new medicine with schedule configuration

**Inputs:**
- Rx Name (required, text)
- Days of Supply (required, integer)
- Total Available Quantity (required, numeric)
- Notes (optional, text)
- Schedule entries:
  - Morning: enabled, time (HH:mm), quantity
  - Noon: enabled, time (HH:mm), quantity
  - Evening: enabled, time (HH:mm), quantity

**Process:**
1. Validate all required fields are present and valid
2. Validate at least one schedule slot is enabled
3. Calculate daily quantity planned (sum of enabled slot quantities)
4. Calculate estimated depletion date using: depletion_date = today + days_of_supply
5. Store medicine and schedule entries
6. Return created medicine with all details

**Outputs:**
- Created medicine object with:
  - Medicine ID
  - Rx Name
  - Days of Supply
  - Total Available Quantity
  - Remaining Quantity (initially equals Total Available)
  - Daily Quantity Planned
  - Estimated Depletion Date
  - Schedule entries with IDs
  - Created/Updated timestamps

**Acceptance Criteria:**
- Validation rejects invalid quantities (negative, zero)
- Validation rejects medicine without enabled schedules
- Depletion date calculation is accurate
- Daily quantity is sum of enabled schedule quantities
- Medicine is associated with authenticated user
- Returns 201 Created on success
- Returns 422 Unprocessable Entity on validation failure

#### 5.2.3 Medicine List

**Requirement ID:** MED-002

**Description:** User views all medicines with current status

**Inputs:**
- Optional: includeInactive filter

**Process:**
1. Retrieve all medicines for authenticated user
2. Include schedule entries for each medicine
3. Calculate current daily quantity planned
4. Calculate estimated depletion date based on remaining quantity
5. Sort by estimated depletion date (soonest first recommended)

**Outputs:**
- Array of medicines with:
  - All medicine details
  - Associated schedules
  - Remaining quantity status
  - Estimated depletion date

**Acceptance Criteria:**
- Returns only user's medicines
- Includes all schedule details
- Remaining quantity reflects intake logs
- Returns empty array if no medicines exist
- Returns 200 OK

#### 5.2.4 Medicine Detail

**Requirement ID:** MED-003

**Description:** User views detailed information for single medicine

**Inputs:**
- Medicine ID

**Process:**
1. Retrieve medicine and associated schedules
2. Validate user owns this medicine
3. Return full medicine details

**Outputs:**
- Single medicine object with complete details and schedules

**Acceptance Criteria:**
- Returns 404 if medicine not found
- Returns 403 if user does not own medicine
- Returns complete medicine and schedule details

#### 5.2.5 Medicine Update

**Requirement ID:** MED-004

**Description:** User updates medicine details and schedules

**Inputs:**
- Medicine ID
- Updated fields (Rx Name, Days of Supply, Total Available Qty, Remaining Qty, Notes, Schedules)

**Process:**
1. Validate user owns this medicine
2. Validate all inputs (at least one enabled schedule)
3. Update medicine fields
4. Recalculate daily quantity and depletion date
5. Store update and return updated medicine

**Outputs:**
- Updated medicine object with new details

**Acceptance Criteria:**
- Validation prevents invalid updates
- User can only update their own medicines
- Daily quantity and depletion date recalculated
- Previous schedules preserved if not modified
- Returns 200 OK on success
- Returns 403 for unauthorized update attempts

#### 5.2.6 Medicine Deletion

**Requirement ID:** MED-005

**Description:** User deletes or archives a medicine

**Inputs:**
- Medicine ID

**Process:**
1. Validate user owns this medicine
2. Archive or delete medicine and associated data
3. Return success confirmation

**Outputs:**
- Success response with medicine ID

**Acceptance Criteria:**
- Deletes associated schedule entries
- Prevents orphaned reminder events (archive or handle)
- Returns 200 OK
- Returns 403 for unauthorized deletion

#### 5.2.7 Stock Quantity Tracking

**Requirement ID:** MED-006

**Description:** System tracks and updates remaining medication quantity

**Process:**
1. Track total available quantity at creation
2. Decrement remaining quantity when intake logged
3. Calculate estimated depletion date based on remaining quantity and daily usage
4. Warn user when stock falls below threshold

**Acceptance Criteria:**
- Remaining quantity decrements accurately
- Depletion date updates as quantity decreases
- Low stock warnings triggered appropriately
- Quantity updates are transactional

#### 5.2.8 Schedule Configuration

**Requirement ID:** MED-007

**Description:** User configures medication dose schedule (morning, noon, evening)

**Inputs:**
- For each schedule slot:
  - Enabled/Disabled flag
  - Time (HH:mm format)
  - Quantity per dose

**Process:**
1. Validate at least one slot enabled
2. Validate time format is HH:mm
3. Validate quantity is positive number
4. Store schedule entries associated with medicine

**Outputs:**
- Schedule entries with IDs and all details

**Acceptance Criteria:**
- Validation requires at least one enabled schedule
- Time format must be HH:mm
- All three slots (morning, noon, evening) available
- User can disable/enable slots independently

### 5.3 Customize Alerts Tab

#### 5.3.1 Overview
The Customize Alerts interface allows users to configure global default alert timing and reminder parameters that apply across all medicines.

#### 5.3.2 Alert Settings Retrieval

**Requirement ID:** ALERT-001

**Description:** User views current alert settings and default times

**Process:**
1. Retrieve user's alert settings from database
2. Return defaults if no user preferences exist
3. Include current timezone setting

**Outputs:**
- Alert settings object:
  - Morning Time (HH:mm)
  - Noon Time (HH:mm)
  - Evening Time (HH:mm)
  - Pre-alert Offset (minutes)
  - On-time Enabled (boolean)
  - Timezone (IANA name)

**Default Values:**
- Morning: 08:00
- Noon: 13:00
- Evening: 20:00
- Pre-alert: 15 minutes
- On-time Enabled: true
- Timezone: Asia/Kolkata

**Acceptance Criteria:**
- Returns saved settings if they exist
- Returns defaults on first access
- Includes timezone setting
- Returns 200 OK

#### 5.3.3 Alert Settings Update

**Requirement ID:** ALERT-002

**Description:** User updates global alert timing and reminder configuration

**Inputs:**
- Morning Time (optional, HH:mm)
- Noon Time (optional, HH:mm)
- Evening Time (optional, HH:mm)
- Pre-alert Offset (optional, integer minutes)
- On-time Enabled (optional, boolean)
- Timezone (optional, IANA timezone name)

**Process:**
1. Validate all time formats are HH:mm
2. Validate timezone is valid IANA name
3. Validate pre-alert offset is positive integer
4. Update user's alert settings
5. **Rebuild future reminders** - Regenerate all pending reminder events with new timing
6. Return updated settings

**Outputs:**
- Updated alert settings
- Meta flag: futureRemindersRebuilt = true

**Acceptance Criteria:**
- Validation rejects invalid time formats
- Validation rejects invalid timezone
- Settings saved to database
- Future reminders regenerated without creating duplicates
- Returns 200 OK
- Returns meta.futureRemindersRebuilt = true
- Old pending reminders are replaced (idempotent)

#### 5.3.4 Reminder Generation

**Requirement ID:** ALERT-003

**Description:** System generates reminder events based on medicine schedules and alert settings

**Process:**
1. For each enabled medicine schedule:
   a. Get medicine dose time and quantity
   b. Apply user's alert settings
   c. Calculate two reminder times:
      - Pre-alert: dose_time - pre_alert_minutes
      - On-time: dose_time (if enabled)
   d. Convert times to UTC using user's timezone
   e. Create reminder event for each calculated time
   f. Mark as pending status

2. Reminder Generation must be **idempotent**:
   - Regenerating future reminders must not create duplicates
   - Old pending reminders should be archived/replaced
   - System must track which reminders were auto-generated

**Outputs:**
- Reminder events with:
  - ID
  - User ID
  - Medicine ID
  - Schedule ID
  - Alert Type (pre or on_time)
  - Scheduled For (UTC ISO timestamp)
  - Status (pending)

**Acceptance Criteria:**
- Two reminders created per enabled schedule (pre + on_time if enabled)
- Times converted to UTC correctly
- Idempotency: regenerating does not create duplicates
- Pending reminders persist until acknowledged/taken/missed
- Multiple schedule updates do not multiply reminders

#### 5.3.5 Pre-Alert and On-Time Configuration

**Requirement ID:** ALERT-004

**Description:** User configures pre-alert offset and on-time reminder enablement

**Inputs:**
- Pre-alert Minutes (integer, 0-120 recommended)
- On-time Enabled (boolean)

**Process:**
1. Validate pre-alert is non-negative integer
2. Save settings
3. Trigger reminder regeneration

**Acceptance Criteria:**
- Pre-alert can be 0 (no pre-alert)
- On-time reminder can be disabled
- Settings saved and applied to future reminders

### 5.4 Analyze Reports Tab

#### 5.4.1 Overview
Users upload health reports in PDF, PNG, or JPEG format. The backend extracts text, sends it to an AI provider for analysis, and returns patient-friendly summaries with risk and suggestion data.

#### 5.4.2 Report Upload

**Requirement ID:** REPORT-001

**Description:** User uploads a health report file

**Inputs:**
- File (multipart/form-data)
- Supported Types: PDF, PNG, JPG/JPEG

**Process:**
1. Validate file type (MIME type check)
2. Validate file size (recommended max: 10MB)
3. Store file securely on server
4. Create report metadata record
5. Set analysis status to "uploaded"
6. Optionally trigger text extraction async

**Outputs:**
- Report metadata object:
  - Report ID
  - Original Filename
  - File Size
  - MIME Type
  - Analysis Status (uploaded)
  - Created Timestamp

**Acceptance Criteria:**
- Only PDF, PNG, JPG/JPEG accepted
- File size validated before storage
- File stored in secure location with user isolation
- Metadata persisted in database
- Returns 201 Created
- Returns 400 Bad Request for unsupported file types
- Returns 413 Payload Too Large for oversized files

#### 5.4.3 Report List

**Requirement ID:** REPORT-002

**Description:** User views all uploaded reports

**Process:**
1. Retrieve all reports for authenticated user
2. Include metadata and analysis status
3. Sort by upload date (newest first)

**Outputs:**
- Array of report objects with metadata and status

**Acceptance Criteria:**
- Returns only user's reports
- Includes analysis status
- Includes upload date/time
- Returns 200 OK

#### 5.4.4 Report Detail and Status

**Requirement ID:** REPORT-003

**Description:** User views single report metadata and analysis status

**Inputs:**
- Report ID

**Process:**
1. Retrieve report metadata
2. Validate user owns report
3. Return full details including current analysis status

**Outputs:**
- Report object with all metadata and current analysis status

**Acceptance Criteria:**
- Returns 404 if report not found
- Returns 403 if user does not own report
- Includes analysis status (uploaded, processing, completed, failed)

#### 5.4.5 Report Analysis Initiation

**Requirement ID:** REPORT-004

**Description:** User requests AI analysis of uploaded report

**Inputs:**
- Report ID

**Process:**
1. Validate user owns report
2. Extract text from report file (PDF/image)
3. Set status to "processing"
4. Send extracted text to AI provider with prompt
5. Receive structured AI response
6. Validate response schema
7. Store analysis results
8. Set status to "completed"

**Error Handling:**
- If extraction fails: set status to "failed"
- If AI response malformed: set status to "failed" and log error
- Return safe error message to user

**Outputs:**
- Analysis object with sections:
  - Report Summary (layman's language)
  - Risks (array of risk items)
  - Medicine Suggestions (array of suggestions)
  - Vitamin Suggestions (array of suggestions)
  - Important Notes (array of notes)
  - Disclaimer (required legal/medical disclaimer)

**Acceptance Criteria:**
- Analysis status updates to "processing" then "completed"
- All output sections required
- Summary uses patient-friendly language
- All suggestions marked as informational, not prescriptive
- Disclaimer included with all results
- Returns 200 OK on successful completion
- Returns 422 if report analysis fails with safe error message

#### 5.4.6 Analysis Result Retrieval

**Requirement ID:** REPORT-005

**Description:** User views completed AI analysis for a report

**Inputs:**
- Report ID

**Process:**
1. Retrieve report and associated analysis
2. Validate user owns report
3. Return complete analysis results with disclaimer

**Outputs:**
- Analysis object with all sections and disclaimer

**Acceptance Criteria:**
- Returns 404 if report not found
- Returns 403 if unauthorized
- Returns 404 if analysis not yet completed
- Includes all analysis sections
- Includes clinical disclaimer

#### 5.4.7 Supported File Types

**Requirement ID:** REPORT-006

**Inputs:**
- PDF files
- PNG images
- JPG/JPEG images

**Process:**
1. Validate MIME type against whitelist
2. Extract text from file format
3. Send extracted text to AI analysis

**Acceptance Criteria:**
- All three file types successfully uploaded
- Text extraction works for each type
- Unsupported types rejected at upload

#### 5.4.8 AI Analysis Output Format

**Requirement ID:** REPORT-007

**Description:** AI analysis returns structured, validated output

**Response Schema:**
```json
{
  "reportSummary": "string (layman's language)",
  "risks": [
    {
      "risk": "string",
      "severity": "low|medium|high"
    }
  ],
  "medicineSuggestions": [
    {
      "suggestion": "string",
      "reason": "string"
    }
  ],
  "vitaminSuggestions": [
    {
      "suggestion": "string",
      "reason": "string"
    }
  ],
  "importantNotes": [
    "string"
  ]
}
```

**Process:**
1. Validate AI response against schema
2. Fail closed if schema validation fails
3. Store validated result
4. Prepend disclaimer to results

**Disclaimer Text:**
"This analysis is for informational support only and should not be considered a medical diagnosis or prescription. Always consult with a qualified healthcare provider before making any medical decisions."

**Acceptance Criteria:**
- Schema validation required before persistence
- Malformed responses logged and reported safely
- Disclaimer included on all results
- All output stored for audit trail

---

## 6. REMINDERS AND INTAKE TRACKING

### 6.1 Reminder Delivery

**Requirement ID:** REM-001

**Description:** System delivers due reminders to user interface

**Process:**
1. Query for reminders where scheduled_for <= now
2. Filter by pending status
3. Calculate window (typically 15 minutes after scheduled time)
4. Return due reminders to client in popup

**Outputs:**
- Array of due reminders with:
  - Reminder ID
  - Medicine name
  - Dose time
  - Quantity to take
  - Alert type (pre or on_time)

**Acceptance Criteria:**
- Reminders delivered within configured window
- Reminders accessible via popup on UI
- Multiple reminders shown if due
- Returns empty array if no due reminders

### 6.2 Reminder Acknowledgement

**Requirement ID:** REM-002

**Description:** User marks reminder as seen

**Process:**
1. Update reminder status to "shown"
2. Allow user to dismiss or log intake

**Outputs:**
- Updated reminder with status

### 6.3 Medicine Intake Logging

**Requirement ID:** REM-003

**Description:** User logs medicine intake when taking medication

**Inputs:**
- Reminder ID
- Quantity taken (numeric)
- Taken at timestamp (ISO UTC)

**Process:**
1. Validate reminder exists and belongs to user
2. Validate quantity is positive number
3. Create intake log entry
4. Decrement medicine remaining quantity
5. Update reminder status to "taken"
6. Return updated remaining quantity

**Outputs:**
- Confirmation with:
  - Medicine ID
  - New remaining quantity
  - Reminder status
  - Intake log ID

**Acceptance Criteria:**
- Quantity decremented from medicine
- Intake logged with timestamp
- Reminder marked as taken
- Quantity update is transactional
- Returns 200 OK

### 6.4 Reminder Dismissal

**Requirement ID:** REM-004

**Description:** User dismisses reminder without logging intake

**Process:**
1. Validate reminder belongs to user
2. Update reminder status to "dismissed"
3. Return confirmation

**Outputs:**
- Updated reminder with dismissed status

**Acceptance Criteria:**
- Reminder status changed to dismissed
- Quantity not decremented
- Reminder no longer shows as due

---

## 7. DATA PERSISTENCE MODEL

### 7.1 Database Overview
- **Type:** SQLite (file-based)
- **Location:** `data/healthpartner.db`
- **Access:** Prisma ORM or direct SQL

### 7.2 Data Models

#### 7.2.1 Users Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| username | TEXT | UNIQUE, NOT NULL, INDEXED | Login identifier |
| password_hash | TEXT | NOT NULL | Hashed with bcrypt/argon2 |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

#### 7.2.2 User Alert Settings Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| user_id | INTEGER | NOT NULL, FK → users.id | |
| morning_time | TEXT | NOT NULL | Format: HH:mm |
| noon_time | TEXT | NOT NULL | Format: HH:mm |
| evening_time | TEXT | NOT NULL | Format: HH:mm |
| pre_alert_minutes | INTEGER | DEFAULT 15 | Minutes before dose |
| on_time_enabled | INTEGER | DEFAULT 1 | Boolean flag |
| timezone | TEXT | DEFAULT 'Asia/Kolkata' | IANA timezone name |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

#### 7.2.3 Medicines Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| user_id | INTEGER | NOT NULL, FK → users.id | |
| rx_name | TEXT | NOT NULL | Medication name |
| days_of_supply | INTEGER | NOT NULL | Number of days stock lasts |
| total_available_qty | REAL | NOT NULL | Initial quantity |
| remaining_qty | REAL | NOT NULL | Current available stock |
| notes | TEXT | | Optional user notes |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

#### 7.2.4 Medicine Schedules Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| medicine_id | INTEGER | NOT NULL, FK → medicines.id | |
| slot | TEXT | NOT NULL | 'morning', 'noon', or 'evening' |
| enabled | INTEGER | NOT NULL | Boolean flag (0 or 1) |
| dose_time | TEXT | NOT NULL | Format: HH:mm |
| qty | REAL | NOT NULL | Quantity per dose |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

#### 7.2.5 Reminder Events Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| user_id | INTEGER | NOT NULL, FK → users.id | |
| medicine_id | INTEGER | NOT NULL, FK → medicines.id | |
| schedule_id | INTEGER | NOT NULL, FK → medicine_schedules.id | |
| alert_type | TEXT | NOT NULL | 'pre' or 'on_time' |
| scheduled_for | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| status | TEXT | NOT NULL | pending, shown, taken, missed, dismissed |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

#### 7.2.6 Medicine Intake Logs Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| reminder_event_id | INTEGER | NOT NULL, FK → reminder_events.id | |
| medicine_id | INTEGER | NOT NULL, FK → medicines.id | |
| qty_taken | REAL | NOT NULL | Quantity consumed |
| taken_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

#### 7.2.7 Uploaded Reports Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| user_id | INTEGER | NOT NULL, FK → users.id | |
| original_filename | TEXT | NOT NULL | User's uploaded filename |
| stored_path | TEXT | NOT NULL | Server file path |
| mime_type | TEXT | NOT NULL | File MIME type |
| file_size | INTEGER | NOT NULL | Size in bytes |
| extracted_text | TEXT | | Full extracted text |
| analysis_status | TEXT | DEFAULT 'uploaded' | uploaded, processing, completed, failed |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

#### 7.2.8 Report Analyses Table

| Column | Type | Constraints | Notes |
|--------|------|-----------|-------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | |
| report_id | INTEGER | NOT NULL, FK → uploaded_reports.id | |
| summary_layman | TEXT | NOT NULL | Patient-friendly summary |
| risks_json | TEXT | NOT NULL | JSON array of risks |
| medicine_suggestions_json | TEXT | NOT NULL | JSON array of suggestions |
| vitamin_suggestions_json | TEXT | NOT NULL | JSON array of suggestions |
| notes_json | TEXT | NOT NULL | JSON array of notes |
| disclaimer | TEXT | NOT NULL | Medical/legal disclaimer |
| ai_model | TEXT | NOT NULL | Provider and model name |
| created_at | TEXT | NOT NULL | ISO 8601 UTC timestamp |

---

## 8. API SPECIFICATION

### 8.1 General API Conventions

**Base Path:** `/api`

**Authentication:** Session cookie-based
- Required on all endpoints except `POST /api/auth/login`
- Session set by server after successful login
- Returns `401 Unauthorized` if missing or invalid

**Content Types:**
- JSON APIs: `Content-Type: application/json`
- File upload: `Content-Type: multipart/form-data`

**Date/Time Formats:**
- Timestamps: ISO 8601 UTC (e.g., "2026-04-20T09:00:00.000Z")
- Times: HH:mm format (e.g., "14:30")
- Timezone: IANA names (e.g., "Asia/Kolkata")

**Standard Success Response:**
```json
{
  "data": {},
  "meta": {}
}
```

**Standard Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field specific error"
      }
    ]
  }
}
```

**HTTP Status Codes:**
- `200 OK` - Successful read/update
- `201 Created` - Successful creation
- `400 Bad Request` - Malformed request
- `401 Unauthorized` - Unauthenticated or expired session
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate/invalid state
- `413 Payload Too Large` - File too large
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Unexpected error

### 8.2 Authentication Endpoints

#### 8.2.1 POST /api/auth/login

**Purpose:** Authenticate user and create session

**Request:**
```json
{
  "username": "demo",
  "password": "demo123"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 1,
      "username": "demo"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `422 Unprocessable Entity`: Missing/invalid fields

#### 8.2.2 POST /api/auth/logout

**Purpose:** Clear authenticated session

**Request:** No body

**Success Response (200 OK):**
```json
{
  "data": {
    "success": true
  }
}
```

#### 8.2.3 GET /api/auth/me

**Purpose:** Get current authenticated user

**Request:** No body

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 1,
      "username": "demo"
    }
  }
}
```

### 8.3 Medicines Endpoints

#### 8.3.1 GET /api/medicines

**Purpose:** List all medicines for user

**Query Parameters:**
- `includeInactive` (optional, boolean)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 10,
      "rxName": "Metformin",
      "daysOfSupply": 30,
      "totalAvailableQty": 60,
      "remainingQty": 42,
      "dailyQtyPlanned": 2,
      "estimatedDepletionDate": "2026-05-11",
      "schedules": [
        {
          "id": 100,
          "slot": "morning",
          "doseTime": "08:00",
          "qty": 1,
          "enabled": true
        }
      ],
      "createdAt": "2026-04-20T09:00:00.000Z",
      "updatedAt": "2026-04-20T09:00:00.000Z"
    }
  ]
}
```

#### 8.3.2 GET /api/medicines/:id

**Purpose:** Get single medicine detail

**Success Response (200 OK):**
- Same structure as single medicine in list endpoint

**Error Responses:**
- `404 Not Found`: Medicine not found
- `403 Forbidden`: User doesn't own medicine

#### 8.3.3 POST /api/medicines

**Purpose:** Create new medicine

**Request:**
```json
{
  "rxName": "Metformin",
  "daysOfSupply": 30,
  "totalAvailableQty": 60,
  "notes": "Take after food",
  "schedules": [
    {
      "slot": "morning",
      "enabled": true,
      "doseTime": "08:00",
      "qty": 1
    },
    {
      "slot": "noon",
      "enabled": false,
      "doseTime": "13:00",
      "qty": 0
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

**Success Response (201 Created):**
- Complete medicine object with IDs and timestamps

**Error Responses:**
- `422 Unprocessable Entity`: Validation errors (no enabled schedules, invalid quantities, etc.)

#### 8.3.4 PUT /api/medicines/:id

**Purpose:** Update medicine details

**Request:**
- Same fields as POST, all optional

**Success Response (200 OK):**
- Updated medicine object

**Error Responses:**
- `404 Not Found`: Medicine not found
- `403 Forbidden`: User doesn't own medicine
- `422 Unprocessable Entity`: Validation errors

#### 8.3.5 DELETE /api/medicines/:id

**Purpose:** Delete/archive medicine

**Request:** No body

**Success Response (200 OK):**
```json
{
  "data": {
    "success": true,
    "id": 10
  }
}
```

**Error Responses:**
- `404 Not Found`: Medicine not found
- `403 Forbidden`: User doesn't own medicine

#### 8.3.6 POST /api/medicines/:id/intake

**Purpose:** Log medicine intake

**Request:**
```json
{
  "reminderEventId": 123,
  "qtyTaken": 1,
  "takenAt": "2026-04-20T14:30:00.000Z"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "medicineId": 10,
    "remainingQty": 41,
    "reminderEventId": 123,
    "reminderStatus": "taken",
    "intakeLogId": 501
  }
}
```

### 8.4 Alert Settings Endpoints

#### 8.4.1 GET /api/alert-settings

**Purpose:** Get user's alert settings

**Success Response (200 OK):**
```json
{
  "data": {
    "morningTime": "08:00",
    "noonTime": "13:00",
    "eveningTime": "20:00",
    "preAlertMinutes": 15,
    "onTimeEnabled": true,
    "timezone": "Asia/Kolkata"
  }
}
```

#### 8.4.2 PUT /api/alert-settings

**Purpose:** Update alert settings

**Request:**
```json
{
  "morningTime": "07:30",
  "noonTime": "13:15",
  "eveningTime": "20:30",
  "preAlertMinutes": 15,
  "onTimeEnabled": true,
  "timezone": "Asia/Kolkata"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "morningTime": "07:30",
    "noonTime": "13:15",
    "eveningTime": "20:30",
    "preAlertMinutes": 15,
    "onTimeEnabled": true,
    "timezone": "Asia/Kolkata"
  },
  "meta": {
    "futureRemindersRebuilt": true
  }
}
```

### 8.5 Reminders Endpoints

#### 8.5.1 GET /api/reminders/due

**Purpose:** Get due reminders for popup display

**Query Parameters:**
- `now` (optional, ISO timestamp)
- `windowMinutes` (optional, default 15)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 500,
      "medicineId": 10,
      "medicineName": "Metformin",
      "doseTime": "08:00",
      "quantity": 1,
      "alertType": "pre",
      "scheduledFor": "2026-04-20T07:45:00.000Z"
    }
  ]
}
```

#### 8.5.2 POST /api/reminders/:id/acknowledge

**Purpose:** Mark reminder as seen

**Request:** No body

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 500,
    "status": "shown"
  }
}
```

#### 8.5.3 POST /api/reminders/:id/dismiss

**Purpose:** Dismiss reminder

**Request:** No body

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 500,
    "status": "dismissed"
  }
}
```

### 8.6 Reports Endpoints

#### 8.6.1 POST /api/reports/upload

**Purpose:** Upload health report file

**Request:** `multipart/form-data`
- Field name: `file`
- Supported types: PDF, PNG, JPG/JPEG
- Max size: 10MB recommended

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 50,
    "originalFilename": "report.pdf",
    "fileSize": 2048000,
    "mimeType": "application/pdf",
    "analysisStatus": "uploaded",
    "createdAt": "2026-04-20T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type
- `413 Payload Too Large`: File exceeds size limit

#### 8.6.2 GET /api/reports

**Purpose:** List all uploaded reports

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 50,
      "originalFilename": "report.pdf",
      "fileSize": 2048000,
      "analysisStatus": "completed",
      "createdAt": "2026-04-20T10:00:00.000Z"
    }
  ]
}
```

#### 8.6.3 GET /api/reports/:id

**Purpose:** Get report metadata and status

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 50,
    "originalFilename": "report.pdf",
    "fileSize": 2048000,
    "mimeType": "application/pdf",
    "analysisStatus": "completed",
    "createdAt": "2026-04-20T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `404 Not Found`: Report not found
- `403 Forbidden`: User doesn't own report

#### 8.6.4 POST /api/reports/:id/analyze

**Purpose:** Start AI analysis of report

**Request:** No body

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 50,
    "analysisStatus": "completed",
    "analysis": {
      "reportSummary": "...",
      "risks": [...],
      "medicineSuggestions": [...],
      "vitaminSuggestions": [...],
      "importantNotes": [...],
      "disclaimer": "..."
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Report not found
- `403 Forbidden`: User doesn't own report
- `422 Unprocessable Entity`: Analysis failed

#### 8.6.5 GET /api/reports/:id/analysis

**Purpose:** Get completed analysis results

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 101,
    "reportId": 50,
    "reportSummary": "Patient presents with elevated glucose levels...",
    "risks": [
      {
        "risk": "Elevated blood glucose",
        "severity": "high"
      }
    ],
    "medicineSuggestions": [
      {
        "suggestion": "Discuss diabetes management options",
        "reason": "Based on glucose levels"
      }
    ],
    "vitaminSuggestions": [
      {
        "suggestion": "Vitamin D supplementation may be beneficial",
        "reason": "Common deficiency in sedentary individuals"
      }
    ],
    "importantNotes": [
      "Always consult with your healthcare provider"
    ],
    "disclaimer": "This analysis is for informational support..."
  }
}
```

**Error Responses:**
- `404 Not Found`: Report or analysis not found
- `403 Forbidden`: User doesn't own report

---

## 9. NON-FUNCTIONAL REQUIREMENTS

### 9.1 Performance Requirements

**Response Time:**
- All API endpoints: < 500ms under normal load
- Report upload: < 2 seconds for typical PDFs
- AI analysis: < 30 seconds (async acceptable)

**Scalability:**
- Support single user in initial release
- Designed for horizontal scaling in future
- SQLite single-file database adequate for early users

**Throughput:**
- Handle 100+ reminders per day per user
- Support 10+ concurrent users in development/testing

### 9.2 Reliability Requirements

**Availability:**
- Target 99% uptime for deployed application
- Graceful degradation on external service failures (AI provider)

**Data Integrity:**
- All transactions atomic (especially inventory changes)
- No orphaned records after deletions
- Reminder generation idempotent (no duplicates)

**Error Recovery:**
- Failed AI analyses retryable
- Graceful fallback for AI provider outages
- Comprehensive error logging for diagnostics

### 9.3 Usability Requirements

**User Interface:**
- Mobile-friendly responsive design
- Accessible with WCAG 2.1 AA compliance target
- Clear visual hierarchy for three main tabs
- Form validation with clear error messages

**Accessibility:**
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Alternative text for images

### 9.4 Maintainability

**Code Organization:**
- Modular architecture with clear boundaries
- TypeScript for type safety
- Comprehensive inline documentation
- Consistent code style and conventions

**Testing:**
- Unit test coverage ≥ 80%
- Integration tests for critical paths
- E2E tests for user workflows
- Automated test execution in CI/CD

### 9.5 Supportability

**Logging:**
- Structured logging with correlation IDs
- Separate logs for auth, medicines, reminders, AI analysis
- No sensitive data in logs (passwords, API keys, PII redacted)

**Monitoring:**
- Application health checks
- Database connectivity monitoring
- External service availability (AI provider)
- Error rate tracking

### 9.6 Deployment Requirements

**Build:**
- Backend builds to single Node.js artifact
- Frontend builds to static assets
- Zero-downtime deployments target

**Database:**
- SQLite file stored persistently
- Migrations run automatically on deployment
- Backup strategy documented

**Environment:**
- Configuration via environment variables
- No hardcoded secrets
- Same binary runs in dev/test/prod (12-factor app)

---

## 10. SECURITY REQUIREMENTS

### 10.1 Authentication

**Requirement:** Secure user authentication

**Implementation:**
- Username/password with bcrypt or argon2 hashing
- Minimum 10 rounds for bcrypt or equivalent for argon2
- Session cookies with secure flags:
  - `HttpOnly` flag (prevent JavaScript access)
  - `Secure` flag (HTTPS only)
  - `SameSite` policy (Strict preferred)
- Session expiration (recommended: 24 hours or logout on browser close)

### 10.2 Authorization

**Requirement:** Users access only their own data

**Implementation:**
- Server-side auth checks on all protected routes
- User ID from session compared against resource owner
- No reliance on client-side auth state
- Return 403 Forbidden for unauthorized access

**Enforced On:**
- All medicine operations
- All reminder/alert settings
- All report uploads and analyses
- All intake logs

### 10.3 Input Validation

**Requirement:** Validate all user inputs before processing

**Scope:**
- Request body fields (JSON)
- Query parameters
- URL path parameters
- Uploaded file types and sizes

**Process:**
1. Define explicit validation schemas (Zod recommended)
2. Validate before business logic
3. Return 422 Unprocessable Entity with field-level errors
4. Never trust client-provided values for authorization

### 10.4 Password Security

**Requirement:** Protect password data

**Implementation:**
- Hash passwords with bcrypt (≥10 rounds) or argon2
- Never store plain text passwords
- Never return password or hash to client
- Implement rate limiting on login attempts
- No password reset in initial release (admin-only reset)

### 10.5 API Key Protection

**Requirement:** Protect AI provider API keys

**Implementation:**
- Store API key in environment variable only
- Never expose to client
- Never commit to repository
- Rotate periodically
- Log access but not key value

### 10.6 File Upload Security

**Requirement:** Secure file upload handling

**Implementation:**
- Whitelist file types (PDF, PNG, JPG only)
- Validate MIME type before storage
- Enforce file size limits (10MB max recommended)
- Store files outside web root if possible
- Generate unique server-side filenames
- Isolate files by user ID
- Scan for malware if practical

### 10.7 Data Sensitivity

**Requirement:** Handle sensitive data appropriately

**PII Handling:**
- Minimize data sent to AI provider
- Strip unnecessary PII from analysis requests
- User-facing data storage only what's necessary

**Logging:**
- Never log passwords
- Never log API keys or tokens
- Redact PII from logs (SSN, phone, address if captured)
- Redact raw AI provider payloads if logging

**Error Messages:**
- Return safe errors to client (no stack traces)
- Log detailed errors server-side only
- Never expose internal paths or system details

### 10.8 Inventory Mutations

**Requirement:** Ensure data integrity of medicine quantities

**Implementation:**
- All quantity changes transactional
- Each intake log creates audit trail
- No concurrent update race conditions
- Quantity decrements only on confirmed intake
- Reverse/void operations logged

### 10.9 Reminder Generation

**Requirement:** Prevent duplicate reminders

**Implementation:**
- Track generated reminders by schedule/date
- Check for duplicates before creation
- Archiving old pending reminders when regenerating
- Idempotent regeneration (no side effects on rerun)

### 10.10 AI Response Validation

**Requirement:** Validate and sanitize AI outputs

**Process:**
1. Validate response schema before processing
2. Fail closed on malformed output
3. Log validation failures
4. Return safe error to user
5. Never render unvalidated AI output
6. Include medical disclaimer with all results

### 10.11 Session Management

**Requirement:** Secure session handling

**Implementation:**
- Cryptographically secure session IDs
- Session data stored server-side only
- Session expiration enforced
- Logout clears server-side session
- No session fixation vulnerabilities
- CSRF protection if applicable

### 10.12 Dependency Security

**Requirement:** Maintain secure dependencies

**Process:**
- Regular dependency updates
- Vulnerability scanning (npm audit, Snyk, etc.)
- Avoid unnecessary packages
- Review changelogs for breaking/security updates
- Lock dependency versions

---

## 11. TESTING AND QUALITY ASSURANCE

### 11.1 Backend Testing Requirements

**For Every API Endpoint:**
1. Validation test (invalid inputs rejected)
2. Happy-path test (successful operation)
3. Authentication test (unauthenticated rejected)
4. Authorization test (unauthorized user rejected)
5. Error-path test (expected failures handled)

**For Every Service Function:**
1. Unit tests for business logic
2. Edge-case tests (boundary values, timezones)
3. Data integrity tests (transactions, concurrent updates)

**Critical Paths:**
- Login flow (valid/invalid credentials)
- Medicine creation and schedule validation
- Reminder generation and idempotency
- Intake logging and quantity updates
- Alert settings update and regeneration
- Report upload and file validation
- AI analysis and schema validation

**Test Framework:** Vitest/Jest + Supertest

### 11.2 Frontend Testing Requirements

**For Every Screen/Component:**
1. Render test (displays correctly)
2. User interaction test (buttons, forms work)
3. Loading state test (loading spinners shown)
4. Error state test (errors displayed)
5. Success state test (data displayed)
6. Empty state test (no data message)

**Critical Paths:**
- Login flow (form submission, error handling)
- Add medicine form (validation, schedule management)
- Alert settings form (save and regeneration)
- Report upload (file selection, progress)
- Reminder popup (dismissal, intake logging)
- Analysis display (all sections rendered)

**Test Framework:** Vitest + React Testing Library

### 11.3 Integration Tests

**User Workflows:**
1. Complete login flow
2. Create medicine → verify reminders generated
3. Update alert settings → verify reminders regenerated
4. Log intake → verify quantity updated
5. Upload report → analyze → verify results displayed

### 11.4 E2E Tests

**Scenarios:**
1. User registration/login flow
2. Add multiple medicines with schedules
3. Receive and dismiss/take reminders
4. Upload and analyze health report
5. Modify alert settings and verify impact

**Tools:** Playwright or Cypress

### 11.5 Test Coverage Goals

- Backend: ≥80% code coverage
- Frontend: ≥70% component coverage
- All new code requires tests before merge
- Critical paths have integration tests

### 11.6 Quality Gates

**Before Release:**
- All tests pass
- No critical/high severity vulnerabilities
- Code reviewed by team member
- Documentation updated
- Performance benchmarks met

---

## 12. DOCUMENTATION REQUIREMENTS

### 12.1 Code Documentation

**For Backend Modules:**
- Module README with inputs/outputs/contracts
- JSDoc comments on exported functions
- Schema definitions alongside validation
- Error handling patterns documented

**For Frontend Components:**
- Component purpose and props documented
- State management explained
- User interaction flows described
- Accessibility features noted

### 12.2 API Documentation

**OpenAPI/Swagger Specification:**
- All endpoints documented
- Request/response schemas
- Authentication requirements
- Error responses with examples
- Auto-generated from code preferred

### 12.3 Deployment Documentation

- Environment variables required
- Database setup/migration steps
- Build and deployment process
- Backup and recovery procedures
- Troubleshooting guide

### 12.4 User Documentation

- Getting started guide
- Feature walkthroughs with screenshots
- FAQ for common issues
- Medical/legal disclaimers

---

## 13. COMPLIANCE AND STANDARDS

### 13.1 Medical/Healthcare

**Disclaimer Requirement:**
All AI-generated analysis must include:
- Statement that this is informational support only
- Not a medical diagnosis
- Should consult healthcare provider
- Not a prescription authority

**Data Handling:**
- No HIPAA compliance required for initial release
- Reasonable data protection measures
- No third-party sharing without consent
- Secure storage and transmission

### 13.2 Software Engineering Standards

**Code Standards:**
- TypeScript strict mode enabled
- ESLint rules enforced
- Prettier formatting
- Type coverage >90%

**Architecture Standards:**
- Modular monolith pattern
- Clear module boundaries
- Thin controllers
- Services handle business logic
- Shared utilities reused

**Security Standards:**
- OWASP Top 10 protection
- Input validation
- Output encoding
- Secure session management
- Password hashing best practices

### 13.3 Testing Standards

- Unit tests for all business logic
- Integration tests for workflows
- E2E tests for user journeys
- Load testing before production

---

## 14. ACCEPTANCE CRITERIA AND DEFINITION OF DONE

### 14.1 Feature Complete When:

1. **Requirements met** - All functional requirements implemented
2. **Code follows patterns** - Modular boundaries respected
3. **Tests pass** - Unit, integration, E2E tests all green
4. **UI complete** - All states (loading, error, success, empty) implemented
5. **Error handling** - Graceful failures with user-friendly messages
6. **Documentation updated** - READMEs, API docs, comments updated
7. **Security reviewed** - No secrets exposed, validation complete
8. **Performance acceptable** - Response times meet targets

### 14.2 Definition of Done Checklist

- [ ] Module ownership identified
- [ ] Validation schemas defined/updated
- [ ] Backend service logic implemented
- [ ] API routes wired and tested
- [ ] Frontend UI implemented
- [ ] All required tests written and passing
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Security review passed
- [ ] No known critical issues

---

## 15. DELIVERABLES AND TIMELINES

### Phase 1: Core Application (Initial Release)

**Target Date:** May 2026

**Deliverables:**
- Working authentication system
- Medicine CRUD functionality
- Alert settings management
- Reminder generation and delivery
- Report upload and storage
- AI analysis integration
- UI with three tabs
- Comprehensive test suite
- Deployment documentation

**Success Criteria:**
- User can login securely
- User can add/manage medicines
- User can customize alerts
- User can upload reports and receive analysis
- All critical path tests pass
- Deployed and running

### Phase 2: Enhancements (Future)

**Planned Features:**
- Refill alerts based on quantity
- Historical reminder tracking
- Enhanced report extraction/OCR
- Export/share functionality
- Multi-user support
- Mobile app
- Push notifications

---

## 16. GLOSSARY

| Term | Definition |
|------|-----------|
| **Depletion Date** | Calculated date when medicine supply will be exhausted based on daily usage |
| **Dose** | Single quantity of medicine taken at one time |
| **Intake Log** | Record of when user took medicine and quantity consumed |
| **Modular Monolith** | Single deployable application with clear internal module boundaries |
| **On-time Alert** | Reminder sent at exact scheduled dose time |
| **Pre-alert** | Reminder sent N minutes before scheduled dose time |
| **Remainder Event** | Scheduled notification for upcoming medicine dose |
| **Schedule** | Recurring pattern (morning/noon/evening) with time and quantity |
| **Session** | Authenticated user connection to the application |

---

## 17. APPENDICES

### Appendix A: Environment Variables

```bash
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=file:../data/healthpartner.db

# Session
SESSION_SECRET=change-me-in-production

# File Upload
UPLOAD_DIR=./uploads

# AI Provider
OPENAI_API_KEY=<your-key-here>
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4-turbo

# Timezone
DEFAULT_TIMEZONE=Asia/Kolkata
```

### Appendix B: Default Test Credentials

```
Username: demo
Password: demo123
```

### Appendix C: API Testing

**Base URL:** `http://localhost:4000/api`

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' \
  -c cookies.txt

curl -X GET http://localhost:4000/api/medicines \
  -b cookies.txt
```

### Appendix D: Verification Commands

```bash
# Backend
cd backend
npm run build      # TypeScript compilation
npm run test:api   # API tests
npm run test:unit  # Unit tests

# Frontend
cd client
npm test           # Unit tests
npm run build      # Production build
npm run test:e2e   # E2E tests

# Database
npm run db:reset   # Reset and seed database
npm run db:migrate # Run migrations
```

---

**Document End**

**Revision History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 21, 2026 | Development Team | Initial SRS creation |

---

**Approval Sign-Off:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
