## 1. Auth Data Model and Seed

- [x] 1.1 Add `users` and `sessions` schema with indexes (user identifier, session expiry timestamp) (Verify: tables/indexes are created after migration).
- [x] 1.2 Add demo account seed flow and allow hashed password storage only (Verify: demo users are created and no plain password is stored).
- [x] 1.3 Define session expiry/revocation state transitions at the store level (Verify: session state changes as expected on expiry/logout).

## 2. Server Auth API and Guard

- [x] 2.1 Implement login/logout/session-validate handlers (Verify: login issues session and logout invalidates it).
- [x] 2.2 Connect AUTH error codes (`AUTH_REQUIRED`, `AUTH_INVALID_CREDENTIALS`, `AUTH_SESSION_EXPIRED`) to common response envelope (Verify: each failure case returns the correct code).
- [x] 2.3 Apply auth check before protected business logic (Verify: unauthenticated requests are blocked before logic execution).
- [x] 2.4 Record auth failure/denied events in audit logs (Verify: request ID and failure reason are logged).

## 3. Client Login and Role Flow

- [x] 3.1 Implement login screen (ID/password) and auth state store (Verify: valid credentials login and session persists).
- [x] 3.2 Apply protected route/screen control with login redirect (Verify: direct access to protected screen redirects to login).
- [x] 3.3 Update role-selection flow to use logged-in user context (Verify: role selection works after login and resets on logout).
- [x] 3.4 Separate external calendar sync failure notice from auth failure notice (Verify: messages/recovery actions are distinct).

## 4. Tests and Docs

- [x] 4.1 Add server tests for login success/failure, session expiry, and logout token reuse block (Verify: AUTH-related tests pass).
- [x] 4.2 Add integration tests for protected API unauthenticated block and authenticated success flow (Verify: guard order and success flow are validated).
- [x] 4.3 Update operations docs with demo seed steps, auth error codes, and incident response steps (Verify: local/ops response is possible using docs only).
