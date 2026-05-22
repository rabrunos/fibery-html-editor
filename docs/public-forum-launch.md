# Fibery HTML Editor — Custom HTML Page for editing HTML pages inside Fibery

## 1. Short Forum Intro

I am opening the first public testing round for **Fibery HTML Editor**, a **Fibery Custom HTML Page** that helps create, edit, preview, organize, and maintain HTML pages inside Fibery.

It runs inside Fibery as a Custom HTML Page. There is no separate backend and no hosted service to sign up for. You install it by adding the generated `index.html` as a Fibery Custom HTML Page in your own workspace.

The main goal of this testing round is practical feedback: does it open correctly, does editing feel clear, does preview help, does saving feel safe, and what gets confusing in real use?

If something breaks, a screenshot, short video, or copied diagnostic info from the editor is very helpful.

## 2. What It Does

- Edits Fibery-hosted HTML pages from a dedicated editor interface.
- Shows a local preview while editing, so you can check changes before saving.
- Saves explicitly to Fibery only when you click **Save**.
- Keeps local drafts/recovery data in the browser.
- Keeps local manual history in the browser.
- Lets you organize pages into local project folders. These folders do not create Fibery entities.
- Includes an **Update App** flow that can check a newer published version and apply it only after confirmation.
- Keeps the deployment model simple: one Custom HTML Page, one generated HTML file.

## 3. How To Install And Use

1. Open the generated `index.html` from the repository.
2. Copy the full HTML content.
3. In Fibery, create a new Custom HTML Page.
4. Paste the HTML content into that Custom HTML Page and save it.
5. Open the saved Custom HTML Page in view mode.
6. Click **New Page** to create a draft HTML page.
7. Edit the title, description, and HTML.
8. Check the preview panel.
9. Click **Save** when you want to write the page to Fibery.
10. Use the sidebar or search to open existing pages.

## 4. What To Test

- [ ] The Custom HTML Page opens correctly.
- [ ] Creating a new page works.
- [ ] Editing HTML works.
- [ ] Local preview updates as expected.
- [ ] Save writes the page to Fibery only when requested.
- [ ] Reloading and reopening a saved page works.
- [ ] Search finds pages.
- [ ] Local project folders can be opened, closed, and used for organization.
- [ ] Settings opens correctly.
- [ ] Update check works and shows a clear state.
- [ ] Smaller screens remain usable enough for basic work.

## 5. Known Limitations

- It runs inside Fibery, so Fibery Custom HTML Page permissions and runtime behavior matter.
- Browser storage matters. Local drafts, recovery data, project folders, and local history are stored in the current browser.
- Local organization is not synced across browsers or devices.
- The first run may need to download required resources before the full interface appears.
- This is early public testing. Please do not treat it as a guaranteed stable workflow yet.

## 6. How To Report Feedback

Useful feedback usually includes:

- what you tried to do;
- what happened;
- what you expected instead;
- browser and operating system;
- Fibery HTML Editor version;
- screenshot or short video, if possible;
- copied diagnostic info from the editor.

The diagnostic info is meant to be safe to share. It should include runtime status and recent log lines, but not page HTML, page title, page description, page IDs, cookies, tokens, drafts, or history content.

## 7. Short Message

I am testing Fibery HTML Editor, a Custom HTML Page for editing HTML pages inside Fibery. If you can, please try creating, editing, previewing, saving, reopening, searching, project folders, Settings, and Update check. If something breaks or feels confusing, send a screenshot/video and the copied diagnostic info from the editor.
