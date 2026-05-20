## [8.14.4] - 2026-05-20

### Fixed

* Fixed preview mode synchronization after cached-open Fibery verification confirms that Fibery and Last Saved Cache match.
* Kept local preview after choosing Cache/Draft in the mandatory comparator until a manual save confirms that version in Fibery.
* Preserved real preview after choosing Fibery in the comparator and after successful manual save when editor content matches the confirmed original.
* Removed local/real preview technical labels from the preview header; the header now stays neutral and page-focused.

### Technical adjustments

* Added discrete preview mode change diagnostics in the log: "Showing local preview" and "Showing real preview", without repeating while the mode is unchanged.
* Bumped app version metadata to `8.14.4` via manifest and package.json, and regenerated the single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.14.3] - 2026-05-20

### Fixed

* **Bug 1 — Last Saved Cache premature update**: `savePageContentCacheSafe` was called unconditionally during remote verification, updating the cache with Fibery content even before the user chose. Cache write (and `cacheSignature` update) is now inside the `if (sameAsCache)` branch only. On conflict, the cache is never touched until the user picks "Load Fibery version".
* **Bug 2 — "Load Fibery version" button broken**: `loadFiberyVersionFromConflict` called `openConfirm()` which rendered behind the conflict modal (z-[60] < z-[80]), making the confirm dialog invisible and blocking the action. The intermediate `openConfirm` step is removed; choosing "Load Fibery version" now applies directly.
* **Bug 3 — Mandatory comparator**: Removed X button, "Continue editing" button, and ESC/backdrop close handlers from the conflict modal. The modal is now truly modal — the user must pick one of the two explicit actions before proceeding.
* **Bug 4 — "Compare versions" header button**: The header button is now hidden while the conflict modal is already open, preventing duplicate UI. It reappears if the conflict persists and the modal is closed.
* **Bug 5 — Simplified comparator layout**: Removed the three-column (Base/Local/Fibery) layout and replaced with two columns: "Cache version" (no local edits) or "Local draft" (with local edits), and "Fibery version". Removed tab switcher; single diff always shows local/cache vs Fibery.

### Technical adjustments

* `cached-page-open-flow.js`: moved `savePageContentCacheSafe` and `state.cachedPageOpen.cacheSignature` assignment inside `if (sameAsCache)` only.
* `conflict-resolution-flow.js`: removed `openConfirm` from `loadFiberyVersionFromConflict`; removed `renderConflictDiffTabs`, `switchConflictDiffTab`, `continueEditingFromConflict`; simplified `renderConflictCompareContent` to 2-column (local vs remote); updated `openConflictCompareModal` with dynamic button label (`conflictKeepCache` / `conflictKeepDraft`); `syncConflictCompareButtonState` now hides the header button when the modal is visible.
* `modal-conflict-compare.html`: removed `closeConflictCompareBtn`, `conflictBaseColumn`, `conflictContinueEditingBtn`, tab buttons; grid changed from `lg:grid-cols-3` to `lg:grid-cols-2`.
* `dom-refs.js`: removed `closeConflictCompareBtn`, `conflictBaseColumn`, `conflictDiffTabRemote`, `conflictDiffTabLocal`, `conflictContinueEditingBtn`.
* `events-bindings.js`: removed handlers for deleted elements; ESC key now skips (does not close) the conflict modal.
* i18n (EN + PT-BR): added `conflictCacheLabel`, `conflictDraftLabel`, `conflictKeepCache`, `conflictKeepDraft`; removed `conflictBaseLabel`, `conflictLocalLabel`, `conflictKeepLocal`, `conflictContinueEditing`, `conflictDiffTabRemote`, `conflictDiffTabLocal`, `conflictLoadRemoteConfirmTitle`, `conflictLoadRemoteConfirmMessage`, `conflictLoadRemoteConfirmButton`.
* Bumped app version metadata to `8.14.3` via manifest and package.json, and regenerated single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.14.2] - 2026-05-20

### Fixed

