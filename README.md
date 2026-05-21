# Fibery HTML Editor

A focused editor for creating, editing, previewing, organizing, and maintaining HTML pages hosted in Fibery.

**Fibery HTML Editor** runs as a **Custom HTML Page** inside Fibery. It is designed for teams that build internal tools, dashboards, documentation pages, and custom HTML interfaces directly in Fibery.

The app is delivered as a single generated `index.html` file, while the source code is developed in a modular structure under `source/`.

## How to use

1. Open [`index.html`](https://raw.githubusercontent.com/rabrunos/fibery-html-editor/main/index.html) from this repository.

2. Copy the full HTML content from the page, or right-click the link and save it locally as an HTML file.

3. Open the Fibery Custom HTML Page editor for your workspace:

   `https://YOUR-WORKSPACE.fibery.io/api/ai-answer/pages/editor.html?id=new`

   Replace `YOUR-WORKSPACE` with your Fibery workspace subdomain.

4. Paste the full HTML content into the new Custom HTML Page.

5. Set a clear title, for example `Fibery HTML Editor`, and save the page.

6. Open the saved page in **View** mode.

7. Bookmark or save that View link wherever it is convenient for your team.

There is no fixed public editor URL yet. Each Fibery workspace hosts its own copy of the editor as a Custom HTML Page.

## Why this exists

Fibery can host powerful custom HTML pages, but editing and maintaining those pages can become difficult as they grow.

Fibery HTML Editor adds a safer and more productive editing experience:

* edit HTML with a real code editor;
* preview changes before saving;
* organize pages locally;
* recover unsaved work;
* compare versions before restoring;
* update the editor itself safely;
* avoid unnecessary Fibery API usage while editing.

The goal is not to replace Fibery. The goal is to make custom HTML pages easier to maintain inside Fibery.

## Key features

### HTML page editor

Create, open, edit, save, and delete Fibery-hosted HTML pages from a dedicated editor interface.

Changes stay local until the user explicitly saves them to Fibery.

### Local-first preview

The editor supports both real Fibery preview and local preview:

* when the editor content matches the confirmed saved version, the app can show the real Fibery preview;
* when the user changes the HTML, the app switches to local preview and renders the current content in the browser.

This means users can get fast visual feedback while editing **without saving on every change** and without repeatedly calling Fibery preview endpoints.

Local preview also tries to support Fibery-style pages by loading Tailwind in the preview document when relevant. If the user’s HTML itself fetches data from Fibery or other APIs, that page behavior may still run inside the preview, but the editor itself does not save or call Fibery just to refresh the preview while typing.

### API-conscious design

A core principle of the project is to avoid unnecessary load on Fibery.

The app reduces API usage through:

* local preview while typing;
* local autosave instead of remote autosave;
* local page cache for faster reopening;
* API usage monitoring;
* explicit save/update actions instead of background writes.

### Local autosave and recovery

Autosave is local-only. It protects work in progress without writing to Fibery.

If the browser reloads, the tab closes, or the user returns later, the app can offer a recovery flow with comparison before restoring a draft.

### Manual history

Manual history is separate from autosave.

It stores versions created by intentional saves, so users can review and restore meaningful checkpoints without mixing them with temporary drafts.

### Local page cache

The app keeps a local copy of the last confirmed saved version of pages.

This helps large pages open faster and gives the editor a reliable baseline for comparison and conflict protection.

### Conflict protection

The editor avoids overwriting Fibery content silently.

When local content, cached content, and the current Fibery version differ, the app guides the user through an explicit comparison and decision flow.

### Local projects

Pages can be organized into local projects in the sidebar.

Projects are browser-local organization only. They do not create Fibery entities and do not modify page content.

### Search and navigation

The app includes page search, recent pages, project navigation, and a clean sidebar for moving quickly between pages.

### Safe app update

The editor can check a remote version of itself from GitHub and apply updates through a protected flow:

* version check;
* remote HTML validation;
* user confirmation;
* local backup before applying;
* Fibery save through the normal save flow;
* recovery/rollback path when available.

## Current stack

* HTML, CSS, and JavaScript.
* Monaco Editor for code editing, with a `textarea` fallback.
* IndexedDB for structured local data.
* localStorage for simple preferences.
* Vite for the internal JavaScript bundle.
* Custom build scripts for the final single-file `index.html`.
* GitHub for source code, changelog, and remote app updates.
* Fibery Custom HTML Page as the runtime environment.

## Architecture

The final app deployed to Fibery is:

* `index.html`

The development source is modular:

* `source/config/manifest.json` — app version and build manifest;
* `source/template/index.template.html` — main HTML template;
* `source/html/` — layout, modals, panels, and menus;
* `source/css/` — CSS modules;
* `source/js/` — application modules;
* `source/app/main.js` — current bundle entry;
* `scripts/build.mjs` — generates the final HTML;
* `scripts/validate-build.mjs` — validates generated HTML.

`index.html` is a generated artifact. Normal development should happen in `source/`, followed by build and validation.

## Local development

Requirements:

* Node.js;
* npm.

Install dependencies:

```bash
npm install
```

Build and validate:

```bash
npm run build:tmp
npm run validate:tmp
npm run build
npm run validate
```

Available scripts:

| Command                | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `npm run build:tmp`    | Generates a temporary build at `.tmp/index.generated.html`. |
| `npm run validate:tmp` | Validates the temporary build.                              |
| `npm run build`        | Generates the final `index.html`.                           |
| `npm run validate`     | Validates the final `index.html`.                           |

## Deploying to Fibery

The generated `index.html` can be copied into the Fibery Custom HTML Page used to host the editor.

The app also includes its own **Update App** flow, which can fetch the remote `index.html`, validate it, create a local backup, and apply the update only after user confirmation.

## Data storage

The editor stores user-side data in the browser.

### IndexedDB

Used for structured data such as:

* page metadata;
* drafts;
* manual history;
* local page cache;
* projects;
* page-to-project links;
* update backups;
* future cached resources.

### localStorage

Used for simple preferences such as:

* language;
* last opened page;
* sidebar state;
* editor/preview mode;
* panel split size;
* history limits.

## Product principles

* **Explicit writes only** — Fibery is changed only when the user chooses to save or apply an update.
* **Respect Fibery API usage** — the editor avoids unnecessary API calls and background writes.
* **Local safety net** — drafts, cache, and history protect user work without replacing Fibery.
* **User-controlled conflict resolution** — conflicting versions should be compared and chosen explicitly.
* **Single-file deployment** — the app should remain easy to install and update as a Fibery Custom HTML Page.
* **No owned backend** — the project should stay frontend-only unless the product direction changes explicitly.

## Roadmap

The roadmap is managed through GitHub Issues. Current priorities are:

| Priority | Area                      | Description                                                                                                                                                    |
| -------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Technical foundation      | Improve the build pipeline, continue the TypeScript migration, and add a stronger local verification command.                                                  |
| P0       | Cached resources          | Reduce the final `index.html` size by moving safe non-executable resources, such as i18n, CSS, templates, and changelog data, into versioned cached resources. |
| P0       | Preview experience        | Continue improving local/real preview behavior, Tailwind support, and clear preview limitations without increasing Fibery API usage.                           |
| P1       | Sync and conflicts        | Improve detection of external Fibery changes and make conflict decisions safer and clearer.                                                                    |
| P1       | Appearance and themes     | Add light/dark/system themes and editor theme options.                                                                                                         |
| P1       | Command Palette           | Add fast keyboard-driven actions and navigation.                                                                                                               |
| P2       | Snippets and templates    | Add reusable HTML snippets and starter page templates.                                                                                                         |
| P2       | Diagnostics and formatter | Add non-blocking code diagnostics and safer formatting tools.                                                                                                  |
| P2       | Snapshots                 | Add named restore points and richer comparisons between versions.                                                                                              |
| P2       | Mobile and touch          | Improve smaller-screen layouts and touch interactions.                                                                                                         |
| Research | PWA/installability        | Investigate what is possible inside Fibery Custom HTML Page constraints.                                                                                       |
| Research | Editor engine             | Evaluate CodeMirror 6 as a possible alternative or companion to Monaco.                                                                                        |
| Research | UI architecture           | Evaluate selective Web Components for modals and panels.                                                                                                       |

## Current status

Current app version: `8.16.0`.

Version `8.16.0` introduced Vite as the internal JavaScript bundling pipeline while keeping the final output as a single generated `index.html`.

## Contributing

This project is driven by real Fibery usage needs.

Before changing the app, check the repository instructions, the related GitHub Issues, and the relevant files in `source/`.

Changes should preserve:

* the single-file Fibery deployment model;
* careful Fibery API usage;
* local validation where possible;
* clear separation between local validation and real Fibery testing.

## License

License to be defined.
