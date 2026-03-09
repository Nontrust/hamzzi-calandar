## Context

This change finalizes UI consistency across top page sections and stabilizes account popup behavior. The implementation already exists in code; this design records the intended structure and constraints.

## Goals / Non-Goals

**Goals:**
- Keep one shared hero style pattern across key app pages.
- Define explicit mark visibility control for home hero.
- Keep account popup consistently visible above page content.

**Non-Goals:**
- Backend/API changes
- New routes or auth model changes
- Database schema changes

## Decisions

1. Reuse a shared hero pattern
- Decision: reuse `homeHero` style pattern in home/anniversaries/schedule/settings.
- Rationale: lower style drift and make later adjustments centralized.

2. Add home-specific mark style override
- Decision: keep `homeHeroMark` common and add `homeHeroMarkMain` for home-only tuning.
- Rationale: home needs larger brand emphasis without breaking other pages.

3. Fix popup stacking by header-first layering
- Decision: raise `shellHeader` z-index/elevation and keep `shellContent` lower.
- Rationale: prevent account popup from being hidden behind content cards.

## Risks / Trade-offs

- [Risk] Shared hero style may still need per-page spacing tweaks -> Mitigation: allow small page-level override only when required.
- [Risk] Mark source asset internal padding can reduce visual size -> Mitigation: provide dedicated size overrides.
- [Risk] Layering changes can affect future overlays -> Mitigation: keep explicit popup test IDs and manual UI check.