* Mandatory conflict comparison modal now opens automatically whenever the Fibery original differs from the Last Saved Cache, regardless of whether the user has local edits. The comparator is always required; the user must choose explicitly.
* Removed automatic remote apply (`stale-applied`) when remote differs from cache and no local edit is detected. Remote is never applied without explicit user decision.
* Explicit choice flow: when the remote candidate differs from cache, the user chooses between "Keep local version" (maintains cache/editor content, save will publish to Fibery) or "Load Fibery version" (applies remote, updates baseline and Last Saved Cache).
* Last Saved Cache is updated with the remote only when the user chooses "Load Fibery version". "Keep local version" never updates Last Saved Cache with the remote.
* Preview rule after choosing "Load Fibery version": `syncPreviewMode` is now called instead of `renderLocalPreview`, so real preview is used when the editor equals the confirmed Fibery original.
* Preview rule after choosing "Keep local version" (no-edit case): `conflict-resolved-local` status now forces local preview in `shouldForceLocalPreviewForCachedOpen` until a manual save confirms the local version to Fibery.
* Guard in `loadFiberyVersionFromConflict`: draft is only saved before loading Fibery when the user actually has local edits (`hasUserEditedSinceCachedOpen`). In the no-edit case, `saveCurrentDraftNow` was skipped to avoid deleting a pre-existing draft (draft snapshot == baseline triggers deletion in `shouldPersistDraftSnapshot`).

### Technical adjustments

* `startCachedPageRemoteVerification` in `cached-page-open-flow.js`: removed the `!userEdited` branch that applied remote silently; both cases now set `remoteStatus = 'conflict'`, store `remoteCandidate`, and call `openConflictCompareModal()`.
* `shouldForceLocalPreviewForCachedOpen` in `save-availability-state.js`: added `conflict-resolved-local` to the forced-local-preview conditions.
* `loadFiberyVersionFromConflict` in `conflict-resolution-flow.js`: replaced `renderLocalPreview()` with `syncPreviewMode({ immediate: true })`.
* Updated i18n strings (EN and PT-BR) for conflict/divergence scenario: subtitle, status, column labels, button, and log entries updated to be generic (not tied to "while editing" or "my edits").
* Bumped app version metadata to `8.14.2` via manifest and package.json, and regenerated single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.14.1] - 2026-05-20

### Fixed

* Added ~2-second delay before automatic remote verification after cached page open, preventing API spam when navigating rapidly between cached pages and giving the user time to start editing before conflict detection fires.
* Cancellation of pending remote verification timer when navigating to another page, creating a new page, showing blank page, or completing a save — stale timers no longer fire.
* Moved `savePageContentCacheSafe` inside the active-request guard so stale remote results from a previous page can no longer update the Last Saved Cache for a page the user has already left.
* Added `state.dirty` as a conservative fast-path in `hasUserEditedSinceCachedOpen`: if the dirty flag is set for any reason, conflict is preferred over silent remote apply.
* Added discrete `log()` output when a stale remote verification is skipped and when the conflict/apply decision is made.
* Added emergency draft in `localStorage` (`fibery-pro-editor.emergencyDraft`) written synchronously on `pagehide`, so F5/reload can no longer silently lose unsaved edits even if the async IndexedDB write did not complete before the page unloaded.
* On startup, `applyEmergencyDraftIfRelevant` merges the emergency draft into IndexedDB drafts when it is fresher than the stored draft and post-dates the last save, making draft recovery reliable after F5/reload.
* `markCurrentPageRemoteVerified` now cancels any pending verification timer immediately, preventing a redundant API call after a manual save resolves the page state.

### Technical adjustments

* Added `cancelCachedPageRemoteVerification` and `scheduleCachedPageRemoteVerification` helpers to manage the deferred verification timer via `state.cachedPageOpen.remoteVerificationTimer`.
* `resetCachedPageOpenState` calls `cancelCachedPageRemoteVerification` so all navigation paths (page switch, new page, show blank) safely cancel the timer.
* `retryCurrentPageRemoteVerification` (manual "Try verify again") calls `cancelCachedPageRemoteVerification` before issuing a new immediate request.
* `clearEmergencyDraftForPage` is called after a successful `savePage` to ensure the emergency draft for the saved page is discarded immediately.
* `writeEmergencyDraft` and `clearEmergencyDraft` functions added to `drafts-autosave.js`; `applyEmergencyDraftIfRelevant` is called once in `init()` after `loadDraftsCache()`.
* Bumped app version metadata to `8.14.1` via manifest and regenerated single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.14.0] - 2026-05-19

### Added

