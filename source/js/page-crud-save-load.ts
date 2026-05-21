function pageCrudErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message || error || '');
  }
  return String(error || '');
}

async function loadPage(id: unknown): Promise<void> {
  const pageId = String(id || '');
  if (!pageId) return;
  if (!state.blank && state.current.id === pageId && !state.loadingPage) return;
  if (state.pageLoads.inFlightById[pageId]) {
    await state.pageLoads.inFlightById[pageId];
    return;
  }

  const loadPromise = (async (): Promise<void> => {
    state.loadingPage = true;
    await flushDraftAutosaveNow();
    const promptToken = ++state.drafts.promptToken;
    await loadPageWithCacheAwareFlow(pageId, promptToken);
  })();

  state.pageLoads.inFlightById[pageId] = loadPromise;
  try {
    await loadPromise;
  } finally {
    delete state.pageLoads.inFlightById[pageId];
    state.loadingPage = false;
    syncSaveAvailabilityState();
  }
}

async function confirmAction({
  title,
  message,
  okText = 'OK',
  showPreview = false,
  previewId = '',
  openPreviewId = ''
}: ConfirmActionOptions = {}): Promise<boolean> {
  els.confirmTitle.textContent = title || '';
  els.confirmMessage.textContent = message || '';
  els.confirmOkBtn.textContent = okText;

  const previewTargetId = String(previewId || state.current.id || '');
  els.confirmOpenPreviewBtn.dataset.previewId = String(openPreviewId || previewTargetId || '');
  els.deletePreviewWrap.classList.toggle('hidden', !showPreview);
  if (showPreview && previewTargetId) {
    els.deletePreviewFrame.src = viewUrl(previewTargetId);
    recordPreviewUsage({ source: 'confirm-preview', pageId: previewTargetId });
  } else {
    els.deletePreviewFrame.removeAttribute('src');
    els.confirmOpenPreviewBtn.dataset.previewId = '';
  }

  els.confirmModal.classList.remove('hidden');
  return new Promise<boolean>((resolve) => {
    state.confirmResolver = resolve;
  });
}

function closeConfirm(result: unknown): void {
  els.confirmModal.classList.add('hidden');
  els.deletePreviewFrame.removeAttribute('src');
  els.confirmOpenPreviewBtn.dataset.previewId = '';
  const resolver = state.confirmResolver;
  state.confirmResolver = null;
  if (resolver) resolver(!!result);
}

async function newPage(): Promise<void> {
  const ok = await confirmAction({
    title: t('createPageTitle'),
    message: t('createPageMessage'),
    okText: t('create')
  });
  if (!ok) return;

  await flushDraftAutosaveNow();
  state.current = { id: '', title: 'Untitled Page', description: '', html: '' };
  if (typeof resetExternalSyncStateForCurrentPage === 'function') resetExternalSyncStateForCurrentPage('');
  resetCachedPageOpenState('');
  setCurrentBaseline();
  renderCurrent();
  markDirty(true);
  syncPreviewMode({ immediate: true });
  setStatus(t('pageCreated'));
  els.titleInput.focus();
  els.titleInput.select();
}

async function deleteCurrentPage(): Promise<void> {
  if (!state.current.id) return;
  const ok = await confirmAction({
    title: t('deleteTitle'),
    message: t('deleteMessage'),
    okText: t('deleteConfirm'),
    showPreview: false
  });
  if (!ok) return;

  try {
    const oldId = state.current.id;
    await API.deletePage(oldId, { source: 'delete-current-page' });
    await deletePageContentCacheSafe(oldId, { source: 'delete-current-page' });
    if (localStorage.getItem(LS.lastPageId) === oldId) localStorage.removeItem(LS.lastPageId);
    delete state.sidebar.pageCache[oldId];
    clearSearchCaches();
    await deletePageMeta(oldId);
    showBlankPage();
    refreshSidebarFromLocalCache({ reset: true });
    setStatus(t('deleted'));
    log(t('deleted'));
  } catch (error) {
    const message = pageCrudErrorMessage(error);
    alert(message);
    log(message);
  }
}

async function deletePageFromList(id: string, title?: string): Promise<void> {
  if (!id || !state.isAdmin) return;
  const ok = await confirmAction({
    title: t('deleteTitle'),
    message: `${t('deleteMessage')}\n\n${title || id}`,
    okText: t('deleteConfirm'),
    showPreview: true,
    previewId: id,
    openPreviewId: id
  });
  if (!ok) return;

  try {
    await API.deletePage(id, { source: 'delete-page-list' });
    await deletePageContentCacheSafe(id, { source: 'delete-page-list' });
    if (localStorage.getItem(LS.lastPageId) === id) localStorage.removeItem(LS.lastPageId);
    delete state.sidebar.pageCache[id];
    clearSearchCaches();
    await deletePageMeta(id);
    if (state.current.id === id) showBlankPage();
    refreshSidebarFromLocalCache({ reset: true });
    if (!els.searchModal.classList.contains('hidden')) await loadSearchResults({ localOnly: true });
    if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults({ localOnly: true });
    setStatus(t('deleted'));
    log(`${t('deleted')}: ${title || id}`);
  } catch (error) {
    const message = pageCrudErrorMessage(error);
    alert(message);
    log(message);
  }
}

