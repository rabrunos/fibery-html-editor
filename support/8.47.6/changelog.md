## [8.47.6] - 2026-05-22

### Fixed

- Settings Update App button now starts the apply flow directly instead of just opening the modal.
- Modal Apply button moved to the footer for consistent visibility; render controls show/hide and disabled state based on update applicability.
- Settings Update App button is now shown disabled with a tooltip reason when an update is detected but cannot be applied yet (e.g. while checking, no admin, app page unavailable).

### Technical adjustments

- `settingsOpenUpdateBtn` handler changed from `openUpdateAppModal()` to `applyRemoteUpdate()`.
- `renderSettingsUpdateSection` now sets `disabled` on `settingsOpenUpdateBtn` based on `canApplyNow`.
- `updateApplyBtn` moved from the status section body to the modal footer, next to the Close button.
- Added `checkUpdateApplyEntrypoint` check in `scripts/checks.mjs` to guard against regression.
- Versioned resources propagated to `support/8.47.6`; resource manifest hashes recalculated.
- Single-file build delivery (`index.html`) preserved.