* Added guided conflict comparison modal (`modal-conflict-compare.html`) showing three snapshots side by side: Base (from Last Saved Cache), My Edits (current editor content), and Fibery version (detected during background verification).
* Added `conflict-resolution-flow.js` with three resolution actions when a cached-open conflict is detected:
  * **Keep my edits**: marks conflict as resolved-local, unblocks save (next save will overwrite Fibery version), clears remote candidate.
  * **Load Fibery version**: saves local edits as a draft first, then applies the remote candidate into the editor, updates Last Saved Cache, and marks verification as confirmed.
  * **Continue editing**: closes the modal without changing conflict state; save remains blocked.
* Added "Compare versions" button in the page header, visible only when `remoteStatus === 'conflict'`, to open the comparison modal.
* Added two diff tabs inside the conflict modal (Fibery changes / My changes) to switch the Monaco diff view between base→remote and base→local comparisons.

### Fixed

* Save is correctly unblocked after resolving conflict via "Keep my edits" (`conflict-resolved-local` status returns empty blocked reason).
* Local edits are preserved as a draft before applying the remote Fibery version ("Load Fibery version" action), making them recoverable via draft recovery.
* ESC key and backdrop click close the conflict modal without changing conflict state (same as "Continue editing").

### Technical adjustments

* Added `conflict-resolved-local` as a non-blocking resolved status recognized by `saveBlockedReasonForCurrentPage()`.
* Added `syncConflictCompareButtonState()` called from `syncSaveAvailabilityState()` to keep the header "Compare versions" button in sync with conflict state.
* Added separate Monaco diff editor state (`state.conflictCompare`) for the conflict modal, isolated from the draft recovery diff editor state.
* Bumped app version metadata to `8.14.0` via manifest and regenerated single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.13.0] - 2026-05-19

### Added

* Added cache-first page open flow backed by Last Saved Cache (`pageContentCache`): pages now open immediately from local cache when available, while Fibery verification runs in background.
* Added dedicated cached-open remote verification state with request-id protection to ignore delayed results from previously opened pages.
* Added save availability guard states for cached opens (`checking`, `failed`, `conflict`) with explicit save-button blocking and localized status/tooltip messages.

### Fixed

* Preserved local edits while verifying cached opens: remote updates are auto-applied only when no local edits happened since cached baseline.
* Prevented remote verification from overwriting the wrong page when results arrive late after navigation.
* Kept draft recovery/manual history behavior intact: cached open, verification, and remote auto-apply do not create manual history entries.

### Technical adjustments

* Added `source/js/save-availability-state.js` and `source/js/cached-page-open-flow.js` and wired them through the manifest build order.
* Updated `loadPage` to use cache-aware open logic with background `API.loadPage` verification and non-blocking fallback to direct remote load when cache is missing.
* Updated save/update flows to mark current page as Fibery-confirmed after successful remote save operations.
* Updated local preview selection/status handling so cached-open verification keeps local preview first and avoids forcing real preview before verification completes.
* Bumped app version metadata to `8.13.0` via manifest and regenerated single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.12.0] - 2026-05-19

### Added

* Added a dedicated Last Saved Cache store (`pageContentCache`) in IndexedDB to persist the latest full page content confirmed by Fibery (`title`, `description`, `html`, `signature`, timestamps, and source).
* Added cache helpers for normalize/save/read/delete flows to keep Last Saved Cache isolated from manual history, drafts, and page metadata.

### Fixed

* Updated Last Saved Cache automatically after successful remote page load (`fibery-load`), manual save/rename (`fibery-save`), update apply (`update-apply`), and update rollback (`update-rollback`).
* Removed Last Saved Cache entries after successful page deletion.
* Ensured cache write/delete failures do not block primary load/save/delete/update flows (non-blocking with discreet log output).

### Technical adjustments

* Bumped IndexedDB schema version to `5` and created `pageContentCache` with dedicated indexes.
* Preserved manual history behavior (`versions`, `kind: manual`) and draft recovery behavior (`drafts`) without adding cache records to history UI.
* Bumped app version metadata to `8.12.0` via manifest and regenerated single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.11.0] - 2026-05-19

### Fixed

* Simplified autosave to keep only one current local draft per page in IndexedDB `drafts` (replace-by-key behavior).
* Stopped creating new autosave timeline entries (`kind: autosave`) in IndexedDB `versions`.
* Removed autosave-history rendering from the History modal; history now shows only intentional manual saves (`kind: manual`).
* Kept draft recovery and diff flow focused on the current draft snapshot, without autosave-version list restore paths.
* Updated unsaved-transition discard/save flows to manage only draft state (no autosave-history cleanup side effects).

### Technical adjustments

