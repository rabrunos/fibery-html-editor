# AGENTS.md - Fibery HTML Editor

## Purpose

Instructions for Codex and other execution agents working inside this repository.

Respond to the user in **Portuguese (Brazil)**.

Fibery HTML Editor is an internal operational editor for creating, editing, previewing, organizing, and maintaining HTML pages hosted by Fibery. It runs as a Custom HTML Page inside Fibery. It is not a generic public HTML editor and has no owned backend.

## Agent Role

Codex/agent is the repository executor and deep investigator.

Rules:

* investigate before changing files;
* separate hypotheses from confirmed causes;
* prefer small, reversible patches that match existing architecture;
* preserve approved behavior unless the prompt explicitly changes it;
* preserve the app as a single browser frontend delivered to Fibery through generated `index.html`;
* report local validation separately from anything that still requires real Fibery testing.

## Normal Reading Flow

For normal implementation, review, bug fix, or refactor tasks, read only the context needed for the requested scope.

Always read:

* `AGENTS.md`;
* the related GitHub issue, if one is referenced or clearly relevant;
* `source/config/manifest.json`;
* `source/template/index.template.html`;
* relevant files under `source/html/`, `source/css/`, and `source/js/`.

Read when applicable:

* `CHANGELOG.md` when the task changes app/runtime/build behavior, UX, validation, release/update behavior, or app-facing maintenance documentation;
* `index.html` only as generated deploy artifact or baseline comparison;
* `docs/fibery-src/page-api.js` and `docs/fibery-src/editor.js` when touching page load, save, delete, validation, admin behavior, permissions, preview, or Fibery runtime/API behavior.

If the task references an issue number, read that issue before editing. Roadmap and temporary planning state live in GitHub Issues and comments, not in stable instruction files.

`docs/roadmap.md` is not required. The roadmap is managed through GitHub Issues.

## Documentary Boundaries

The repository has separate documentation zones for different actors:

* `AGENTS.md` is for Codex/agents executing work inside the repository.
* `docs/.chat/` is for ChatGPT/orchestration: instructions, prompt templates, planning and review support. Codex must not read or edit this folder in normal app tasks. Access it only when the prompt explicitly asks, or when the task is about governance, ChatGPT instructions, prompt templates, or orchestration.
* `docs/.human/` is for human-facing tools and materials, outside the main app runtime. Codex must not read or edit this folder in normal app tasks. Access it only when the prompt explicitly asks, or when the task is about human tools, test forms, checklists, or test reports.
* `docs/fibery-src/` contains official/reference files copied from Fibery. Read them when relevant; do not edit them unless explicitly requested.

Do not mix orchestration instructions from `docs/.chat/` or human test tooling from `docs/.human/` into normal app implementation unless the prompt makes that scope explicit.

## Delivery Model

The app is still delivered to Fibery as a **single `index.html` file**.

The current development architecture is modular:

* source of truth for development: `source/`;
* final deploy artifact for Fibery: `index.html`;
* deterministic local build with no required backend.

Never change this delivery model without explicit direction.

## Modular Source Layout

Canonical editing paths:

* `source/template/index.template.html` - top-level HTML template and placeholders;
* `source/html/` - body/layout/modals/panels sections;
* `source/css/` - style modules;
* `source/js/` - JavaScript modules by functional area;
* `source/app/main.js` - Vite app entry for the JavaScript bundle;
* `source/config/manifest.json` - version and deterministic assembly order.

### JavaScript Module Rules

* Use descriptive names that reflect functional area; no numeric prefixes for new JS modules.
* Until TypeScript migration lands, the compatibility bundle still loads `source/js/` files through the `js` array in `source/config/manifest.json`; do not rely on filename order.
* `const` declaration order in the manifest must satisfy lexical dependencies: `app-version.js` -> `i18n-base.js` -> `i18n-en.js` / `i18n-pt-br.js` -> `storage-keys.js` -> `dom-refs.js` -> `app-state.js`.
* Current `source/js/` files still share one bundled script scope. Do not convert them to per-file ES module imports piecemeal unless the task is an explicit TypeScript migration.
* Function declarations are hoisted within the generated bundle scope and are order-independent.

`index.html` is generated from these files.

## Current Architecture and Future Transition

Current state:

* `scripts/build.mjs` assembles `index.html` from `source/config/manifest.json`, `source/template/index.template.html`, `source/html/`, and `source/css/`;
* Vite bundles the app JavaScript from `source/app/main.js` through a manifest-backed virtual module in `vite.config.mjs`;
* the generated Vite bundle is injected inline into the final `index.html`;
* `scripts/validate-build.mjs` validates generated HTML and inline JavaScript syntax;
* `source/config/manifest.json` is the canonical version source and still controls compatibility JS order until TypeScript migration replaces that bridge with real imports;
* `package.json` currently exposes the local build/validation npm scripts.

Vite is active for JavaScript bundling. Do not claim TypeScript or `npm run verify` are active unless the repository actually contains them.

Roadmap and execution order live in GitHub Issues. Before suggesting next steps, check open issues and relevant comments.

## Build and Validation

Primary commands:

* `node scripts/build.mjs --out .tmp/index.generated.html`
* `node scripts/validate-build.mjs .tmp/index.generated.html --baseline index.html`
* `node scripts/build.mjs --out index.html`
* `node scripts/validate-build.mjs index.html`

Optional npm shortcuts:

* `npm run build:tmp`
* `npm run validate:tmp`
* `npm run build`
* `npm run validate`

Rules:

