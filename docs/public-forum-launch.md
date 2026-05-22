# Fibery HTML Editor

I love Fibery. Over the past year I have been gradually centralizing more and more of my work inside it — pages, notes, planning, references. I had used Notion before, and before that a handful of other tools, but Fibery ended up being the one that matched how I actually think and work. When Custom HTML Pages arrived, the platform got significantly more powerful for me.

The native editor for Custom HTML Pages is functional, but for more serious work — editing structured HTML, checking the output, keeping multiple pages organized — I kept wishing for something more focused. So I built one.

## Why I built this

I wanted a dedicated space inside Fibery for creating and maintaining HTML pages without context-switching to an external editor. Something that would let me write HTML, see a preview, keep drafts safely, and save to Fibery only when I was ready. I also wanted it to be easy to keep up to date over time.

The result is a Fibery Custom HTML Page that edits other Fibery HTML pages. It lives inside your Fibery workspace, it has no backend, and it does not require any account or hosted service.

## What it is

A Custom HTML Page you install in your own Fibery workspace. You add the generated `index.html` as a new Custom HTML Page, open it, and from there you can create, edit, preview, and organize your other Fibery HTML pages.

One file. One page. Works inside Fibery.

## What it can do today

- Edit HTML with a Monaco-based editor (the same editor that powers VS Code)
- Show a local preview while you type so you can check changes before saving
- Save to Fibery only when you explicitly click Save — no automatic writes
- Keep local drafts and recovery data in the browser so work is not lost
- Keep a local manual history per page — you can browse and restore previous versions
- Organize pages into local project folders (browser-only, does not create Fibery entities)
- Search across all your Fibery HTML pages
- Check for and apply updates to itself directly from within Fibery via GitHub

## Why it is designed this way

Every design decision here was shaped by one constraint: Fibery should only change when you tell it to. The editor keeps all intermediate work local — drafts, history, projects, recovery data — so nothing writes to Fibery accidentally. Preview is local. Autosave is local. When you are ready, you click Save.

This also keeps it API-friendly. The editor avoids unnecessary Fibery API calls while you are typing or navigating. API calls happen for real actions: opening a page, saving, checking for external changes. That matters when you are inside a shared workspace.

## What I would love people to try

If you install it, I would be glad to hear what happens when you:

- create a new HTML page from scratch;
- edit an existing page and check the preview;
- save and reopen the page;
- use local project folders for organization;
- open Settings and check for an available update;
- apply an update through the Update App flow.

Nothing exotic — just real use. If something breaks, feels confusing, or does not match what you expected, that is exactly the feedback I am looking for.

## Feedback I am looking for

Useful feedback usually includes:

- what you tried to do;
- what happened;
- what you expected instead;
- browser and OS;
- editor version (visible in Settings → About);
- a screenshot, short video, or the diagnostic info copied from the editor.

The diagnostic info is safe to share. It captures runtime status and recent log lines, but never page HTML, page titles, page IDs, tokens, drafts, or history content.

## Links

- [GitHub profile](https://github.com/rabrunos)
- [Repository](https://github.com/rabrunos/fibery-html-editor)
