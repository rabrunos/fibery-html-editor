## [8.47.5] - 2026-05-22

### Added

- Added a safe diagnostic report copy action in the Log panel for early public feedback.
- Prepared English public forum launch material for Fibery Custom HTML Page users.

### Technical adjustments

- Diagnostic reports include version, language, browser/user agent, viewport/screen size, admin mode, panel/sidebar/preview state, resources state, update state, and recent sanitized log lines.
- Diagnostic reports intentionally exclude page HTML, page title, page description, page IDs, raw storage, cookies, tokens, drafts, and history content.
- Removed MVP wording from the public launch copy and positioned the editor as a Fibery Custom HTML Page in early public testing.
- Propagated versioned resources to `support/8.47.5` and recalculated resource manifest hashes.
- Single-file build delivery (`index.html`) preserved.

### Validation

- Local verify pipeline run (`npm run verify`) with typecheck, checks, build/validate tmp and build/validate final.
- Fibery runtime tests remain manual.
