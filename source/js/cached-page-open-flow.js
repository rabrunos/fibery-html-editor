function createCachedPageOpenRequestId(pageId = '') {
  return `${String(pageId || '')}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function resetCachedPageOpenState(pageId = '') {
  state.cachedPageOpen.pageId = String(pageId || '');
  state.cachedPageOpen.openRequestId = '';
  state.cachedPageOpen.openedFromCache = false;
  state.cachedPageOpen.cacheSignature = '';
  state.cachedPageOpen.remoteStatus = 'idle';
  state.cachedPageOpen.saveBlockedReason = '';
  state.cachedPageOpen.remoteCandidate = null;
  state.cachedPageOpen.lastErrorMessage = '';
  state.cachedPageOpen.verifiedAt = 0;
  syncSaveAvailabilityState();
}

function markCurrentPageRemoteVerified(options = {}) {
  if (state.blank || !state.current.id) return;
  const verifiedAt = Date.now();
  const status = String(options.remoteStatus || 'verified');
  const openedFromCache = !!options.openedFromCache;
  state.cachedPageOpen.pageId = String(state.current.id || '');
  state.cachedPageOpen.openRequestId = '';
  state.cachedPageOpen.openedFromCache = openedFromCache;
  state.cachedPageOpen.cacheSignature = String(options.signature || snapshotSignature(currentBaselineSnapshot()));
  state.cachedPageOpen.remoteStatus = status;
  state.cachedPageOpen.saveBlockedReason = '';
  state.cachedPageOpen.remoteCandidate = null;
  state.cachedPageOpen.lastErrorMessage = '';
  state.cachedPageOpen.verifiedAt = verifiedAt;
  syncSaveAvailabilityState();
}

function isActiveCachedPageOpenRequest(pageId = '', requestId = '') {
  const expectedPageId = String(pageId || '');
  const expectedRequestId = String(requestId || '');
  if (!expectedPageId || !expectedRequestId) return false;
  if (state.blank) return false;
  if (String(state.current.id || '') !== expectedPageId) return false;
  if (String(state.cachedPageOpen.pageId || '') !== expectedPageId) return false;
  if (String(state.cachedPageOpen.openRequestId || '') !== expectedRequestId) return false;
  return true;
}

function hasUserEditedSinceCachedOpen(pageId = '') {
  const currentPageId = String(state.current.id || '');
  const expectedPageId = String(pageId || '');
  if (!expectedPageId || currentPageId !== expectedPageId) return false;
  updateCurrentFromInputs();
  return !sameSnapshot(currentSnapshotFromState(), currentBaselineSnapshot());
}

function cachedPageSnapshot(record = {}, pageId = '') {
  const normalizedPageId = String(record.pageId || pageId || '').trim();
  return {
    id: normalizedPageId,
    title: String(record.title || ''),
    description: String(record.description || ''),
    html: String(record.html || '')
  };
}

async function loadPageFromRemoteDirect(pageId, promptToken) {
  setStatus(t('loading'));
  const page = await API.loadPage(pageId, { source: 'load-page' });
  state.current = {
    id: page.id || pageId,
    title: page.title || '',
    description: page.description || '',
    html: page.html || ''
  };
  await savePageContentCacheSafe(state.current, { source: 'fibery-load' });
  cachePagesForSidebar([state.current]);
  if (typeof resetExternalSyncStateForCurrentPage === 'function') resetExternalSyncStateForCurrentPage(state.current.id);
  setCurrentBaseline();
  await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: Date.now() });
  renderCurrent();
  syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
  localStorage.setItem(LS.lastPageId, state.current.id);
  syncPreviewMode({ immediate: true });
  markCurrentPageRemoteVerified({ openedFromCache: false });
  setStatus(t('pageLoaded'));
  log(`${t('pageLoaded')}: ${state.current.title || state.current.id}`);
  void maybePromptDraftRecoveryForCurrentPage(promptToken);
}

async function startCachedPageRemoteVerification(pageId, requestId, options = {}) {
  const source = String(options.source || 'load-page-cache-verify');
  const promptToken = Number(options.promptToken || state.drafts.promptToken || 0);
  if (!pageId || !requestId) return false;

  if (isActiveCachedPageOpenRequest(pageId, requestId)) {
    state.cachedPageOpen.remoteStatus = 'checking';
    state.cachedPageOpen.saveBlockedReason = 'pending';
    state.cachedPageOpen.lastErrorMessage = '';
    syncSaveAvailabilityState();
    setStatus(t('cachedOpenLoadedFromCacheChecking'));
  }

  try {
    const remote = await API.loadPage(pageId, { source });
    const remoteSnapshot = {
      id: String(remote.id || pageId),
      title: String(remote.title || ''),
      description: String(remote.description || ''),
      html: String(remote.html || '')
    };
    const verifiedAt = Date.now();
    const remoteSignature = snapshotSignature(remoteSnapshot);
    await savePageContentCacheSafe(remoteSnapshot, { pageId, source: 'fibery-load', cachedAt: verifiedAt, verifiedAt, signature: remoteSignature });

    if (!isActiveCachedPageOpenRequest(pageId, requestId)) return true;

    const baselineSignature = snapshotSignature(currentBaselineSnapshot());
    const cacheSignature = String(state.cachedPageOpen.cacheSignature || baselineSignature);
    const sameAsCache = remoteSignature === cacheSignature;
    const userEdited = hasUserEditedSinceCachedOpen(pageId);

    state.cachedPageOpen.lastErrorMessage = '';
    state.cachedPageOpen.verifiedAt = verifiedAt;
    state.cachedPageOpen.cacheSignature = remoteSignature;

    if (sameAsCache) {
      state.cachedPageOpen.remoteStatus = 'verified';
      state.cachedPageOpen.saveBlockedReason = '';
      state.cachedPageOpen.remoteCandidate = null;
      if (typeof clearExternalSyncCandidateForCurrentPage === 'function') {
        clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: false });
      }
      syncSaveAvailabilityState();
      setStatus(t('cachedOpenVerifiedStatus'));
      return true;
    }

    if (!userEdited) {
      state.current = {
        id: String(pageId || remoteSnapshot.id || ''),
        title: remoteSnapshot.title,
        description: remoteSnapshot.description,
        html: remoteSnapshot.html
      };
      setCurrentBaseline();
      renderCurrent();
      syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
      state.cachedPageOpen.remoteStatus = 'stale-applied';
      state.cachedPageOpen.saveBlockedReason = '';
      state.cachedPageOpen.remoteCandidate = null;
      syncSaveAvailabilityState();
      renderLocalPreview();
      setStatus(t('cachedOpenRemoteNewerAppliedStatus'));
      void maybePromptDraftRecoveryForCurrentPage(promptToken);
      return true;
    }

    state.cachedPageOpen.remoteStatus = 'conflict';
    state.cachedPageOpen.saveBlockedReason = 'conflict';
    state.cachedPageOpen.remoteCandidate = {
      id: String(pageId || ''),
      title: remoteSnapshot.title,
      description: remoteSnapshot.description,
      html: remoteSnapshot.html,
      signature: remoteSignature,
      detectedAt: verifiedAt
    };
    if (typeof captureExternalSyncRemoteCandidate === 'function') {
      captureExternalSyncRemoteCandidate({
        id: String(pageId || ''),
        title: remoteSnapshot.title,
        description: remoteSnapshot.description,
        html: remoteSnapshot.html
      });
    }
    syncSaveAvailabilityState();
    setStatus(t('cachedOpenConflictDetectedStatus'));
    return false;
  } catch (err) {
    if (!isActiveCachedPageOpenRequest(pageId, requestId)) return false;
    const message = String(err?.message || err || '');
    state.cachedPageOpen.remoteStatus = 'failed';
    state.cachedPageOpen.saveBlockedReason = 'failed';
    state.cachedPageOpen.lastErrorMessage = message;
    syncSaveAvailabilityState();
    setStatus(t('cachedOpenVerifyFailedStatus'));
    log(`${t('cachedOpenVerifyFailedLog')}: ${message}`);
    return false;
  } finally {
    if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  }
}

async function openPageFromLastSavedCacheIfAvailable(pageId, promptToken) {
  let cacheRecord = null;
  try {
    cacheRecord = await getPageContentCache(pageId);
  } catch (err) {
    log(`Last Saved Cache read failed (${pageId}): ${String(err?.message || err || '')}`);
    cacheRecord = null;
  }
  if (!cacheRecord) return false;

  const requestId = createCachedPageOpenRequestId(pageId);
  const snapshot = cachedPageSnapshot(cacheRecord, pageId);
  const signature = String(cacheRecord.signature || snapshotSignature(snapshot));

  state.current = {
    id: String(snapshot.id || pageId || ''),
    title: snapshot.title,
    description: snapshot.description,
    html: snapshot.html
  };
  cachePagesForSidebar([state.current]);
  if (typeof resetExternalSyncStateForCurrentPage === 'function') resetExternalSyncStateForCurrentPage(state.current.id);
  setCurrentBaseline();
  await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: Date.now() });
  renderCurrent();
  syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
  localStorage.setItem(LS.lastPageId, state.current.id);

  state.cachedPageOpen.pageId = String(state.current.id || '');
  state.cachedPageOpen.openRequestId = requestId;
  state.cachedPageOpen.openedFromCache = true;
  state.cachedPageOpen.cacheSignature = signature;
  state.cachedPageOpen.remoteStatus = 'checking';
  state.cachedPageOpen.saveBlockedReason = 'pending';
  state.cachedPageOpen.remoteCandidate = null;
  state.cachedPageOpen.lastErrorMessage = '';
  state.cachedPageOpen.verifiedAt = Number(cacheRecord.verifiedAt || 0);
  syncSaveAvailabilityState();

  syncPreviewMode({ immediate: true });
  setStatus(t('cachedOpenLoadedFromCacheChecking'));
  void maybePromptDraftRecoveryForCurrentPage(promptToken);
  void startCachedPageRemoteVerification(pageId, requestId, { promptToken, source: 'load-page-cache-verify' });
  return true;
}

async function loadPageWithCacheAwareFlow(pageId, promptToken) {
  if (await openPageFromLastSavedCacheIfAvailable(pageId, promptToken)) return;
  resetCachedPageOpenState(pageId);
  await loadPageFromRemoteDirect(pageId, promptToken);
}

async function retryCurrentPageRemoteVerification() {
  const pageId = String(state.current.id || '');
  const samePage = pageId && String(state.cachedPageOpen.pageId || '') === pageId;
  const status = String(state.cachedPageOpen.remoteStatus || '');
  if (!pageId || !samePage || !state.cachedPageOpen.openedFromCache) return false;
  if (status === 'checking') {
    setStatus(t('cachedOpenLoadedFromCacheChecking'));
    return false;
  }
  if (!canRetryCurrentPageRemoteVerification()) return false;
  const requestId = createCachedPageOpenRequestId(pageId);
  state.cachedPageOpen.pageId = pageId;
  state.cachedPageOpen.openRequestId = requestId;
  state.cachedPageOpen.openedFromCache = true;
  state.cachedPageOpen.remoteStatus = 'checking';
  state.cachedPageOpen.saveBlockedReason = 'pending';
  state.cachedPageOpen.lastErrorMessage = '';
  syncSaveAvailabilityState();
  setStatus(t('cachedOpenLoadedFromCacheChecking'));
  return startCachedPageRemoteVerification(pageId, requestId, { promptToken: state.drafts.promptToken, source: 'load-page-cache-verify-manual' });
}

async function handleExternalSyncCheckNowAction() {
  const pageId = String(state.current.id || '');
  const samePage = pageId && String(state.cachedPageOpen.pageId || '') === pageId;
  const remoteStatus = String(state.cachedPageOpen.remoteStatus || 'idle');
  if (samePage && state.cachedPageOpen.openedFromCache && (remoteStatus === 'checking' || remoteStatus === 'failed' || remoteStatus === 'conflict')) {
    await retryCurrentPageRemoteVerification();
    return;
  }
  await runExternalSyncManualCheck();
}