* Removed autosave-history specific settings/UI wiring (`autosaveLimitSelect`, `LS.autosaveLimit`, autosave history limit handlers).
* Removed autosave-history write/trim helpers from runtime paths (`saveAutosaveHistory`, autosave-history enforcement, signature cleanup calls).
* Kept legacy `kind: autosave` records untouched and hidden from current UI/restore flows.
* Preserved manual history, update backups/rollback records, and `versions` store usage for non-autosave features.
* Bumped app version metadata to `8.11.0` via manifest and regenerated single-file deploy artifact.

### Validation

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

## [8.10.2] - 2026-05-19

### Fixed

* Reduced automatic Fibery API pressure across sidebar, search, external sync, and post-save flows.
* Disabled automatic external-sync polling by default for this hotfix while keeping the manual "Check now" action available.
* Stopped sidebar remote auto-refresh from running every 60 seconds; sidebar now renders from local cache unless the user manually refreshes.
* Avoided remote sidebar refresh cascades after save, rename, pin, archive, project moves, update apply, and rollback when local cache can be updated directly.
* Prevented duplicate page loads when the same page is already open or an identical load is already in flight.

### Technical adjustments

* Added lightweight in-memory API usage diagnostics for Fibery API calls, Fibery preview loads, and GitHub update fetches.
* Added a simple global cooldown/slow-mode budget for automatic Fibery calls.
* Search modals now render empty queries from local cache and cache non-empty remote query results briefly.
* Preview real iframe loads are recorded and continue to avoid reloading when the URL is unchanged.

### Validation

* Local build and validation pass for temporary and final generated artifacts.

## [8.10.1] - 2026-05-19

### Fixed

* Reduced aggressive external-sync API usage that could trigger perceived slowdowns during page switches, page loads, and save flows.
* Removed immediate post-load and post-save external sync checks to avoid duplicate `API.loadPage` calls right after the same page was already loaded/saved.
* Prevented repeated fast re-scheduling of external sync checks from transition/visibility/baseline hooks.

### Technical adjustments

* Increased automatic external-sync interval from 60 seconds to a conservative 300 seconds.
* Added a minimum automatic cooldown (180 seconds) for non-manual checks.
* Expanded pause conditions for external-sync checks to include `state.sidebar.loading`, in addition to loading/saving/hidden-tab/modal/update safeguards.
* Kept single-timer recurring `setTimeout` scheduling and explicit check-in-progress protection.
* Added a manual header action (`Check now`) to run a safe on-demand external sync check when the user explicitly requests it.
* Added discreet diagnostics logs for started/completed/skipped checks (debug-visible) and failures (always logged).

### Validation

* Local build and validation pass for temporary and final generated artifacts.

## [8.10.0] - 2026-05-19

### Added

* Added periodic external-change detection for the current Fibery page using content signatures from title, description, and HTML.
* Added local external-sync state to keep the detected remote candidate snapshot/signature ready for upcoming conflict/compare flows.
* Added a discreet in-header external-change notice with signature-scoped dismiss action.

### Fixed

* Prevented repeated external-change warnings for the same remote signature after detection or dismiss.
* Prevented stale external warnings from leaking across page changes, baseline resets, save, discard, or blank/welcome transitions.

### Technical adjustments

* Added safe polling with recurring `setTimeout` (60s) and pause conditions for hidden tab, page loading, saving, unsaved-transition modal, update operations, and active modal blocking states.
* Compared remote page snapshots only against the local baseline signature, without relying on remote timestamp/revision metadata.
* Kept detection non-destructive: no automatic editor overwrite, no automatic Fibery save, no manual history writes, no modal spam.

### Validation

* Local build and validation pass for temporary and final generated artifacts.

## [8.9.1] - 2026-05-19

### Fixed

* Fixed false-positive unsaved-transition prompts after choosing "Discard changes" and navigating to another page without new edits.
* Fixed post-discard state consistency so discarded content does not reappear as pending unsaved work when switching back and forth between pages.

### Added

* Added a native browser unload warning (`beforeunload`) when there are real local unsaved changes in the current page.

### Technical adjustments

* Centralized unsaved-change detection in a shared real-snapshot check used by both transition guard and unload warning logic.
* Normalized snapshot comparisons for line-ending differences to avoid unsaved false positives caused by editor normalization.
* Synced current snapshot, baseline, and dirty state after load/save/discard transition points to prevent stale transition state leakage.

