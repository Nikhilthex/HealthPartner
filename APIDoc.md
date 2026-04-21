# Health Partner API Documentation

## Overview

This document defines the REST API contracts for Health Partner. It is intended to be used by backend developers, frontend developers, and test authors as the working source of truth for request and response shapes.

## API Standards

### Base URL
- `/api`

### Authentication
- Session-cookie based authentication
- All endpoints require authentication except `POST /api/auth/login`
- Default seeded local credentials for development and tests: `demo` / `demo123`

### Request Content Types
- `application/json` for standard APIs
- `multipart/form-data` for report upload

### Time Formats
- ISO 8601 UTC timestamps for stored events and created/updated timestamps
- `HH:mm` for local medicine schedule times
- IANA timezone names such as `Asia/Kolkata`

### Standard Success Contract

```json
{
  "data": {},
  "meta": {}
}
```

### Standard Error Contract

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      {
        "field": "username",
        "message": "Username is required."
      }
    ]
  }
}
```

## Endpoint Summary

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/logout` | Logout current session |
| GET | `/api/auth/me` | Fetch current user |
| GET | `/api/medicines` | List medicines |
| GET | `/api/medicines/:id` | Get medicine detail |
| POST | `/api/medicines` | Create medicine |
| PUT | `/api/medicines/:id` | Update medicine |
| DELETE | `/api/medicines/:id` | Delete/archive medicine |
| POST | `/api/medicines/:id/intake` | Log medicine intake |
| GET | `/api/alert-settings` | Get alert defaults |
| PUT | `/api/alert-settings` | Update alert defaults |
| GET | `/api/reminders/due` | Get due reminders for popup |
| POST | `/api/reminders/:id/acknowledge` | Mark reminder as seen |
| POST | `/api/reminders/:id/dismiss` | Dismiss reminder |
| POST | `/api/reports/upload` | Upload report file |
| GET | `/api/reports` | List uploaded reports |
| GET | `/api/reports/:id` | Get report metadata/status |
| POST | `/api/reports/:id/analyze` | Start report analysis |
| GET | `/api/reports/:id/analysis` | Get completed analysis |

## Authentication APIs

### POST `/api/auth/login`

Auth Required:
- No

Sample Request Body:
```json
{
  "username": "demo",
  "password": "demo123"
}
```

Sample Success Response `200 OK`:
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

Sample Error Response `401 Unauthorized`:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Username or password is incorrect."
  }
}
```

### POST `/api/auth/logout`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
```json
{
  "data": {
    "success": true
  }
}
```

### GET `/api/auth/me`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
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

## Medicines APIs

### GET `/api/medicines`

Auth Required:
- Yes

Query Parameters:
- `includeInactive` optional boolean

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
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
        },
        {
          "id": 101,
          "slot": "evening",
          "doseTime": "20:00",
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

### GET `/api/medicines/:id`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
```json
{
  "data": {
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
      },
      {
        "id": 101,
        "slot": "evening",
        "doseTime": "20:00",
        "qty": 1,
        "enabled": true
      }
    ],
    "createdAt": "2026-04-20T09:00:00.000Z",
    "updatedAt": "2026-04-20T09:00:00.000Z"
  }
}
```

### POST `/api/medicines`

Auth Required:
- Yes

Sample Request Body:
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

Sample Success Response `201 Created`:
```json
{
  "data": {
    "id": 10,
    "rxName": "Metformin",
    "daysOfSupply": 30,
    "totalAvailableQty": 60,
    "remainingQty": 60,
    "dailyQtyPlanned": 2,
    "estimatedDepletionDate": "2026-05-20",
    "notes": "Take after food",
    "schedules": [
      {
        "id": 100,
        "slot": "morning",
        "doseTime": "08:00",
        "qty": 1,
        "enabled": true
      },
      {
        "id": 101,
        "slot": "evening",
        "doseTime": "20:00",
        "qty": 1,
        "enabled": true
      }
    ],
    "createdAt": "2026-04-20T09:05:00.000Z",
    "updatedAt": "2026-04-20T09:05:00.000Z"
  }
}
```

Sample Validation Error `422 Unprocessable Entity`:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      {
        "field": "schedules",
        "message": "At least one schedule must be enabled."
      }
    ]
  }
}
```

### PUT `/api/medicines/:id`

Auth Required:
- Yes

Sample Request Body:
```json
{
  "rxName": "Metformin XR",
  "daysOfSupply": 45,
  "totalAvailableQty": 90,
  "remainingQty": 44,
  "notes": "Take after dinner",
  "schedules": [
    {
      "slot": "morning",
      "enabled": true,
      "doseTime": "08:30",
      "qty": 1
    },
    {
      "slot": "evening",
      "enabled": true,
      "doseTime": "20:30",
      "qty": 1
    }
  ]
}
```

Sample Success Response `200 OK`:
```json
{
  "data": {
    "id": 10,
    "rxName": "Metformin XR",
    "daysOfSupply": 45,
    "totalAvailableQty": 90,
    "remainingQty": 44,
    "dailyQtyPlanned": 2,
    "estimatedDepletionDate": "2026-05-12",
    "notes": "Take after dinner",
    "schedules": [
      {
        "id": 100,
        "slot": "morning",
        "doseTime": "08:30",
        "qty": 1,
        "enabled": true
      },
      {
        "id": 101,
        "slot": "evening",
        "doseTime": "20:30",
        "qty": 1,
        "enabled": true
      }
    ],
    "updatedAt": "2026-04-20T09:20:00.000Z"
  }
}
```

### DELETE `/api/medicines/:id`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
```json
{
  "data": {
    "success": true,
    "id": 10
  }
}
```