async function savePage(action: string = 'save'): Promise<boolean> {
  if (state.saving) return false;
  const blockedReason = saveBlockedReasonForCurrentPage();
  if (blockedReason) {
    syncSaveAvailabilityState({ announce: true });
    return false;
  }

  const beforeSavePageId = state.current.id || '';
  await flushDraftAutosaveNow();
  updateCurrentFromInputs();
  if (!state.current.title.trim()) {
    alert(t('validationTitle'));
    els.titleInput.focus();
    return false;
  }

  state.saving = true;
  syncSaveAvailabilityState();
  setStatus(t('saving'));
  try {
    const saved = await API.savePage(state.current, { source: 'save-page' });
    state.current = {
      id: saved.id || saved.data?.id || state.current.id,
      title: saved.title || saved.data?.title || state.current.title,
      description: saved.description || saved.data?.description || state.current.description,
      html: saved.html || saved.data?.html || state.current.html
    };
    await savePageContentCacheSafe(state.current, { source: 'fibery-save' });
    cachePagesForSidebar([state.current]);
    clearSearchCaches();
    localStorage.setItem(LS.lastPageId, state.current.id);

    const now = Date.now();
    await savePageMeta(state.current.id, {
      title: state.current.title,
      description: state.current.description,
      lastOpenedAt: now,
      lastSavedAt: now
    });

    const oldDraftKey = draftKeyForPage(beforeSavePageId);
    const savedDraftKey = draftKeyForPage(state.current.id || '');
    await deleteDraftByKey(oldDraftKey);
    if (savedDraftKey !== oldDraftKey) await deleteDraftByKey(savedDraftKey);
    clearEmergencyDraftForPage(beforeSavePageId);
    await saveHistory(action);

    setCurrentBaseline();
    markCurrentPageRemoteVerified({ openedFromCache: false, remoteStatus: 'verified' });
    if (typeof clearExternalSyncCandidateForCurrentPage === 'function') {
      clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: true });
    }
    renderCurrent();
    syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
    syncPreviewMode({ immediate: true, forceRealReload: true });
    refreshSidebarFromLocalCache({ reset: true });
    setStatus(t('saved'));
    log(`${t('saved')}: ${state.current.title || state.current.id}`);
    return true;
  } catch (error) {
    setStatus('Error');
    const message = pageCrudErrorMessage(error);
    log(message);
    alert(message);
    return false;
  } finally {
    state.saving = false;
    syncSaveAvailabilityState();
  }
}

async function renamePage(pageId: string, nextTitle: string): Promise<void> {
  const title = String(nextTitle || '').trim();
  if (!title) {
    setStatus(t('renameEmptyIgnored'));
    return;
  }

  let page: FiberyPage;
  let previousCurrentSnapshot: PageSnapshot | null = null;
  let previousBaselineSnapshot: PageSnapshot | null = null;

  if (state.current.id === pageId && !state.blank) {
    updateCurrentFromInputs();
    previousCurrentSnapshot = currentSnapshotFromState();
    previousBaselineSnapshot = currentBaselineSnapshot();
    page = {
      id: pageId,
      title,
      description: previousBaselineSnapshot.description,
      html: previousBaselineSnapshot.html
    };
  } else {
    page = await API.loadPage(pageId, { source: 'rename-page' }) as FiberyPage;
    page.title = title;
  }

  const saved = await API.savePage(page, { source: 'rename-page' });
  const newTitle = saved.title || saved.data?.title || title;
  const desc = saved.description || saved.data?.description || page.description || '';
  const html = saved.html || saved.data?.html || page.html || '';
  await savePageContentCacheSafe({ id: pageId, title: newTitle, description: desc, html }, { source: 'fibery-save' });

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
  state.sidebar.pageCache[pageId] = {
    ...(state.sidebar.pageCache[pageId] || {}),
    id: pageId,
    title: newTitle,
    description: desc
  };
  clearSearchCaches();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  if (!els.searchModal.classList.contains('hidden')) await loadSearchResults({ localOnly: true });
  if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults({ localOnly: true });
  setStatus(t('pageRenamed'));
}

async function togglePinPage(pageId: string): Promise<void> {
  const meta = getMetaMap()[pageId] || { id: pageId };
  await savePageMeta(pageId, { pinnedAt: meta.pinnedAt ? 0 : Date.now() });
  refreshSidebarFromLocalCache();
  renderSidebarProjects();
  setStatus(meta.pinnedAt ? t('unpinned') : t('pinned'));
}

async function toggleArchivePage(pageId: string): Promise<void> {
  const meta = getMetaMap()[pageId] || { id: pageId };
  await savePageMeta(pageId, { archivedAt: meta.archivedAt ? 0 : Date.now() });
  clearSearchCaches();
  refreshSidebarFromLocalCache();
  renderSidebarProjects();
  if (!els.searchModal.classList.contains('hidden')) await loadSearchResults({ localOnly: true });
  if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults({ localOnly: true });
  setStatus(meta.archivedAt ? t('unarchived') : t('archived'));
}
