## [8.46.1] - 2026-05-22

### Fixed

- Update App can now be applied from any currently edited page by targeting the real app page ID (`state.appPageId`) instead of requiring the app page to be open in the editor.
- Fixed Update App apply-button behavior so it stays visible when an update is available and is only disabled with explicit reason/tooltips when apply preconditions are not met.
- Reduced technical remote-verification noise in the main header by moving non-actionable statuses (cache-checking/cache-confirmed/page-loaded) to log-first behavior.
- Header retry/check action now appears only when user action is actually needed (verification failure/conflict), while preserving conflict safety and save blocking where applicable.

### Technical adjustments

- Update apply flow now loads and backs up the app page snapshot directly via API before saving remote HTML, without replacing `state.current` when another page is being edited.
- Added explicit post-apply reload confirmation flow (reload now vs later) with local draft preservation before reload prompt when unsaved edits exist.
- Added safe fallback prompt to open the app page when direct update apply cannot proceed due target load/save limitations.
- Propagated versioned resources to `support/8.46.1` and recalculated resource manifest hashes.
- Single-file build delivery (`index.html`) preserved.

### Validation

- Local verify pipeline run (`npm run verify`) with typecheck, checks, build/validate tmp and build/validate final.
- `git diff --check` run with no whitespace/hunk format issues.
- Fibery runtime checks remain manual.

## [8.46.0] - 2026-05-22

### Added

- Added a central icon helper module for shared SVG rendering in the legacy shared-scope TypeScript runtime.

### Fixed

- Replaced critical character-based close controls (`&times;`) in externalized modal templates with centralized SVG close icons.
- Replaced the text-based submenu arrow in the page context menu with a standardized chevron SVG icon.

### Technical adjustments

- Standardized first-batch duplicated icon rendering in TypeScript flows (`more` menu glyphs and project chevrons) using central icon helpers.
- Propagated cached resources to `support/8.46.0` with updated template markup and recalculated SHA-256 hashes.
- Preserved the single-file build delivery model (`index.html`) and existing runtime behavior.

### Validation

- Local verify pipeline run (`npm run verify`) with typecheck, checks, build/validate tmp and build/validate final.
- `git diff --check` run with no whitespace/hunk format issues.
- Fibery runtime checks remain manual.

## [8.45.2] - 2026-05-22

### Fixed

- Fixed external resource encoding/hash mismatches that were blocking required resource downloads in Fibery runtime.
- Removed UTF-8 BOM, CRLF line endings, mojibake markers, and literal CR marker artifacts from cached CSS/template resources.
- Preserved externalized templates, Tailwind safelist behavior, and Settings access to changelog/about-version flow.

### Technical adjustments

- Strengthened local text-resource checks to fail on BOM, CRLF, mojibake signatures, and literal CR markers.
- Updated resource-hash verification to match runtime `fetch(...).text()` decoding behavior.
- Propagated resources to `support/8.45.2` and recalculated manifest hashes.
- Vite single-file build preserved.

### Validation

- Local verify pipeline run (`npm run verify`) with typecheck, checks, build/validate tmp and build/validate final.
- Fibery runtime checks remain manual.

## [8.45.1] - 2026-05-22

### Fixed

- Restored modal sizing and spacing after externalized template injection by adding an inline Tailwind safelist for cached modal utilities.
- Restored visibility/stability of comparison and recovery modal action areas.
- Added permanent Settings access to version/changelog details even when no update is available.
- Marked startup update check network calls as automatic in API usage telemetry.

### Technical adjustments

- Kept modal templates externalized in cached resources and propagated resources to support/8.45.1.
- Kept Update App explicit and removed visual local-backups list from Update App modal.

### Validation

- Local verify pipeline run (`npm run verify`) with typecheck, checks, build/validate tmp and build/validate final.
- Fibery runtime checks remain manual.
