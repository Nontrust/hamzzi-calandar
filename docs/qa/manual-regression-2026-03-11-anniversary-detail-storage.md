# Manual QA - Anniversary Detail Storage (2026-03-11)

## Scope
- change: `enhance-anniversary-detail-storage`
- areas:
  - anniversary create/update/delete
  - month-view detail metadata
  - external holiday API failure fallback behavior
  - legacy data compatibility defaults

## Environment
- mobile-web app running on local web
- functions tests executed via vitest
- local postgres migration `0007_anniversary_details.sql` applied

## Checklist

1. Create with details
- action: create anniversary with category/note/reminder/rule fields
- expected: record is saved and listed with all detailed values

2. Update with partial patch
- action: update first item note/category/reminder only
- expected: patched fields change, non-patched fields stay unchanged

3. Month-view metadata
- action: open month containing anniversary and click target date
- expected: selected-day panel shows category, reminder, note summary, and rule type

4. Validation - invalid rules
- action: send invalid monthly rule value (>12)
- expected: API responds with `VALIDATION_ERROR`

5. Legacy compatibility
- action: fetch old rows without new columns (or simulate with defaults)
- expected: response includes defaults (`category=anniversary`, `note=''`, `reminderEnabled=false`, `reminderOffsetDays=0`)

6. External holiday API failure
- action: disconnect holiday API path or force fetch failure
- expected: holiday load may fail, but internal anniversary data still loads and month-view remains usable

## Result
- status: pass (manual checks + automated tests)
- notes:
  - reminder offset guard (`0..365`) and rule guard are enforced
  - month-view metadata is included for anniversary items