### Validation

* Local build and validation pass for temporary and final generated artifacts.

## [8.9.0] - 2026-05-19

### Added

* Added a centralized unsaved-transition guard to protect page/context switches when local editor content differs from the current baseline snapshot.
* Added an explicit 4-action modal for unsaved transitions with: Save and open, Keep local draft, Discard changes, and Cancel.
* Added protected navigation wiring for sidebar page open, project page open, global search open, welcome search open, New page, and brand/home transitions.

### Fixed

* Prevented accidental context switches with unsaved local edits by requiring an explicit decision before leaving the current page.
* Ensured "Keep local draft" flushes/persists the local draft before switching without saving to Fibery.
* Ensured "Discard changes" removes the related local draft and clears matching autosave history signature to prevent recovery from reappearing for discarded content.
* Ensured "Save and open" only proceeds when the existing Fibery save flow succeeds; on save failure, the user stays on the current page.
* Ensured cancel keeps the user on the current page without forcing navigation or preview reset.

### Technical adjustments

* Added `source/js/unsaved-transition-guard.js` and `source/html/modal-unsaved-transition.html`.
* Updated `savePage` to return explicit success/failure so guarded transitions can decide whether navigation may continue.
* Updated manifest assembly order and version metadata propagation to `8.9.0`.

### Validation

* Local build and validation pass for temporary and final generated artifacts.

## [8.8.0] - 2026-05-19

### Added

* Added a local "Update backups" section in the Update App modal, listing update-backup records for the current app/editor page.
* Added per-backup restore actions with clear labels, local date/time, version transition (from/to), local-backup badge, and optional page title.
* Added a dedicated rollback flow that restores app HTML from a selected local update backup with explicit confirmation.
* Added a required safety backup step that creates a new local backup of the current installed version before rollback save.

### Fixed

* Blocked rollback when admin permission is missing, current page is not the app page, backup is missing, or backup validation fails.
* Blocked rollback when the selected backup is invalid/corrupted (missing required metadata/version assignments or not recognized as Fibery HTML Editor HTML).
* Blocked rollback if creating the pre-rollback current-version backup fails.

### Technical adjustments

* Added modular sources `source/js/update-backup-list.js` and `source/js/update-rollback-flow.js`.
* Reused existing save path (`API.savePage`) to apply rollback to Fibery and then refreshed baseline/state/preview/sidebar via the existing flow.
* Added rollback/update concurrency guards so remote-check/apply/rollback operations do not overlap unsafely.
* Updated manifest/module ordering and version metadata propagation to `8.8.0`.

### Validation

* Local build and validation pass for temporary and final outputs, including inline JS syntax checks.

### Notes

* Rollback availability depends on local update backups stored in this browser (IndexedDB `versions` store).

## [8.7.1] - 2026-05-18

### Technical adjustments

* Refactored JavaScript source from 10 large numeric-prefixed files into 52 focused modules with descriptive names (e.g., `preview-base.js`, `drafts-autosave.js`, `sidebar-pages-render.js`).
* Eliminated numeric file prefixes; concatenation order is now controlled exclusively by `source/config/manifest.json`.
* Each new module covers a single functional area: version/config, i18n, state, utils, snapshot, update flow, IndexedDB core, page meta, drafts, history, editor, workspace, preview, page CRUD, projects, sidebar, search, context menus, UI modes, settings, event bindings, and lifecycle init.
* Updated `AGENTS.md` to document the descriptive naming rule and the manifest-controlled ordering convention.
* Aligned `package.json` metadata version with the canonical app version in `source/config/manifest.json`.
* Documented that `package.json.version`, when present, must stay aligned with the manifest while the manifest remains the canonical source of truth.
* No behavior changes; app functionality is preserved exactly as in `8.7.0`.

## [8.7.0] - 2026-05-18

### Added

* Added a complete modular source architecture under `source/` for HTML sections, CSS modules, JavaScript modules, and build manifest/version metadata.
* Added a deterministic build script (`scripts/build.mjs`) to compile modular source into a single deployable `index.html`.
* Added a dedicated build validation script (`scripts/validate-build.mjs`) with structural, version, placeholder, DOM ID, and inline JavaScript syntax checks.
* Added a temporary build output flow (`.tmp/index.generated.html`) to validate generated output before replacing the final `index.html`.

### Technical adjustments

