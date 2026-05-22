## [8.47.4] - 2026-05-22

### Fixed

- Update App apply-button visibility now uses a single applicability helper shared by the modal, Settings shortcut, toast, and apply flow.
- Update App keeps the last known remote version visible while a remote check is running, so the apply button no longer disappears because a check temporarily clears state.
- Update App now shows the apply button disabled with a clear reason when a newer remote version exists but the app cannot apply it yet.
- Project header rows in the sidebar can now be clicked to expand or collapse the project; project menus and project pages keep their own click behavior.
- Sidebar remote page refresh is active again while the sidebar is open, stops while closed, and refreshes on open with a 10-second open cooldown.

### Technical adjustments

- Added Update App diagnostics for local/remote version parsing, status, applicability, admin/app-page preconditions, missing apply-button DOM refs, and inconsistent status/version states.
- Sidebar auto-refresh now runs on a 60-second timer and uses remote loads without bypassing automatic API usage guards.
- Opening the sidebar renders local cache immediately, then attempts a remote load without relying on the five-minute sidebar cache TTL.
- Propagated versioned resources to `support/8.47.4` and recalculated resource manifest hashes.
- Single-file build delivery (`index.html`) preserved.

### Validation

- Local verify pipeline run (`npm run verify`) with typecheck, checks, build/validate tmp and build/validate final.
- Fibery runtime tests remain manual.
