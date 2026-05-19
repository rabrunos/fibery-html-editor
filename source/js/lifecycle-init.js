async function init() {
  els.langSelect.value = localStorage.getItem(LS.lang) || 'auto';
  els.openLastToggle.checked = (localStorage.getItem(LS.openLast) ?? '1') === '1';
  els.versionLimitSelect.value = localStorage.getItem(LS.versionLimit) || '20';
  state.panelMode = localStorage.getItem(LS.panelMode) || 'both';
  applyI18n();
  await setupCodeEditor();
  bindEvents();
  setupResize();
  setPanelMode(state.panelMode, false);
  state.db = await openDb();
  await loadPageMetaCache();
  await loadProjectsCache();
  await loadDraftsCache();
  try { setAdminMode(await API.checkIsAdmin({ source: 'init' })); } catch (_) { setAdminMode(false); }
  setSidebarOpen((localStorage.getItem(LS.sidebarOpen) ?? '1') === '1', false);
  const lastId = localStorage.getItem(LS.lastPageId);
  if (els.openLastToggle.checked && lastId) {
    try { await loadPage(lastId); } catch (err) { log(err.message || String(err)); showBlankPage(); void maybePromptUnsavedDraftRecovery(state.drafts.promptToken); }
  } else {
    showBlankPage();
    void maybePromptUnsavedDraftRecovery(state.drafts.promptToken);
  }
}

init().catch(err => { console.error(err); alert(err.message || String(err)); });
