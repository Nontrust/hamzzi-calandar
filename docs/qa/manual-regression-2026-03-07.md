# Manual Regression Log (2026-03-07)

## Scope
- Login success/failure
- Route guard and logout redirect
- Role switch after login
- Anniversary create/update/delete
- Permission request flow (biometric/calendar/photo)

## Result
- Login success/failure: PASS
- Route guard and logout redirect: PASS
- Role switch and restore: PASS
- Anniversary CRUD and month timeline refresh: PASS
- Permission request actions and notice update: PASS

## Notes
- Calendar/integration error notice remains distinct from auth failure notice.
- Existing successful timeline state is retained when later API calls fail.
