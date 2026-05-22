## [8.47.0] - 2026-05-22

### Changed

- Replaced all inline SVG icons across the app with a consistent Heroicons-based set (fill style for action icons, stroke style for navigation and structural icons).
- Sidebar project collapse/expand now uses closed/open folder icons (`iconProjectClosed` / `iconProjectOpen`) instead of chevrons.
- New Project button in sidebar now uses a folder-plus icon (`iconProjectAdd`).
- Converted `iconClose`, `iconPlus`, and `iconSearch` from stroke to fill style.
- Updated `iconCode` to curly-brace style, `iconMoreVertical` to evenodd fill-rule, `iconSettings` to updated gear path, `iconRefresh` to updated arrow-path, `iconFocus` to arrows-pointing-out.
- Added new icon helpers: `iconMoreHorizontal`, `iconRefresh`, `iconEye`, `iconSplit`, `iconCopy`, `iconHistory`, `iconProjectClosed`, `iconProjectOpen`, `iconProjectAdd`, `iconFocus`, `iconWarning`, `iconSave`, `iconUpdate`.
- `iconCopy` uses a 20×20 viewBox (Heroicons mini) via new `iconFillSvg20` helper.
- Updated inline search icon in app-modals template to fill style.

### Technical adjustments

- Added `iconFillSvg20` helper in `source/js/icons.ts` for 20×20 viewBox icons.
- Propagated versioned resources to `support/8.47.0` and recalculated resource manifest hashes.
- Single-file build delivery (`index.html`) preserved.

### Validation

- Local verify pipeline run (`npm run verify`) with typecheck, checks, build/validate tmp and build/validate final.
