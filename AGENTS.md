# AGENTS.md — Fibery HTML Editor

## Purpose

Instructions for Codex or any coding agent working inside this repository.

Respond to the user in **Portuguese (Brazil)**.

Fibery HTML Editor is an internal operational editor for creating, editing, previewing, organizing, and maintaining HTML pages hosted by Fibery. It runs as a Custom HTML Page inside Fibery. It is not a generic public HTML editor and has no owned backend.

## Read first

Before changing code, read:

- `AGENTS.md`
- `index.html`
- relevant GitHub Issues for the requested task
- `docs/fibery-src/page-api.js`
- `docs/fibery-src/editor.js`

If the task references an issue number, read that issue first. If the task touches page load/save/delete/validation/admin/preview/Fibery permissions, inspect both Fibery reference files before editing.

`docs/roadmap.md` is not required. The roadmap is managed through GitHub Issues.

## Roadmap through GitHub Issues

GitHub Issues are the project roadmap.

Use issues to understand priorities, planned work, dependencies, scope and acceptance criteria.

Expected labels include:

- `type: epic`, `type: feature`, `type: bug`, `type: research`, `type: polish`, `type: docs`
- `priority: p0`, `priority: p1`, `priority: p2`, `priority: p3`
- `area: preview`, `area: autosave-history`, `area: appearance`, `area: editor`, `area: command-palette`, `area: snippets`, `area: diagnostics`, `area: update-app`, `area: snapshots`, `area: mobile`, `area: icons`, `area: docs`
- `status: roadmap`, `status: needs-research`, `status: needs-fibery-test`, `status: blocked`
- `size: s`, `size: m`, `size: l`, `size: xl`

Rules:

- do not create, close, relabel, or edit issues unless the prompt asks;
- do not duplicate existing issues;
- when implementing planned work, reference the relevant issue in the final response;
- if implementation reveals follow-up work, suggest a new issue instead of hiding scope creep;
- bugs found during implementation should be reported separately when they are outside the requested scope.

## Main HTML file

`index.html` contains the app UI, state, sidebar, editor, preview, menus, local persistence and operational flows.

When modifying it:

- preserve the approved UX;
- avoid large rewrites;
- make the smallest safe patch;
- keep compatibility with Fibery Custom HTML Page hosting;
- do not add a backend;
- do not require a framework migration or build pipeline;
- do not remove approved features.

## Fibery reference files

Official/reference Fibery files live under:

- `docs/fibery-src/page-api.js`
- `docs/fibery-src/editor.js`

Treat them as copied reference/source-of-truth from Fibery, not as project-owned code.

Rules:

- do not edit them unless explicitly requested;
- do not invent endpoints, SDKs, response formats or persistence structures;
- do not recreate official helpers for theoretical cleanliness;
- if the current integration works, do not rewrite it just because it could look cleaner.

## Architecture and persistence

The app is a single browser frontend.

Use **IndexedDB** for structured local data:

- page metadata;
- manual history;
- autosaves;
- snapshots;
- local projects;
- page-to-project links.

Use **localStorage** only for simple preferences:

- language;
- last page/open-last-page;
- sidebar;
- split;
- editor/preview mode;
- history/autosave limits;
- theme preferences.

Do not move structured data into localStorage. Do not delete local data without a clear migration or explicit confirmation.

## UX rules

Critical rules:

- sidebar must not blink;
- selection must not reset unnecessarily;
- preview must not reload unnecessarily;
- layout must remain responsive;
- local state must not be lost;
- updates should be incremental;
- context menus must remain consistent;
- approved features must not be removed;
- icons must not be reworked unless the task is specifically about icons.

Prefer small, reversible patches and previous-vs-next state comparisons.

## Versioning

Every change to the main app in `index.html` must update:

```html
<meta name="fibery-html-editor-version" content="x.y.z" />
```

```js
const APP_VERSION = 'x.y.z';
window.FIBERY_HTML_EDITOR_VERSION = APP_VERSION;
document.documentElement.dataset.appVersion = APP_VERSION;
```

Derive the next version from the current `index.html`, not from memory.

Use:

- patch: bug fix, safe cleanup, small UX refinement;
- minor: user-facing feature or structural addition;
- major: breaking architecture or data-model change.

## Current important product concepts

Preserve these concepts unless the task explicitly changes them:

- Fibery is changed only by explicit user actions such as Save or confirmed update.
- Autosave is local only and must not call Fibery APIs.
- Manual history and autosaves are separate concepts.
- Restore from history/autosave should apply to the editor and mark dirty, not auto-save to Fibery unless explicitly requested.
- Preview work should avoid API calls while typing.
- Future live preview should be local and may use the real preview only when content matches the saved baseline.
- Local projects are browser organization, not Fibery entities.
- Renaming/moving/pinning/archiving pages is local organization and should not count as content editing.

## Validation

Before finishing, validate what is possible locally:

- JavaScript syntax;
- `getElementById` references;
- event listeners;
- i18n keys;
- version metadata;
- IndexedDB/localStorage impact;
- static sidebar/preview/menu regressions.

Some checks require real Fibery runtime and usually cannot be completed locally:

- login/session;
- permissions;
- `/api/ai-answer/pages/...`;
- Custom HTML Page runtime;
- Fibery-hosted `tailwind.css`;
- real preview;
- real save/load/delete/admin behavior.

Separate local validation from manual Fibery tests. Never claim Fibery runtime validation unless actually performed there.

## Commit and push

Never commit or push unless the prompt explicitly allows it.

If commit/push is allowed:

- validate first;
- do not commit or push if validation fails;
- run `git status`;
- include only relevant files;
- use a concise commit message;
- never force-push;
- report commit and push status.

If commit/push is forbidden, leave changes uncommitted and provide commands the user can run later if requested.

## Final response

Respond in Portuguese (Brazil). Focus on what changed for the user/frontend, not only code internals.

Use this structure:

1. O que foi implementado.
2. O que foi corrigido.
3. O que mudou visualmente.
4. Validações realizadas.
5. Testes manuais necessários no Fibery.
6. Commit/push realizado.
7. Próxima versão sugerida.

Mention internals only when useful. Prefer explaining behavior in buttons, menus, sidebar, preview, editor, search, projects, settings, autosave or history.