### POST `/api/medicines/:id/intake`

Auth Required:
- Yes

Sample Request Body:
```json
{
  "reminderEventId": 123,
  "qtyTaken": 1,
  "takenAt": "2026-04-20T14:30:00.000Z"
}
```

Sample Success Response `200 OK`:
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

## Alert Settings APIs

### GET `/api/alert-settings`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
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

### PUT `/api/alert-settings`

Auth Required:
- Yes

Sample Request Body:
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

Sample Success Response `200 OK`:
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

## Reminder APIs

### GET `/api/reminders/due`

Auth Required:
- Yes

Query Parameters:
- `now` optional ISO timestamp
- `windowMinutes` optional integer, default `15`

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
```json
{
  "data": [
    {
      "id": 123,
      "medicineId": 10,
      "rxName": "Metformin XR",
      "slot": "evening",
      "alertType": "pre",
      "doseTime": "20:30",
      "qty": 1,
      "scheduledFor": "2026-04-20T14:45:00.000Z",
      "status": "pending",
      "displayMessage": "Reminder: Take 1 dose of Metformin XR at 20:30."
    }
  ],
  "meta": {
    "serverTime": "2026-04-20T14:40:00.000Z",
    "windowMinutes": 15
  }
}
```

### POST `/api/reminders/:id/acknowledge`

Auth Required:
- Yes

Sample Request Body:
```json
{
  "acknowledgedAt": "2026-04-20T14:42:00.000Z"
}
```

Sample Success Response `200 OK`:
```json
{
  "data": {
    "id": 123,
    "status": "shown"
  }
}
```

### POST `/api/reminders/:id/dismiss`

Auth Required:
- Yes

Sample Request Body:
```json
{
  "dismissedAt": "2026-04-20T14:43:00.000Z",
  "reason": "user_dismissed"
}
```

Sample Success Response `200 OK`:
```json
{
  "data": {
    "id": 123,
    "status": "dismissed"
  }
}
```

## Reports APIs

### POST `/api/reports/upload`

Auth Required:
- Yes

Content Type:
- `multipart/form-data`

Sample Request Body:
- Form field `reportFile` with a PDF or image file

Sample Success Response `201 Created`:
```json
{
  "data": {
    "id": 77,
    "originalFilename": "blood-report-april.pdf",
    "mimeType": "application/pdf",
    "fileSize": 248221,
    "analysisStatus": "uploaded",
    "createdAt": "2026-04-20T10:10:00.000Z"
  }
}
```

### GET `/api/reports`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
```json
{
  "data": [
    {
      "id": 77,
      "originalFilename": "blood-report-april.pdf",
      "mimeType": "application/pdf",
      "fileSize": 248221,
      "analysisStatus": "completed",
      "createdAt": "2026-04-20T10:10:00.000Z",
      "updatedAt": "2026-04-20T10:11:10.000Z"
    }
  ]
}
```

### GET `/api/reports/:id`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
```json
{
  "data": {
    "id": 77,
    "originalFilename": "blood-report-april.pdf",
    "mimeType": "application/pdf",
    "fileSize": 248221,
    "analysisStatus": "processing",
    "createdAt": "2026-04-20T10:10:00.000Z",
    "updatedAt": "2026-04-20T10:10:30.000Z"
  }
}
```

### POST `/api/reports/:id/analyze`

Auth Required:
- Yes

Sample Request Body:
```json
{
  "analysisMode": "sync"
}
```

Sample Success Response `200 OK`:
```json
{
  "data": {
    "reportId": 77,
    "analysisStatus": "completed",
    "analysis": {
      "reportId": 77,
      "summaryLayman": "Your report suggests that your blood sugar is above the normal range and should be reviewed with your doctor.",
      "risks": [
        "May indicate poor blood sugar control",
        "Could need follow-up testing"
      ],
      "medicineSuggestions": [
        "Discuss diabetic medicine review with your doctor"
      ],
      "vitaminSuggestions": [
        "Ask whether vitamin D and B12 evaluation is needed"
      ],
      "importantNotes": [
        "Do not start or stop any medicine without medical advice"
      ],
      "disclaimer": "This analysis is informational only and not a diagnosis.",
      "aiModel": "gpt-5.4-mini",
      "createdAt": "2026-04-20T10:11:10.000Z"
    }
  }
}
```

### GET `/api/reports/:id/analysis`

Auth Required:
- Yes

Sample Request Body:
- No request body

Sample Success Response `200 OK`:
```json
{
  "data": {
    "reportId": 77,
    "summaryLayman": "Your report suggests that your blood sugar is above the normal range and should be reviewed with your doctor.",
    "risks": [
      "May indicate poor blood sugar control",
      "Could need follow-up testing"
    ],
    "medicineSuggestions": [
      "Discuss diabetic medicine review with your doctor"
    ],
    "vitaminSuggestions": [
      "Ask whether vitamin D and B12 evaluation is needed"
    ],
    "importantNotes": [
      "Do not start or stop any medicine without medical advice"
    ],
    "disclaimer": "This analysis is informational only and not a diagnosis.",
    "aiModel": "gpt-5.4-mini",
    "createdAt": "2026-04-20T10:11:10.000Z"
  }
}
```

## Common Negative Scenarios

### Unauthorized `401`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required."
  }
}
```

### Not Found `404`
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found."
  }
}
```

### Cross-User Access `403`
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource."
  }
}
```

## Testing Guidance

Each endpoint should have tests for:
- success response
- validation errors
- auth protection
- resource ownership checks
- side effects such as reminder rebuilds, reminder status changes, or medicine stock updates
