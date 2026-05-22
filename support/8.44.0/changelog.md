## [8.44.0] - 2026-05-22

### Added

* `source/js/app-template-resources.ts` — new module for cached template HTML injection: `getTemplateResourceKeys`, `validateTemplateHtmlSafety`, `mountTemplateHtml`, `injectCachedTemplate`, `applyCachedTemplateResource`, `ensureCachedTemplateResourcesLoaded`. Injects HTML from `appResources` IndexedDB into `#templateResourcesHost` after validation; idempotent (skips if already loaded with same key).
* `source/html/template-resources-host.html` — `<div id="templateResourcesHost" style="display:contents;">` host element for runtime template injection; replaces the 8 externalized modal HTML files.
* `support/8.44.0/templates/app-modals.html` — versioned external template resource containing the HTML of 8 non-critical modals: settings, search, update-app, history, create-project, draft-recovery, unsaved-transition, and conflict-compare. Registered as `templates/app-modals` in the resource manifest with `kind: "template"`, `required: true`, sha256, and versionated URL.
* `support/8.44.0/resources-manifest.json` — includes `i18n/en`, `i18n/pt-BR`, `css/app-noncritical` (required), `templates/app-modals` (required), and `update/changelog` (not required).
* i18n JSON resources propagated to `support/8.44.0/i18n/` (identical to 8.43.0).
* `css/app-noncritical.css` propagated to `support/8.44.0/css/` (identical to 8.43.0).

### Technical adjustments

* `source/types/resources.ts` — `ResourceKind` union extended with `'template'`.
* `source/js/app-resources-loader.ts` — `RESOURCE_KINDS_VALID` updated to include `'template'`; `RESOURCES_READY_SIGNAL` promise added (resolves when all required resources are cached); `signalResourcesReady()` called in all success and graceful-failure paths; `retryRequiredResourcesDownload()` simplified — removed fire-and-forget i18n/style calls, now only signals `signalResourcesReady()` so `lifecycle-init.ts` handles all post-resource setup uniformly.
* `source/js/dom-refs.ts` — refactored: `const els = { ... }` extracted to `buildEls()` function; `let els: DomRefs = buildEls()` provides valid refs for inline elements at load time (externalized modal refs are null until templates are injected); `initDomRefs()` re-runs `buildEls()` after template injection to populate all refs.
* `source/js/lifecycle-init.ts` — new boot order: `openDb` → `loadCaches` → `ensureRequiredResources` → `RESOURCES_READY_SIGNAL` → `ensureCachedStyleResourcesLoaded` → `ensureCachedTemplateResourcesLoaded` → `initDomRefs` → guard check → `ensureI18nResourcesLoaded` → `applyI18n` → `setupCodeEditor` → `bindEvents` → `setupResize` → `setPanelMode` → `applyEmergencyDraftIfRelevant` → admin check → `setSidebarOpen` → last-page open. Guard added: if `settingsModal` not injected after template load, init returns early with log.
* 8 modal HTML source files removed from the inline manifest `html` array: `modal-settings.html`, `modal-search.html`, `modal-update-app.html`, `modal-history.html`, `modal-create-project.html`, `modal-draft-recovery.html`, `modal-unsaved-transition.html`, `modal-conflict-compare.html`. These source files are preserved on disk as references.
* `scripts/checks.mjs` updated: `'template'` added to `RESOURCE_KINDS_ALLOWED`; new `checkHtmlExternalization()` validates that externalized HTML files are absent from the inline manifest and that required inline HTML files and `template-resources-host.html` remain; template safety check validates no `<script>` tags or inline event handlers in the template file.
* `scripts/validate-build.mjs` updated: `updateAppModal`, `historyModal`, `draftRecoveryModal` removed from `ESSENTIAL_IDS` (now externalized); `templateResourcesHost` added to `ESSENTIAL_IDS`; `ensureCachedTemplateResourcesLoaded` added to `RESOURCE_BOOTSTRAP_SYMBOLS`; ID diff tolerance increased to accommodate externalization.
* Vite single-file build preserved; deploy artifact remains a single `index.html`.
* Fibery runtime tests remain manual.

### Notes

* On first run with no cache, the overlay downloads all required resources together (i18n, css, templates). After download, CSS and templates are injected automatically and the full UI becomes available.
* On subsequent runs with cache, templates are injected in ~1ms from IndexedDB before `initDomRefs()` runs — zero visible delay.
* The inline HTML covers all boot-critical elements: full layout, sidebar, editor, preview, panel-log, panel-resources-boot, context menus, and confirm modal.

### Validation

* `npm run verify`

---
