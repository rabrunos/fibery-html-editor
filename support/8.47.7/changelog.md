## [8.47.7] - 2026-05-22

### Added

- Settings now shows a discrete About section at the bottom with the current editor version and clickable links to the GitHub profile and repository.

### Technical adjustments

- Added `settingsAboutTitle`, `settingsVersion`, `settingsGithubProfile`, and `settingsRepository` i18n keys to both EN and PT-BR.
- Added `settingsAppVersionValue` DOM ref; `openSettings()` populates it with `APP_VERSION` on open.
- Rewrote `docs/public-forum-launch.md` in English for community forum publication, removing MVP wording.
- Versioned resources propagated to `support/8.47.7`; resource manifest hashes recalculated.
- Single-file build delivery (`index.html`) preserved.
