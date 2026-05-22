## [8.45.0] - 2026-05-22

### Added

* Toast notification (`#updateAvailableToast`) in bottom-right corner: shown automatically when a new version is available after the startup check. Buttons: "Later" (dismisses toast) and "Open" (dismisses and opens the Update App modal).
* "Updates" section in Settings modal: checkbox "Check for updates on startup" (default on), status text, "Check again" button, and "Update App" button (visible only when update is available).
* `source/js/update-startup-check.ts` — new module: `maybeCheckUpdateOnStartup()` (called at the end of init, non-blocking), `syncUpdateAvailableToast()` (shows/hides toast based on update state), `hideUpdateAvailableToast()`, `renderSettingsUpdateSection()` (syncs checkbox, status, and buttons in Settings).
* New i18n keys in both locales: `updateAvailableToastTitle`, `updateToastLater`, `updateToastOpen`, `settingsUpdatesTitle`, `settingsUpdateCheckOnStartup`.
* `updateCheckOnStartup` added to `LocalStorageKeys` interface (`source/types/storage.ts`) and to `LS` map (`source/js/storage-keys.ts`), key `fibery-pro-editor.updateCheckOnStartup`. Default: enabled (stored value `'0'` disables it).

### Changed

* Update App access moved from page header button to Settings modal — `#updateAppBtn` removed from `layout-main.html`; Settings now exposes the full update flow.
* Update App modal compacted: "Local update backups" section removed from the visible UI. Internal backup/rollback infrastructure (`createUpdateBackupRecord`, `restoreUpdateBackupByKey`) is preserved and still runs on every update.
* Confirmation message (`updateApplyConfirmMessage`) updated in both locales to mention that unsaved local drafts are preserved in the browser before the update is applied.
* `renderUpdateAppPanel()` now calls `syncUpdateAvailableToast()` and `renderSettingsUpdateSection()` instead of `renderUpdateBackupList()`.
* `openUpdateAppModal()` no longer calls `loadUpdateBackupList()` (removed from the visible UI).
* `applyI18n()` now calls `renderSettingsUpdateSection()` to keep the Settings update section in sync after language changes.
* `maybeCheckUpdateOnStartup()` called at end of `init()` — non-blocking (`void`), after page load.

### Technical adjustments

* `source/js/events-bindings.ts`: removed `updateAppBtn` listener; guarded `updateBackupsBox` listener with `if (els.updateBackupsBox)`; added listeners for `updateToastLaterBtn`, `updateToastOpenBtn`, `settingsCheckUpdateBtn`, `settingsOpenUpdateBtn`, and `updateCheckOnStartupToggle`.
* `source/js/dom-refs.ts`: removed `updateAppBtn` ref; added `updateAvailableToast`, `updateAvailableToastVersion`, `updateToastLaterBtn`, `updateToastOpenBtn`, `updateCheckOnStartupToggle`, `settingsUpdateStatus`, `settingsCheckUpdateBtn`, `settingsOpenUpdateBtn`.
* `source/types/legacy-globals.d.ts`: added declarations for `maybeCheckUpdateOnStartup`, `syncUpdateAvailableToast`, `hideUpdateAvailableToast`, `renderSettingsUpdateSection`.
* `scripts/validate-build.mjs`: `updateAppBtn` removed from `ESSENTIAL_IDS`; `updateAvailableToast` added.
* `support/8.45.0/resources-manifest.json`: all required resources updated to version `8.45.0` with new sha256 hashes.

### Notes

* The startup check is non-blocking and runs after the page is loaded/opened. It uses the existing `checkRemoteUpdateInfo()` function, which updates `state.update.status` and triggers `syncUpdateAvailableToast()` via `renderUpdateAppPanel()`.
* The toast is dismissable without acting (Later) or opens the update modal directly (Open). It does not reappear until the next startup check finds an update.
* The `updateBackupsBox` element is absent from the 8.45.0 template; `els.updateBackupsBox` returns null and `renderUpdateBackupList()` exits harmlessly via its existing null guard.

### Validation

* `npm run verify`

---
