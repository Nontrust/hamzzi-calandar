# Manual QA - Anniversary Detail Storage (2026-03-11)

## Scope
- change: `enhance-anniversary-detail-storage`
- areas:
  - anniversary create/update/delete policy
  - month-view metadata and milestone rendering
  - shared demo-user visibility
  - external API failure fallback behavior

## Environment
- mobile-web app running on local web
- functions tests executed via vitest
- local postgres migrations applied through `0010_relationship_category_and_edit_lock_alignment.sql`

## Checklist

1. Create normal anniversary
- action: create an `anniversary` item with category/note fields
- expected: record is saved and listed

2. Managed category lock
- action: try to create or patch an item with category `birthday` or `relationship`
- expected: API rejects with lock error; UI does not expose those category options

3. Managed item controls
- action: open birthday/relationship rows in anniversaries page
- expected: edit/delete buttons are hidden for managed rows

4. Shared visibility
- action: list anniversaries as `user-a` or `user-b`
- expected: both users' shared birthdays and relationship records are visible together

5. Month-view metadata
- action: open a month containing anniversaries
- expected: anniversary items include category, reminder flag, note summary, and rule type metadata

6. Relationship milestones
- action: open June 2024 and March 2025 month views for `2024-03-23` relationship start date
- expected: `100일` milestone appears in June 2024 and `1주년` appears in March 2025

7. External holiday API failure
- action: force holiday fetch failure
- expected: holiday load may fail, but internal anniversary data still loads and month-view remains usable

## Result
- status: pass (manual checks + automated tests)
- notes:
  - reminder offset guard (`0..365`) and rule guard are enforced
  - `birthday` and `relationship` are managed categories
  - shared demo-user anniversaries are merged in list/month views
