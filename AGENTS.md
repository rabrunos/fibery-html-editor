# AGENTS.md — Fibery HTML Editor

## Purpose

This file gives instructions to Codex or any coding agent working inside this repository.

Respond to the user in **Portuguese (Brazil)**.

The project is **Fibery HTML Editor**: an internal operational editor for creating, editing, previewing, organizing, and maintaining HTML pages hosted by Fibery.

It is not a generic HTML editor. Preserve the core Fibery workflow: open existing pages, edit HTML, preview, organize pages into local projects, and keep the experience fluid like a lightweight mix of ChatGPT, Notion, and VSCode.

## Runtime environment

The app runs as a custom HTML page inside Fibery.

Assumptions:

- Fibery hosts the page.
- The app runs inside a Fibery workspace.
- Access depends on workspace/page permissions.
- The app must not assume public exposure.
- The project has no owned backend.
- Use browser capabilities plus Fibery-provided page/API behavior.
- Page loading, listing, saving, deletion, validation, and permissions must respect the official Fibery reference files.

## Files to read first

Before making changes, read:

- `index.html`
- `docs/roadmap.md`
- `docs/fibery-src/page-api.js`
- `docs/fibery-src/editor.js`

If the task touches app behavior, also read the relevant nearby code in `index.html`.

## Main HTML file

`index.html` contains the app UI, state, sidebar, editor, preview, menus, local persistence, and operational flows.

When modifying it:

- preserve the approved visual structure;
- avoid large rewrites;
- make the smallest safe patch;
- keep compatibility with Fibery custom HTML page hosting;
- do not add a backend;
- do not require a framework migration or build pipeline;
- preserve existing UX unless the task explicitly asks otherwise.

## Fibery reference files

Official/reference Fibery files live under:

- `docs/fibery-src/page-api.js`
- `docs/fibery-src/editor.js`

Treat them as copied reference/source-of-truth from the Fibery environment, not as project-owned code.

Rules:

- Do not edit them unless the user explicitly asks.
- Do not recreate their helpers manually for theoretical cleanliness.
- Do not invent endpoints, SDKs, response formats, or persistence structures.
- If the current app already works with Fibery APIs, do not rewrite the integration just because it could look cleaner.
- If a change touches loading, saving, deletion, validation, admin checks, or preview routes, inspect these files first.

## Source of truth order

Use this confidence order:

1. official Fibery reference files;
2. behavior actually tested inside the Fibery workspace;
3. current functional `index.html`;
4. official Fibery documentation;
5. assumptions, only when explicitly labeled as assumptions.

Never invent API behavior.

## Architecture

The app is a single frontend app running in the browser.

Main parts:

- sidebar;
- recent pages;
- local projects;
- page search;
- welcome/blank view;
- HTML code editor;
- iframe preview;
- preview focus mode;
- context menus;
- local settings;
- local version history;
- optional logs;
- local page metadata.

There is no owned backend. Any persistence outside Fibery must use browser storage.

## Local persistence

Use **IndexedDB** for structured local data:

- local version history;
- snapshots;
- local page metadata;
- local projects;
- page-to-project links.

Use **localStorage** for simple preferences:

- language;
- open last page;
- last opened page;
- version/history limits;
- editor/preview split size;
- sidebar open/closed state;
- panel mode.

Do not move structured data from IndexedDB into localStorage. Do not delete local data without clear migration or confirmation.

## UX rules

Preserve the approved UX.

Priorities:

1. UX;
2. stability;
3. fluidity;
4. persistence;
5. performance;
6. visual consistency.

Mandatory rules:

- do not make the sidebar blink;
- do not rebuild lists unnecessarily;
- do not reset selections unnecessarily;
- do not hide/show panels without reason;
- do not reload preview unnecessarily;
- do not lose local state;
- do not break horizontal responsiveness;
- do not remove approved features;
- do not simplify the UI by sacrificing operational flows;
- do not rework icons unless the task is specifically about icons.

Prefer:

- incremental DOM updates;
- previous-vs-next state comparison;
- small helpers;
- predictable functions;
- reversible changes.

