## [8.47.3] - 2026-05-22

### Fixed

- PT-BR i18n: corrected mojibake in `settingsAboutVersion` — `"Sobre esta vers?o"` → `"Sobre esta versão"` (literal ASCII `?` was stored instead of `ã`).

### Technical adjustments

- Added i18n checks: literal-`?`-substitution patterns in PT-BR values; `data-i18n`/`data-i18n-title` key existence validation against i18n JSON.
- Propagated versioned resources to `support/8.47.3` and recalculated resource manifest hashes.
- Single-file build delivery (`index.html`) preserved.
- Fibery runtime tests remain manual.