* run temporary generation and validation before replacing `index.html` when doing structural/build/runtime work;
* build must fail on unresolved placeholders, empty critical blocks, version inconsistency, or invalid structure;
* validation must include JavaScript syntax check of the generated inline script;
* do not commit app/build changes if applicable validation fails;
* when `npm run verify` exists in the repository, prefer it as the local aggregator while still separating local validation from real Fibery testing.

Pure governance/documentation changes that do not touch app/runtime/build files do not require app build unless the prompt asks for it.

## `index.html` Editing Policy

Default rule: **do not edit `index.html` directly**.

Normal flow:

1. edit modular source files in `source/`;
2. build generated output;
3. validate generated output;
4. update `index.html` from build output.

Direct edits to `index.html` are allowed only in strong/emergency cases, with explicit justification in the final response. Any direct edit must be reconciled back into `source/` immediately.

## Roadmap Through GitHub Issues

GitHub Issues are the project roadmap and dynamic planning surface.

Use issues to understand priorities, planned work, dependencies, scope, and acceptance criteria.

Expected labels include:

* `type: epic`, `type: feature`, `type: bug`, `type: research`, `type: polish`, `type: docs`;
* `priority: p0`, `priority: p1`, `priority: p2`, `priority: p3`;
* `area: preview`, `area: autosave-history`, `area: appearance`, `area: editor`, `area: command-palette`, `area: snippets`, `area: diagnostics`, `area: update-app`, `area: snapshots`, `area: mobile`, `area: icons`, `area: docs`, `area: sync`, `area: i18n`;
* `status: roadmap`, `status: needs-research`, `status: needs-fibery-test`, `status: blocked`;
* `size: s`, `size: m`, `size: l`, `size: xl`.

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
* do not invent endpoints, SDKs, response formats, or persistence structures;
* do not recreate official helpers for theoretical cleanliness;
* if the current integration works, do not rewrite it just because it could look cleaner.

## Architecture and Persistence

The app is a single browser frontend.

Use **IndexedDB** for structured local data:

* page metadata;
* manual history;
* autosaves/drafts;
* snapshots;
* local projects;
* page-to-project links;
* local update backups;
* resource caches when external caching is implemented.

Use **localStorage** only for simple preferences:

* language;
* last page/open-last-page;
* sidebar;
* split;
* editor/preview mode;
* history/autosave limits;
* theme preferences.

Do not move structured data into localStorage. Do not delete local data without a clear migration or explicit confirmation.

## Current Important Product Concepts

Preserve these concepts unless the task explicitly changes them:

* Fibery is changed only by explicit user actions such as Save or confirmed Update App.
* Autosave is local only and must not call Fibery APIs.
* Manual history and autosaves/drafts are separate concepts.
* Restore from history/autosave applies to the editor and marks dirty, without auto-saving to Fibery.
* Preview work should avoid API calls while typing.
* Live preview is local and may use the real preview only when content matches the saved baseline.
* Tailwind browser/CDN, when used, must be injected only into the generated local preview iframe document and never into editor content saved to Fibery.
* Local projects are browser organization, not Fibery entities.
* Renaming, moving, pinning, or archiving pages is local organization and should not count as content editing.
* Fibery does not provide reliable updated/modified metadata for this app; external-change detection must use content signatures/hashes from title, description, and HTML.
* Update App must be explicit, with validation and local backup before saving the new app HTML to Fibery.

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

`CHANGELOG.md` documents meaningful app/runtime/build/UX changes delivered to users and relevant technical maintenance of the app.

Changelog is required for:

* implementation, correction, refactor, build, validation, runtime, release/update, or UX changes that matter to users or maintainers;
* documentation that changes app-facing behavior, release/update procedure, validation procedure, or maintainer operation.

Changelog is not required for:

* planning/status updates that belong in GitHub Issues;
* changes only to internal governance in `AGENTS.md`, `docs/.chat/`, or `docs/.human/`, unless the user explicitly asks for a changelog entry.

Rules when changelog is applicable:

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

## Validation

Before finishing, validate what is possible locally for the files actually changed:

* build success (`scripts/build.mjs`) when app/build files changed;
* generated HTML validation success (`scripts/validate-build.mjs`) when app/build files changed;
* JavaScript syntax when generated inline JS changed;
* `getElementById` references when DOM/JS interactions changed;
* event listeners when event wiring changed;
* i18n keys when user-facing text changed;
* version metadata consistency when version changed;
* changelog entry, when applicable;
* IndexedDB/localStorage impact when persistence changed;
* static sidebar/preview/menu regressions when UI behavior changed.

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

Commit only when the prompt permits it and applicable validation passes. Some project prompts allow commit by default; respect that permission. Do not push unless the user explicitly asks.

Rules:

* run `git status` before editing and before finishing;
* do not commit if applicable validation fails;
* include only relevant files;
* include `index.html` whenever modular source files changed and the build regenerated it;
* include `CHANGELOG.md` only when applicable by the changelog rules above;
* include `package.json` only when version/tooling changes require it;
* never touch or stage pre-existing unrelated changes;
* use a concise commit message;
* never force-push.

If commit/push is forbidden, leave changes uncommitted and report the state clearly.

## Final Response

Respond in Portuguese (Brazil). Focus on what changed for the user/frontend, not only code internals.

Use this structure unless the user requests a more specific one:

1. O que foi implementado.
2. O que foi corrigido.
3. O que mudou visualmente.
4. Validações realizadas.
5. Testes manuais necessários no Fibery.
6. Changelog atualizado.
7. Commit/push realizado.
8. Próxima versão sugerida.

Mention internals only when useful. Prefer explaining behavior in buttons, menus, sidebar, preview, editor, search, projects, settings, autosave, or history.
