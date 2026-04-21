# Auth Module

## Inputs
- `POST /api/auth/login`
  - Body: `{ "username": string, "password": string }`
- `POST /api/auth/logout`
  - Requires an authenticated session cookie
- `GET /api/auth/me`
  - Requires an authenticated session cookie

## Outputs
- Login and `me` return `{ data: { user: { id, username } } }`
- Logout returns `{ data: { success: true } }`
- Validation, auth, and credential failures return the shared error envelope

## Test Coverage
- Request validation for login payloads
- Happy-path login, logout, and current-user retrieval
- Unauthorized access protection for protected endpoints
- Invalid credential failure handling
- Auth service unit coverage for seed creation and credential checks