Avoid:

- fragile hacks;
- duplicate DOM;
- full list recreation without need;
- unnecessary dependencies;
- global CSS changes that affect sidebar, pages, projects, or preview.

## Versioning

Every implementation that changes the main HTML app must update version metadata in `index.html`.

Required places:

```html
<meta name="fibery-html-editor-version" content="x.y.z" />
```

```js
const APP_VERSION = 'x.y.z';
window.FIBERY_HTML_EDITOR_VERSION = APP_VERSION;
document.documentElement.dataset.appVersion = APP_VERSION;
```

Derive the next version from the current version in `index.html`, not from memory.

Use:

- patch for bug fixes, safe cleanups, and small UX refinements;
- minor for user-facing features or structural changes;
- major only for breaking architecture or data-model changes.

## Page metadata

Page ordering depends on local metadata.

Rules:

- pages edited/saved by this editor may appear above API-only pages;
- pages without local metadata should remain below and preserve API/list order;
- opening a page may update open metadata;
- saving content may update save metadata;
- renaming does not count as relevant content editing;
- moving to project, pinning, or archiving are local organization actions and must not change page content;
- do not confuse local organization with real page editing.

Recommended conceptual fields:

- `lastOpenedAt`
- `lastSavedAt`
- `lastContentEditedAt`
- `lastRenamedAt`
- `pinnedAt`
- `archivedAt`

Not every field must exist immediately, but new work must respect the distinction.

## Permissions and read-only mode

Respect Fibery admin/permission checks.

When the user cannot edit:

- block save;
- block create;
- block delete;
- make editor read-only;
- preserve viewing when possible;
- do not hide permission errors.

Do not create parallel permission systems unless the task explicitly requires it and behavior is validated in Fibery.

## Preview

The preview uses an iframe pointing to the page view route when the page has a saved ID.

Rules:

- avoid unnecessary iframe reloads;
- preserve preview focus mode;
- preserve focus exit UI;
- do not break layout when entering or exiting focus;
- new unsaved pages may have limited/local preview until saved.

## Sidebar

The sidebar is critical. Preserve:

- open/closed state;
- page list;
- projects above recent pages;
- current page selection;
- new page button;
- search button;
- settings button;
- refresh button;
- load more;
- hover with three-dots menus;
- icon alignment;
- consistent item height.

Sidebar updates should be incremental whenever possible.

## Projects

Projects are local browser organization, not Fibery entities.

Rules:

- create, rename, delete projects locally;
- deleting a project must not delete Fibery pages;
- move/remove pages locally;
- preserve links in IndexedDB;
- changing local organization must not alter page content;
- do not treat local projects as Fibery entities unless a future official integration is planned and tested.

## Search

Search must remain fast and operational.

Rules:

- preserve welcome search;
- preserve opening a page from a result;
- preserve opening preview;
- add context menus without breaking primary click behavior;
- debounce queries;
- avoid unnecessary requests.

## History and snapshots

History is local.

Rules:

- store versions in IndexedDB;
- respect the configured version limit;
- allow controlled restore;
- do not depend on a backend;
- do not promise shared history across users/devices;
- treat snapshots as local until an official shared integration exists.

## Editor

The editor uses Monaco when available, with textarea fallback.

Preserve:

- character count;
- copy code;
- import HTML;
- paste and replace;
- select all;
- save;
- dirty/unsaved state;
- safe fallback when Monaco fails;
- read-only mode when permission is missing.

Future triple-editor work must migrate incrementally and preserve existing complete-HTML pages.

## Planned triple editor

Planned direction:

- separate HTML, CSS, and JS;
- allow panels to be individually hidden;
- support horizontal and vertical layouts;
- persist layout and visibility;
- combine HTML/CSS/JS for preview;
- save compatibly with existing Fibery HTML pages;
- avoid breaking existing complete HTML pages.

Recommended sequence:

1. compatible data structure;
2. triple editor UI;
3. combined preview;
4. intelligent import of complete HTML into HTML/CSS/JS.

