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
