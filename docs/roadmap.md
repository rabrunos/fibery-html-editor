# Roadmap — Fibery HTML Editor

## How to use this roadmap

This roadmap is a planning guide for the Fibery HTML Editor repository.

It is not the source of truth for the currently installed version. The current version must be read from the main HTML file version metadata.

When deciding the next version:

1. read the current main HTML file;
2. read `AGENTS.md`;
3. read this roadmap;
4. inspect current code behavior;
5. choose the smallest safe next step.

Version numbers below are directional. If `index.html` already has a newer version, continue from the actual HTML version.

## Product direction

The Fibery HTML Editor should remain an internal operational editor for Fibery-hosted HTML pages.

Primary goals:

- fast page creation and editing;
- reliable preview;
- local organization with projects;
- stable sidebar and search;
- local history and recovery;
- eventual safe app self-update;
- eventual HTML/CSS/JS editor split;
- good mobile/vertical behavior later.

Non-goals:

- generic public HTML editor;
- backend service;
- framework rewrite;
- custom authentication;
- replacing Fibery APIs;
- treating local projects as Fibery entities without a dedicated design.

## Completed baseline

The app already has these core systems and they should be preserved:

- sidebar open/close with persistence;
- recent pages;
- local projects;
- page create/load/save/delete;
- page rename/copy link/open preview;
- search;
- welcome/blank state;
- Monaco editor with textarea fallback;
- preview iframe;
- preview focus mode;
- editor/preview panel modes;
- local history;
- settings;
- logs;
- IndexedDB/localStorage persistence;
- local metadata for sorting, pinning, archiving, and projects;
- app version metadata in the main HTML;
- three-dot context menu toggle behavior.

## Near-term track

### Next patch: Local autosave / draft recovery

Goal:

Add local draft safety without changing Fibery save behavior.

Requirements:

- save unsaved editor changes locally while editing;
- do not auto-save to Fibery;
- detect recoverable draft when opening a page;
- provide clear user choice to restore or discard local draft;
- support new unsaved pages and existing saved pages;
- avoid interfering with manual Save;
- use IndexedDB for structured draft data if needed;
- use localStorage only for lightweight flags/preferences;
- preserve dirty state behavior.

Non-goals:

- cloud sync;
- cross-device drafts;
- background Fibery writes;
- replacing history snapshots.

### Then: Safe Update App flow

Goal:

Make the app capable of checking and applying newer app HTML safely.

Requirements:

- compare installed version with remote/source version;
- use version metadata from HTML;
- detect when the current page is the editor app page;
- require confirmation before overwriting;
- create local snapshot/backup before applying;
- use existing Fibery page operations;
- provide clear success/failure feedback.

Possible source:

- GitHub-hosted `index.html` or release artifact.

Non-goals:

- invent backend endpoint;
- auto-update without confirmation;
- update official Fibery reference files.

### Then: Improved history and snapshots

Goal:

Make local history more useful and safer.

Possible features:

- named snapshots;
- manual snapshot button;
- preview snapshot before restore;
- better restore confirmation;
- compare current vs snapshot;
- cleanup policy improvements.

Non-goals:

- shared history between users/devices;
- backend snapshot service.

## Mid-term track

### Triple editor foundation

Goal:

Evolve from one HTML editor into HTML/CSS/JS editing without breaking existing full-HTML pages.

Requirements:

- preserve existing full HTML editing;
- introduce compatible data structure;
- allow separate HTML, CSS, and JS panes;
- allow hiding panes;
- persist layout and pane visibility;
- keep Monaco fallback behavior;
- avoid breaking saved pages.

Suggested phased approach:

1. internal data model compatibility;
2. UI split;
3. combined preview;
4. import full HTML into HTML/CSS/JS sections;
5. save strategy refinement.

### Combined preview

Goal:

Render HTML + CSS + JS together.

Requirements:

- generate preview document safely;
- preserve iframe isolation;
- avoid unnecessary reloads;
- support current full-HTML mode and future triple-editor mode.

### Search / command palette evolution

Goal:

Make navigation and actions faster.

Possible features:

- command palette style UI;
- page/project results;
- quick actions;
- better grouping;
- keyboard navigation;
- recent commands.

Non-goals:

- heavy modal experience;
- breaking current search click behavior.

## Later track

### Mobile and vertical layout

Goal:

Make the editor usable on smaller screens.

Possible features:

- vertical editor/preview layout;
- touch-friendly menus;
- larger tap targets;
- mobile sidebar behavior;
- reduced drag-resize complexity on touch devices.

### Icon cleanup

Goal:

Fix malformed or inconsistent SVG/HeroIcons.

Rules:

- do this as an isolated visual cleanup;
- do not mix icon cleanup with functional changes;
- preserve button sizes and alignment.

### Advanced app management

Possible features:

- GitHub version check UI;
- release notes display;
- local backup list before app update;
- rollback to previous app HTML snapshot.

## Task completion policy

Only mark roadmap items as completed when the user explicitly asks for roadmap updates or when a committed implementation clearly completes that item.

Do not keep changing this file for every tiny patch unless the user wants roadmap maintenance.

## Versioning policy

Every main HTML app change must update internal version metadata.

Use the version in the current HTML as the source for the next version.

Suggested increments:

- patch: bug fix, safe cleanup, small UX refinement;
- minor: new feature or structural addition;
- major: breaking or architecture-level change.