* Promoted `index.html` to generated artifact status while preserving Fibery single-file delivery.
* Centralized version control through `source/config/manifest.json` and synchronized generated metadata fields and `APP_VERSION` assignments.
* Preserved approved external dependencies (`tailwind.css` and Monaco CDN loader) in generated output.
* Added npm script shortcuts in `package.json` for temporary build, validation, and final regeneration flows.
* Added `.tmp/` to `.gitignore` to avoid committing temporary validation artifacts.
* Updated `AGENTS.md` to document the modular workflow, artifact policy, build/validation requirements, and commit expectations.

### Notes

* Functional behavior from `8.6.0` is preserved; this release focuses on development architecture and build safety.
* Fibery delivery remains a single `index.html` file.

## [8.6.0] - 2026-05-18

### Added

* Added a safe "Apply update" action in the Update App panel when a newer remote version is available.
* Added explicit confirmation before applying remote app HTML to the current Fibery app page.
* Added local update backup creation before save, stored as `update-backup` records in IndexedDB.

### Technical adjustments

* Added conservative remote HTML validation before update apply, including:
  * required app version metadata;
  * `APP_VERSION` declaration;
  * required version assignment lines;
  * remote version must be greater than local version.
* Kept update apply flow on the existing save path (`API.savePage`) without adding new endpoints.
* Added guarded apply-state handling to avoid double submit while checking/applying updates.
* Updated app version metadata and `APP_VERSION` to `8.6.0`.

### Notes

* This version still does not apply updates automatically.
* This version still requires explicit user confirmation before saving.
* Full rollback flow is not implemented yet in this release.

## [8.5.1] - 2026-05-18

### Added

* Added visual highlighting for installed and latest versions inside the Update App panel.
* Added semantic badges in the "What changed" section to identify installed, latest, current, outdated, and newer versions.
* Added status-driven color emphasis for version values (green when up to date, red alert when outdated).

### Technical adjustments

* Replaced plain-text changelog display with a minimal safe renderer for:
  * `## [x.y.z] - YYYY-MM-DD` version headings;
  * `###` section headings;
  * list items (`-` and `*`);
  * paragraphs.
* Kept changelog rendering safe by creating DOM nodes with text content only, without executing remote HTML/JS.
* Updated app version metadata and `APP_VERSION` to `8.5.1`.

### Notes

* This version still does not apply updates automatically.
* This version still does not save anything to Fibery during update checks.
* This version still does not modify user pages.

## [8.5.0] - 2026-05-18

### Added

* Added an Update App panel with remote version checking through GitHub.
* Added display of the installed version and the available remote version.
* Added simple `x.y.z` semver comparison for update status.
* Added a “What changed” section that loads the remote `CHANGELOG.md`.
* Added status states for up-to-date, update available, and verification failure.

### Technical adjustments

* Centralized raw GitHub URLs for easier future maintenance.
* Remote version is parsed from the `fibery-html-editor-version` metadata in `index.html`.
* Remote changelog is displayed safely as text, without executing remote HTML or JavaScript.
* Updated app version metadata and `APP_VERSION` to `8.5.0`.

### Notes

* This version does not apply updates automatically.
* This version does not save anything to Fibery during update checks.
* This version does not modify user pages.

## [8.4.1] - 2026-05-18

### Fixed

* Polished intelligent preview to avoid unnecessary iframe rebuilds when the effective preview content did not change.
* Adjusted internal local preview status to stop using PoC wording in the main flow.
* Preserved the safe return to real preview when content matches the saved/loaded baseline.

### Technical adjustments

* Added a dedicated local preview render signature based on HTML, `baseHref`, and Tailwind usage.
* Renamed the internal preview message source to `fibery-html-editor/local-preview`.
* Kept iframe message filtering by `requestId` and `contentWindow`.
* Kept app version metadata and `APP_VERSION` in sync.

### Validation

* Based on the recent `Polish intelligent preview` commit.

## [8.4.0] - 2026-05-18

### Added

* Added automatic switching between real preview and local preview.
* Added local live preview with debounce, without saving to Fibery while typing.
* Consolidated local preview around `srcdoc + base + tailwind.css`.
* Added Tailwind browser/CDN support only inside the local preview iframe to improve visualization of new/arbitrary classes while editing.
* Kept real preview as the reference when current content matches the saved/loaded baseline.
* Manual save returns the preview to the real Fibery preview.

### Fixed

* Removed the manual PoC flow from the main user experience.
* Preserved autosave, history, and recovery flows without turning local preview into a real save.
* Avoided preview/save API calls while the user types.

