# AGENTS.md — Fibery HTML Editor

## Purpose

Instructions for Codex or any coding agent working inside this repository.

Respond to the user in **Portuguese (Brazil)**.

Fibery HTML Editor is an internal operational editor for creating, editing, previewing, organizing, and maintaining HTML pages hosted by Fibery. It runs as a Custom HTML Page inside Fibery. It is not a generic public HTML editor and has no owned backend.

## Read First

Before changing code, read:

* `AGENTS.md`
* `source/config/manifest.json`
* `source/template/index.template.html`
* relevant files under `source/html/`, `source/css/`, `source/js/`
* `CHANGELOG.md`
* relevant GitHub Issues for the requested task
* `index.html` (generated deploy artifact)
* `docs/fibery-src/page-api.js`
* `docs/fibery-src/editor.js`

If the task references an issue number, read that issue first. If the task touches page load/save/delete/validation/admin/preview/Fibery permissions, inspect both Fibery reference files before editing.

`docs/roadmap.md` is not required. The roadmap is managed through GitHub Issues.

## Delivery Model

The app is still delivered to Fibery as a **single `index.html` file**.

The repository now uses a modular development architecture:

* source of truth for development: `source/`
* final deploy artifact for Fibery: `index.html`
* build is deterministic and local, with no required backend

Never change this delivery model without explicit direction.

## Modular Source Layout

Canonical editing paths:

* `source/template/index.template.html` — top-level HTML template and placeholders
* `source/html/` — body/layout/modals/panels sections
* `source/css/` — style modules
* `source/js/` — JavaScript modules by functional area
* `source/config/manifest.json` — version and deterministic assembly order

### JavaScript module naming rules

* Use descriptive names that reflect functional area; no numeric prefixes (e.g., `preview-base.js`, not `04-preview-base.js`).
* The concatenation order is defined exclusively by the `js` array in `source/config/manifest.json`; do not rely on filename order.
* `const` declaration order in the manifest must satisfy lexical dependencies: `app-version.js` → `i18n-base.js` → `i18n-en.js` / `i18n-pt-br.js` → `storage-keys.js` → `dom-refs.js` → `app-state.js`. All `function` declarations are hoisted within the IIFE and are order-independent.

`index.html` is generated from these files.

## Build and Validation

Primary commands:

* `node scripts/build.mjs --out .tmp/index.generated.html`
* `node scripts/validate-build.mjs .tmp/index.generated.html --baseline index.html`
* `node scripts/build.mjs --out index.html`
* `node scripts/validate-build.mjs index.html`

Optional npm shortcuts (if using npm scripts):

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

Rules:

* run temporary generation + validation before replacing `index.html` when doing structural/build work;
* build must fail on unresolved placeholders, empty critical blocks, version inconsistency, or invalid structure;
* validation must include JS syntax check of generated inline script;
* do not commit if build/validation fails.

## `index.html` Editing Policy

Default rule: **do not edit `index.html` directly**.

Normal flow:

1. edit modular source files in `source/`;
2. build generated output;
3. validate generated output;
4. update `index.html` from build output.

Direct edits to `index.html` are allowed only in strong/emergency cases, with explicit justification in the final response. Any direct edit must be reconciled back into `source/` immediately.

## Roadmap Through GitHub Issues

GitHub Issues are the project roadmap.

Use issues to understand priorities, planned work, dependencies, scope and acceptance criteria.

Expected labels include:

* `type: epic`, `type: feature`, `type: bug`, `type: research`, `type: polish`, `type: docs`
* `priority: p0`, `priority: p1`, `priority: p2`, `priority: p3`
* `area: preview`, `area: autosave-history`, `area: appearance`, `area: editor`, `area: command-palette`, `area: snippets`, `area: diagnostics`, `area: update-app`, `area: snapshots`, `area: mobile`, `area: icons`, `area: docs`, `area: sync`, `area: i18n`
* `status: roadmap`, `status: needs-research`, `status: needs-fibery-test`, `status: blocked`
* `size: s`, `size: m`, `size: l`, `size: xl`

Rules:

* do not create, close, relabel, or edit issues unless the prompt asks;
* do not duplicate existing issues;
* when implementing planned work, reference the relevant issue in the final response;
* if implementation reveals follow-up work, suggest a new issue instead of hiding scope creep;
* bugs found during implementation should be reported separately when they are outside the requested scope.

## Fibery Reference Files

Official/reference Fibery files live under:

* `docs/fibery-src/page-api.js`
* `docs/fibery-src/editor.js`

Treat them as copied reference/source-of-truth from Fibery, not as project-owned code.

Rules:

* do not edit them unless explicitly requested;
* do not invent endpoints, SDKs, response formats or persistence structures;
* do not recreate official helpers for theoretical cleanliness;
* if the current integration works, do not rewrite it just because it could look cleaner.

## Architecture and Persistence

The app is a single browser frontend.

Use **IndexedDB** for structured local data:

* page metadata;
* manual history;
* autosaves;
* snapshots;
* local projects;
* page-to-project links.

