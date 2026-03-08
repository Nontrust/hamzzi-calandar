# Manual Regression Log (2026-03-08)

## Scope
- Sidebar menu navigation (Home/Anniversaries/Schedule/Settings)
- Mobile drawer (hamburger open/close and navigation)
- Feature separation smoke check
  - Anniversary page CRUD action buttons
  - Schedule page timeline load/reload
  - Settings page permission requests and logout

## Result
- Sidebar navigation: PASS
- Mobile drawer interaction: PASS
- Header context by route: PASS
- Anniversary page action flow: PASS (smoke)
- Schedule page timeline flow: PASS (smoke)
- Settings page permission/account flow: PASS (smoke)

## Notes
- Functional smoke checks were verified after menu-based page split.
- Route guard automated test remains passing (`tests/routeGuards.test.ts`).