### Technical adjustments

* The generated local iframe HTML is kept separate from the editor HTML.
* Tailwind browser/CDN is injected only into the temporary iframe document.
* Saved Fibery content remains only the user’s original HTML.
* Real/local preview decisions use a reliable baseline instead of only `dirty` state.

### Visual changes

* The preview area now responds automatically to local edits.
* The preview menu remains simple, without diagnostic PoC buttons in the normal flow.

## [8.3.1] - 2026-05-18

### Added

* Added diagnostic modes to investigate CSS loading in local preview:

  * Blob with `tailwind.css`;
  * Blob with `/tailwind.css`;
  * `srcdoc` with `tailwind.css`;
  * `srcdoc` with `/tailwind.css`;
  * `srcdoc + base`.
* Added instrumentation to detect CSS load, failure, missing stylesheet, and timeout in local preview.
* Added logs/status messages to help testing in the real Fibery runtime.

### Fixed

* Confirmed through real testing that Blob was not the most reliable strategy for `tailwind.css`.
* Confirmed that `/tailwind.css` is not reliable as a global path.
* Identified `srcdoc + base + tailwind.css` as the most robust strategy for the current environment.

### Technical adjustments

* Added `<base href="...">` to the local document to improve relative path resolution.
* Added filtered `postMessage` diagnostics from the local preview iframe.

## [8.3.0] - 2026-05-18

### Added

* Added the first local preview PoC to the preview menu.
* Added explicit actions to test:

  * `Local preview PoC (tailwind.css)`;
  * `Local preview PoC (/tailwind.css)`;
  * return to real preview.
* The PoC renders the current editor HTML inside the iframe without saving to Fibery.

### Fixed

* Added Blob URL lifecycle cleanup with `URL.revokeObjectURL`.
* Kept real preview as the default through `/api/ai-answer/pages/{id}/view`.

### Technical adjustments

* Local preview PoC does not call `API.savePage`.
* Local preview PoC does not create manual history.
* Local preview PoC does not directly interfere with autosave/drafts.

## [8.2.4] - 2026-05-18

### Fixed

* Polished autosave, recovery, and diff flows after separating local autosave from manual history.
* Improved recovery behavior to avoid repeatedly showing the large modal after the user keeps the current version.
* Adjusted cleanup of obsolete drafts/autosaves after manual save when there is no real difference.
* Reinforced that restore applies to the editor, marks content as unsaved, and does not save automatically to Fibery.

### Technical adjustments

* Kept manual history and autosaves separated.
* Preserved autosave as local-only, without Fibery API calls.
* Reinforced baseline comparison to decide whether there is a relevant difference.

## [8.2.x] - 2026-05-17

### Added

* Added the local autosave foundation.
* Added local draft recovery.
* Added diff before restoring drafts/autosaves.
* Separated manual history from autosaves.
* Added a dedicated autosave limit.
* Added a discreet button to reopen recovery comparison.

### Fixed

* Fixed PT-BR text and broken encoding/symbol issues.
* Adjusted flows to ensure autosave does not save to Fibery.
* Adjusted restore so it marks content as dirty without saving automatically.

### Technical adjustments

* Autosaves, manual history, and local metadata use IndexedDB.
* Simple preferences remain in localStorage.
* Manual history now represents intentional saves.

## [8.1.x] - 2026-05-17

### Fixed

* Adjusted search cleanup.
* Fixed three-dot menus.
* Fixed the “Move to project” submenu so it stays open during interaction.
* Refined sidebar, context menu, and local organization behavior.

### Technical adjustments

* Kept project organization as a local feature, without creating Fibery entities.
* Preserved current selection and reduced unnecessary UI resets.

## [Before 8.1.x]

### Added

* Created the Fibery HTML Editor foundation as a single-file Custom HTML Page.
* Added loading/listing of Fibery HTML pages.
* Added editing of title, description, and HTML.
* Added manual save to Fibery.
* Added page deletion when allowed.
* Added real preview using the Fibery view endpoint.
* Added sidebar with pages and local organization.
* Added code editor with Monaco and textarea fallback.
* Added basic local preferences such as language, last page, layout, and editor/preview panel mode.

### Technical adjustments

* Kept the architecture as a single frontend with no owned backend.
* Used available Fibery APIs/behavior.
* Used IndexedDB/localStorage for local app persistence.
