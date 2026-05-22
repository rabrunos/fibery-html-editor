async function init(): Promise<void> {
  state.panelMode = (localStorage.getItem(LS.panelMode) || 'both') as PanelMode;
  state.db = await openDb();
  await loadPageMetaCache();
  await loadProjectsCache();
  await loadDraftsCache();
  await ensureRequiredResources();
  await RESOURCES_READY_SIGNAL;
  await ensureCachedStyleResourcesLoaded();
  await ensureCachedTemplateResourcesLoaded();
  initDomRefs();
  // Guard: if required templates could not be injected, stop init gracefully
  if (!document.getElementById('settingsModal')) {
    log('[init] Template resources not available — some features will be missing');
    return;
  }
  els.langSelect.value = localStorage.getItem(LS.lang) || 'auto';
  els.openLastToggle.checked = (localStorage.getItem(LS.openLast) ?? '1') === '1';
  els.versionLimitSelect.value = localStorage.getItem(LS.versionLimit) || '20';
  await ensureI18nResourcesLoaded();
  applyI18n();
  await setupCodeEditor();
  bindEvents();
  setupResize();
  setPanelMode(state.panelMode, false);
  await applyEmergencyDraftIfRelevant();
  try { setAdminMode(await API.checkIsAdmin({ source: 'init' })); } catch (_) { setAdminMode(false); }
  setSidebarOpen((localStorage.getItem(LS.sidebarOpen) ?? '1') === '1', false);
  const lastId = localStorage.getItem(LS.lastPageId);
  if (els.openLastToggle.checked && lastId) {
    try { await loadPage(lastId); } catch (err) { log((err as Error).message || String(err)); showBlankPage(); void maybePromptUnsavedDraftRecovery(state.drafts.promptToken); }
  } else {
    showBlankPage();
    void maybePromptUnsavedDraftRecovery(state.drafts.promptToken);
  }
  void maybeCheckUpdateOnStartup();
}

init().catch((err: unknown) => { console.error(err); alert((err as Error).message || String(err)); });