## Mobile and vertical layout

Planned direction:

- vertical layout for small screens;
- touch-friendly sidebar and menus;
- larger tap targets;
- no desktop regression;
- avoid complex drag-resize on small screens until designed.

## Update App

Updating the app can affect the editor page itself.

Rules:

- clearly detect when the current page is the app/editor page;
- confirm before overwriting critical content;
- use official save behavior;
- do not create new endpoints;
- do not assume deployment format without Fibery testing;
- preserve local backup/snapshot before meaningful update operations.

## Icons

Some SVG/HeroIcons may be partially malformed.

Rules:

- do not replace the icon system unless explicitly requested;
- do not rework all icons as part of unrelated tasks;
- keep current structure until a dedicated icon fix task;
- if icons are fixed later, do it in an isolated, testable version.

## Internationalization

The app supports auto/EN/PT-BR.

Rules:

- new visible strings must be added to i18n maps;
- preserve `data-i18n`, `data-i18n-title`, and `data-i18n-placeholder` where applicable;
- do not mix hardcoded Portuguese/English without reason;
- preserve English fallback.

## Investigation discipline

Investigate before changing code.

Do not assume a proposed hypothesis is correct just because the prompt mentions it.

When fixing bugs:

- reproduce or reason from current code;
- identify the confirmed root cause;
- explain the confirmed cause in the final response;
- treat prompt hints as hypotheses unless evidence confirms them.

Bad approach:

- blindly applying `stopPropagation()` because the prompt mentioned event propagation.

Good approach:

- inspect the event flow, confirm why the submenu closes or does not appear, then apply the smallest fix.

## Commit and push

Never commit or push unless the prompt explicitly allows it.

If commit/push is allowed:

- run validations first;
- do not commit or push if validation fails;
- do not force-push;
- run `git status`;
- include only relevant files;
- use a concise commit message;
- report commit and push status.

If the prompt forbids commit/push, leave changes uncommitted and report what changed.

## Validation

Before finishing, validate what is possible locally:

- JavaScript syntax;
- IDs used by `getElementById`;
- event listeners;
- i18n keys;
- version metadata;
- IndexedDB/localStorage impact;
- sidebar/preview/menu regressions by static or local checks when possible.

Some validations require real Fibery runtime and usually cannot be completed locally:

- login/session;
- workspace permissions;
- `/api/ai-answer/pages/...`;
- custom HTML page runtime;
- Fibery-hosted `tailwind.css`;
- real preview inside Fibery;
- real save/load/delete/admin behavior.

Separate local validations from manual Fibery tests. Never claim Fibery runtime validation unless actually performed there.

## Before changing code

1. Read the current HTML.
2. Read Fibery reference files when the task touches API or integration.
3. Check whether the feature already exists.
4. Avoid duplicate implementations.
5. Define the smallest safe patch.
6. Preserve local state and approved UX.

## After changing code

1. Validate syntax.
2. Review IDs.
3. Review event handlers.
4. Review sidebar impact.
5. Review preview/focus impact.
6. Review localStorage/IndexedDB impact.
7. Review i18n.
8. Update version metadata if `index.html` changed.
9. Document what changed.

## Do not do

Do not:

- invent APIs;
- create a backend;
- replace IndexedDB without explicit decision;
- recreate official helpers;
- edit Fibery reference files as project code;
- remove approved features;
- simplify UI by breaking operational flow;
- turn the app into a generic editor;
- make it public by default;
- add parallel authentication;
- store tokens in code;
- use this document as changelog.

## Final response requirements

Respond to the user in Portuguese (Brazil).

Focus primarily on what changed for the user/frontend, not only code internals.

Use this structure:

1. O que foi implementado.
2. O que foi corrigido.
3. O que mudou visualmente.
4. Validações realizadas.
5. Testes manuais necessários no Fibery.
6. Commit/push realizado.
7. Próxima versão sugerida.

Mention code internals only when useful. Prefer user-facing explanations such as button behavior, menus, sidebar flow, preview behavior, search behavior, editor behavior, project organization, or settings changes.
