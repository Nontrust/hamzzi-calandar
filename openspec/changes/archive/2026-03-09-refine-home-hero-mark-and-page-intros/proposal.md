## Why

Recent UI polish work changed hero composition, account popup behavior, and logo visibility rules. We need a recorded spec so future UI edits keep the same intent and avoid regressions.

## What Changes

- Apply a shared top hero description block to home, anniversaries, schedule, and settings pages.
- Switch home hero logo asset from emblem to mark and define dedicated visibility styles.
- Add account badge popup showing name, login id, role label, and logout action.
- Ensure popup layering is above content cards by explicit header/content z-index rules.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `mobile-ui-shell`: top hero pattern, account popup behavior, layering rules
- `hamjji-brand-lexicon`: page-top copy tone and wording consistency

## Impact

- Affected files:
  - `apps/mobile-web/app/(app)/_layout.tsx`
  - `apps/mobile-web/app/(app)/index.tsx`
  - `apps/mobile-web/app/(app)/anniversaries.tsx`
  - `apps/mobile-web/app/(app)/schedule.tsx`
  - `apps/mobile-web/app/(app)/settings.tsx`
  - `apps/mobile-web/app/src/ui/appStyles.ts`
- Asset usage update: `openspec/statics/nahamzzi_mark.png`
- Out of scope: API/DB/auth model changes