Use **localStorage** only for simple preferences:

* language;
* last page/open-last-page;
* sidebar;
* split;
* editor/preview mode;
* history/autosave limits;
* theme preferences.

Do not move structured data into localStorage. Do not delete local data without a clear migration or explicit confirmation.

## UX Rules

Critical rules:

* sidebar must not blink;
* selection must not reset unnecessarily;
* preview must not reload unnecessarily;
* layout must remain responsive;
* local state must not be lost;
* updates should be incremental;
* context menus must remain consistent;
* approved features must not be removed;
* icons must not be reworked unless the task is specifically about icons.

Prefer small, reversible patches and previous-vs-next state comparisons.

## Versioning

Version is centralized in `source/config/manifest.json`.

Every build must propagate the same version to the final `index.html` in all required places:

```html
<meta name="fibery-html-editor-version" content="x.y.z" />
```

```js
const APP_VERSION = 'x.y.z';
window.FIBERY_HTML_EDITOR_VERSION = APP_VERSION;
document.documentElement.dataset.appVersion = APP_VERSION;
```

If `package.json` has a `version` field, keep it aligned with `source/config/manifest.json` in the same change. The manifest remains the canonical app version; `package.json.version` is metadata for tooling/readability and must not become a separate source of truth.

Use:

* patch: bug fix, safe cleanup, small UX refinement;
* minor: user-facing feature or structural addition;
* major: breaking architecture or data-model change.

## Changelog

`CHANGELOG.md` is part of the release/update discipline.

Every implementation, correction, relevant refactor, user-facing change, technical adjustment, or documentation change that matters for future users or maintainers must update `CHANGELOG.md` in the same patch.

Rules:

* keep `CHANGELOG.md` in English;
* do not add an introductory header, explanation, or format guide inside `CHANGELOG.md`;
* the file must start directly with the latest version entry;
* add new entries at the top of the file;
* every entry must use `## [x.y.z] - YYYY-MM-DD`;
* if generated `index.html` version changes, the top changelog entry must match that version;
* summarize objectively what changed, including behavior, technical adjustments, validation notes, and known limitations when useful;
* keep entries concise and useful for update decisions.

Allowed section headings inside each version:

```md
## [x.y.z] - YYYY-MM-DD

### Added

### Fixed

### Technical adjustments

### Visual changes

### Validation

### Notes
```

Use only the subsections that have content.

## Current Important Product Concepts

Preserve these concepts unless the task explicitly changes them:

* Fibery is changed only by explicit user actions such as Save or confirmed update.
* Autosave is local only and must not call Fibery APIs.
* Manual history and autosaves are separate concepts.
* Restore from history/autosave should apply to the editor and mark dirty, not auto-save to Fibery unless explicitly requested.
* Preview work should avoid API calls while typing.
* Live preview is local and may use the real preview only when content matches the saved baseline.
* Tailwind browser/CDN, when used, must be injected only into the generated local preview iframe document and never into the editor content saved to Fibery.
* Local projects are browser organization, not Fibery entities.
* Renaming/moving/pinning/archiving pages is local organization and should not count as content editing.
* Fibery does not provide reliable updated/modified metadata for this app; external-change detection must use content signatures/hashes from title, description and HTML.

## Validation

Before finishing, validate what is possible locally:

* build success (`scripts/build.mjs`);
* generated HTML validation success (`scripts/validate-build.mjs`);
* JavaScript syntax;
* `getElementById` references;
* event listeners;
* i18n keys;
* version metadata consistency;
* changelog entry, when applicable;
* IndexedDB/localStorage impact;
* static sidebar/preview/menu regressions.

Some checks require real Fibery runtime and usually cannot be completed locally:

* login/session;
* permissions;
* `/api/ai-answer/pages/...`;
* Custom HTML Page runtime;
* Fibery-hosted `tailwind.css`;
* real preview;
* real save/load/delete/admin behavior.

Separate local validation from manual Fibery tests. Never claim Fibery runtime validation unless actually performed there.

## Commit and Push

Never commit or push unless the prompt explicitly allows it.

If commit/push is allowed:

* validate first;
* do not commit or push if validation fails;
* run `git status`;
* include only relevant files;
* include `index.html` whenever modular source files changed;
* include `CHANGELOG.md` when the change is implementation, correction, technical adjustment, UX adjustment, or documentation relevant to users/maintainers;
* use a concise commit message;
* never force-push;
* report commit and push status.

If commit/push is forbidden, leave changes uncommitted and provide commands the user can run later if requested.

## Final Response

Respond in Portuguese (Brazil). Focus on what changed for the user/frontend, not only code internals.

Use this structure:

1. O que foi implementado.
2. O que foi corrigido.
3. O que mudou visualmente.
4. Validações realizadas.
5. Testes manuais necessários no Fibery.
6. Changelog atualizado.
7. Commit/push realizado.
8. Próxima versão sugerida.

Mention internals only when useful. Prefer explaining behavior in buttons, menus, sidebar, preview, editor, search, projects, settings, autosave or history.
