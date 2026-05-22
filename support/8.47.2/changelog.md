## [8.47.2] - 2026-05-22

### Fixed

- Update App: Apply button, toast, and Settings shortcut now appear reliably when a newer remote version is available, regardless of the internal status field state. Visibility decisions now use a direct semver comparison (`hasApplicableRemoteUpdate()`) instead of exclusively relying on `state.update.status === 'available'`.

### Technical adjustments

- Propagated versioned resources to `support/8.47.2` and recalculated resource manifest hashes.
- Single-file build delivery (`index.html`) preserved.
- Fibery runtime tests remain manual.
