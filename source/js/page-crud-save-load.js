async function loadPage(id) {
  const pageId = String(id || '');
  if (!pageId) return;
  if (!state.blank && state.current.id === pageId && !state.loadingPage) return;
  if (state.pageLoads.inFlightById[pageId]) return state.pageLoads.inFlightById[pageId];

  const loadPromise = (async () => {
    state.loadingPage = true;
    await flushDraftAutosaveNow();
    const promptToken = ++state.drafts.promptToken;
    setStatus(t('loading'));
    const page = await API.loadPage(pageId, { source: 'load-page' });
    state.current = { id: page.id || pageId, title: page.title || '', description: page.description || '', html: page.html || '' };
    cachePagesForSidebar([state.current]);
    if (typeof resetExternalSyncStateForCurrentPage === 'function') resetExternalSyncStateForCurrentPage(state.current.id);
    setCurrentBaseline();
    await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: Date.now() });
    renderCurrent();
    syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
    localStorage.setItem(LS.lastPageId, state.current.id);
    syncPreviewMode({ immediate: true });
    setStatus(t('pageLoaded'));
    log(`${t('pageLoaded')}: ${state.current.title || state.current.id}`);
    void maybePromptDraftRecoveryForCurrentPage(promptToken);
  })();

  state.pageLoads.inFlightById[pageId] = loadPromise;
  try {
    return await loadPromise;
  } finally {
    delete state.pageLoads.inFlightById[pageId];
    state.loadingPage = false;
  }
}
async function confirmAction({ title, message, okText = 'OK', showPreview = false, previewId = '', openPreviewId = '' } = {}) { els.confirmTitle.textContent = title || ''; els.confirmMessage.textContent = message || ''; els.confirmOkBtn.textContent = okText; const previewTargetId = previewId || state.current.id; els.confirmOpenPreviewBtn.dataset.previewId = openPreviewId || previewTargetId || ''; els.deletePreviewWrap.classList.toggle('hidden', !showPreview); if (showPreview && previewTargetId) { els.deletePreviewFrame.src = viewUrl(previewTargetId); recordPreviewUsage({ source: 'confirm-preview', pageId: previewTargetId }); } else { els.deletePreviewFrame.removeAttribute('src'); els.confirmOpenPreviewBtn.dataset.previewId = ''; } els.confirmModal.classList.remove('hidden'); return new Promise(resolve => { state.confirmResolver = resolve; }); }
function closeConfirm(result) { els.confirmModal.classList.add('hidden'); els.deletePreviewFrame.removeAttribute('src'); els.confirmOpenPreviewBtn.dataset.previewId = ''; const resolver = state.confirmResolver; state.confirmResolver = null; if (resolver) resolver(!!result); }
async function newPage() { const ok = await confirmAction({ title: t('createPageTitle'), message: t('createPageMessage'), okText: t('create') }); if (!ok) return; await flushDraftAutosaveNow(); state.current = { id: '', title: 'Untitled Page', description: '', html: '' }; if (typeof resetExternalSyncStateForCurrentPage === 'function') resetExternalSyncStateForCurrentPage(''); setCurrentBaseline(); renderCurrent(); markDirty(true); syncPreviewMode({ immediate: true }); setStatus(t('pageCreated')); els.titleInput.focus(); els.titleInput.select(); }
async function deleteCurrentPage() { if (!state.current.id) return; const ok = await confirmAction({ title: t('deleteTitle'), message: t('deleteMessage'), okText: t('deleteConfirm'), showPreview: false }); if (!ok) return; try { const oldId = state.current.id; await API.deletePage(oldId, { source: 'delete-current-page' }); if (localStorage.getItem(LS.lastPageId) === oldId) localStorage.removeItem(LS.lastPageId); delete state.sidebar.pageCache[oldId]; clearSearchCaches(); await deletePageMeta(oldId); showBlankPage(); refreshSidebarFromLocalCache({ reset: true }); setStatus(t('deleted')); log(t('deleted')); } catch (err) { alert(err.message || String(err)); log(err.message || String(err)); } }
async function deletePageFromList(id, title) { if (!id || !state.isAdmin) return; const ok = await confirmAction({ title: t('deleteTitle'), message: `${t('deleteMessage')}\n\n${title || id}`, okText: t('deleteConfirm'), showPreview: true, previewId: id, openPreviewId: id }); if (!ok) return; try { await API.deletePage(id, { source: 'delete-page-list' }); if (localStorage.getItem(LS.lastPageId) === id) localStorage.removeItem(LS.lastPageId); delete state.sidebar.pageCache[id]; clearSearchCaches(); await deletePageMeta(id); if (state.current.id === id) showBlankPage(); refreshSidebarFromLocalCache({ reset: true }); if (!els.searchModal.classList.contains('hidden')) await loadSearchResults({ localOnly: true }); if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults({ localOnly: true }); setStatus(t('deleted')); log(`${t('deleted')}: ${title || id}`); } catch (err) { alert(err.message || String(err)); log(err.message || String(err)); } }
async function savePage(action = 'save') {
  if (state.saving) return false;
  const beforeSavePageId = state.current.id || '';
  await flushDraftAutosaveNow();
  updateCurrentFromInputs();
  if (!state.current.title.trim()) { alert(t('validationTitle')); els.titleInput.focus(); return false; }
  state.saving = true;
  els.saveBtn.disabled = true;
  setStatus(t('saving'));
  try {
    const saved = await API.savePage(state.current, { source: 'save-page' });
    state.current = { id: saved.id || saved.data?.id || state.current.id, title: saved.title || saved.data?.title || state.current.title, description: saved.description || saved.data?.description || state.current.description, html: saved.html || saved.data?.html || state.current.html };
    cachePagesForSidebar([state.current]);
    clearSearchCaches();
    localStorage.setItem(LS.lastPageId, state.current.id);
    const now = Date.now();
    await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: now, lastSavedAt: now });
    const oldDraftKey = draftKeyForPage(beforeSavePageId);
    const savedDraftKey = draftKeyForPage(state.current.id || '');
    await deleteDraftByKey(oldDraftKey);
    if (savedDraftKey !== oldDraftKey) await deleteDraftByKey(savedDraftKey);
    await clearAutosaveHistoryBySignature(state.current.id, snapshotSignature(state.current));
    await saveHistory(action);
    setCurrentBaseline();
    if (typeof clearExternalSyncCandidateForCurrentPage === 'function') clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: true });
    renderCurrent();
    syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
    syncPreviewMode({ immediate: true, forceRealReload: true });
    refreshSidebarFromLocalCache({ reset: true });
    setStatus(t('saved'));
    log(`${t('saved')}: ${state.current.title || state.current.id}`);
    return true;
  } catch (err) {
    setStatus('Error');
    log(err.message || String(err));
    alert(err.message || String(err));
    return false;
  } finally {
    state.saving = false;
    els.saveBtn.disabled = !state.isAdmin;
  }
}
async function renamePage(pageId, nextTitle) {
  const title = String(nextTitle || '').trim();
  if (!title) { setStatus(t('renameEmptyIgnored')); return; }
  let page;
  let previousCurrentSnapshot = null;
  let previousBaselineSnapshot = null;
  if (state.current.id === pageId && !state.blank) {
    updateCurrentFromInputs();
    previousCurrentSnapshot = currentSnapshotFromState();
    previousBaselineSnapshot = currentBaselineSnapshot();
    page = { id: pageId, title, description: previousBaselineSnapshot.description, html: previousBaselineSnapshot.html };
  } else {
    page = await API.loadPage(pageId, { source: 'rename-page' });
    page.title = title;
  }
  const saved = await API.savePage(page, { source: 'rename-page' });
  const newTitle = saved.title || saved.data?.title || title;
  const desc = saved.description || saved.data?.description || page.description || '';
  const html = saved.html || saved.data?.html || page.html || '';
  if (state.current.id === pageId && !state.blank) {
    const hadUnsavedDescription = String(previousCurrentSnapshot?.description || '') !== String(previousBaselineSnapshot?.description || '');
    state.current.title = newTitle;
    if (!hadUnsavedDescription) state.current.description = desc;
    state.currentBaseline = { id: pageId, title: newTitle, description: desc, html };
    els.titleInput.value = newTitle;
    if (!hadUnsavedDescription) els.descriptionInput.value = desc;
    syncDirtyWithBaseline();
  }
  await savePageMeta(pageId, { title: newTitle, description: desc });
  state.sidebar.pageCache[pageId] = { ...(state.sidebar.pageCache[pageId] || {}), id: pageId, title: newTitle, description: desc };
  clearSearchCaches();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  if (!els.searchModal.classList.contains('hidden')) await loadSearchResults({ localOnly: true });
  if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults({ localOnly: true });
  setStatus(t('pageRenamed'));
}
async function togglePinPage(pageId) {
  const meta = getMetaMap()[pageId] || { id: pageId };
  await savePageMeta(pageId, { pinnedAt: meta.pinnedAt ? 0 : Date.now() });
  refreshSidebarFromLocalCache();
  renderSidebarProjects();
  setStatus(meta.pinnedAt ? t('unpinned') : t('pinned'));
}
async function toggleArchivePage(pageId) {
  const meta = getMetaMap()[pageId] || { id: pageId };
  await savePageMeta(pageId, { archivedAt: meta.archivedAt ? 0 : Date.now() });
  clearSearchCaches();
  refreshSidebarFromLocalCache();
  renderSidebarProjects();
  if (!els.searchModal.classList.contains('hidden')) await loadSearchResults({ localOnly: true });
  if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults({ localOnly: true });
  setStatus(meta.archivedAt ? t('unarchived') : t('archived'));
}
