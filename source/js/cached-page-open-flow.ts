interface CachedPageVerifyOptions {
  source?: string;
  promptToken?: number;
}

interface MarkCurrentPageRemoteVerifiedOptions {
  remoteStatus?: RemoteStatus;
  openedFromCache?: boolean;
  signature?: string;
}

function createCachedPageOpenRequestId(pageId: string = ''): string {
  return `${String(pageId || '')}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function cancelCachedPageRemoteVerification(): void {
  if (state.cachedPageOpen.remoteVerificationTimer) {
    clearTimeout(state.cachedPageOpen.remoteVerificationTimer);
    state.cachedPageOpen.remoteVerificationTimer = null;
  }
}

function scheduleCachedPageRemoteVerification(pageId: string, requestId: string, options: CachedPageVerifyOptions = {}): void {
  cancelCachedPageRemoteVerification();
  state.cachedPageOpen.remoteVerificationTimer = setTimeout(() => {
    state.cachedPageOpen.remoteVerificationTimer = null;
    if (!isActiveCachedPageOpenRequest(pageId, requestId)) {
      log('Remote verification skipped; request no longer active');
      return;
    }
    void startCachedPageRemoteVerification(pageId, requestId, options);
  }, 2000);
}

function resetCachedPageOpenState(pageId: string = ''): void {
  cancelCachedPageRemoteVerification();
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

function markCurrentPageRemoteVerified(options: MarkCurrentPageRemoteVerifiedOptions = {}): void {
  if (state.blank || !state.current.id) return;
  cancelCachedPageRemoteVerification();
  const verifiedAt = Date.now();
  const status = (options.remoteStatus || 'verified') as RemoteStatus;
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

function isActiveCachedPageOpenRequest(pageId: string = '', requestId: string = ''): boolean {
  const expectedPageId = String(pageId || '');
  const expectedRequestId = String(requestId || '');
  if (!expectedPageId || !expectedRequestId) return false;
  if (state.blank) return false;
  if (String(state.current.id || '') !== expectedPageId) return false;
  if (String(state.cachedPageOpen.pageId || '') !== expectedPageId) return false;
  if (String(state.cachedPageOpen.openRequestId || '') !== expectedRequestId) return false;
  return true;
}

function hasUserEditedSinceCachedOpen(pageId: string = ''): boolean {
  const currentPageId = String(state.current.id || '');
  const expectedPageId = String(pageId || '');
  if (!expectedPageId || currentPageId !== expectedPageId) return false;
  if (state.dirty) return true;
  updateCurrentFromInputs();
  return !sameSnapshot(currentSnapshotFromState(), currentBaselineSnapshot());
}

function cachedPageSnapshot(record: Partial<PageContentCacheRecord> = {}, pageId: string = ''): FiberyPage {
  const normalizedPageId = String(record.pageId || pageId || '').trim();
  return {
    id: normalizedPageId,
    title: String(record.title || ''),
    description: String(record.description || ''),
    html: String(record.html || '')
  };
}

async function loadPageFromRemoteDirect(pageId: string, promptToken: number): Promise<void> {
  setStatus(t('loading'));
  const pageRaw = await API.loadPage(pageId, { source: 'load-page' });
  const page: FiberyPage = {
    id: String(pageRaw?.id || pageId),
    title: String(pageRaw?.title || ''),
    description: String(pageRaw?.description || ''),
    html: String(pageRaw?.html || '')
  };
  state.current = { id: page.id, title: page.title, description: page.description, html: page.html };
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

async function startCachedPageRemoteVerification(pageId: string, requestId: string, options: CachedPageVerifyOptions = {}): Promise<boolean> {
  const source = String(options.source || 'load-page-cache-verify');
  if (!pageId || !requestId) return false;

  if (isActiveCachedPageOpenRequest(pageId, requestId)) {
    state.cachedPageOpen.remoteStatus = 'checking';
    state.cachedPageOpen.saveBlockedReason = 'pending';
    state.cachedPageOpen.lastErrorMessage = '';
    syncSaveAvailabilityState();
    setStatus(t('cachedOpenLoadedFromCacheChecking'));
  }

  try {
    const remoteRaw = await API.loadPage(pageId, { source });
    const remoteSnapshot: FiberyPage = {
      id: String(remoteRaw?.id || pageId),
      title: String(remoteRaw?.title || ''),
      description: String(remoteRaw?.description || ''),
      html: String(remoteRaw?.html || '')
    };
    const verifiedAt = Date.now();
    const remoteSignature = snapshotSignature(remoteSnapshot);

    // Check active BEFORE writing to cache to prevent stale requests from updating cache
    if (!isActiveCachedPageOpenRequest(pageId, requestId)) {
      log('Remote verification skipped; request no longer active');
      return true;
    }

    const baselineSignature = snapshotSignature(currentBaselineSnapshot());
    const cacheSignature = String(state.cachedPageOpen.cacheSignature || baselineSignature);
    const sameAsCache = remoteSignature === cacheSignature;
    // Conservative: check state.dirty as additional local-edit signal
    const userEdited = hasUserEditedSinceCachedOpen(pageId);

    state.cachedPageOpen.lastErrorMessage = '';
    state.cachedPageOpen.verifiedAt = verifiedAt;

    if (sameAsCache) {
      // Only update Last Saved Cache when remote matches — never on conflict
      await savePageContentCacheSafe(remoteSnapshot, { pageId, source: 'fibery-load', cachedAt: verifiedAt, verifiedAt, signature: remoteSignature });
      state.cachedPageOpen.cacheSignature = remoteSignature;
      state.cachedPageOpen.remoteStatus = 'verified';
      state.cachedPageOpen.saveBlockedReason = '';
      state.cachedPageOpen.remoteCandidate = null;
      if (typeof clearExternalSyncCandidateForCurrentPage === 'function') {
        clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: false });
      }
      syncSaveAvailabilityState();
      syncPreviewMode({ immediate: true });
      setStatus(t('cachedOpenVerifiedStatus'));
      return true;
    }

    // Remote differs from cache: mandatory comparator regardless of local edits.
    // Never apply remote automatically — user must choose explicitly.
    log(userEdited
      ? 'Remote differs from cache; local edit detected → mandatory conflict comparison'
      : 'Remote differs from cache; no local edit → mandatory conflict comparison');
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
    syncPreviewMode({ immediate: true });
    setStatus(t('cachedOpenConflictDetectedStatus'));
    if (typeof openConflictCompareModal === 'function') openConflictCompareModal();
    return false;
  } catch (err) {
    if (!isActiveCachedPageOpenRequest(pageId, requestId)) return false;
    const message = String((err as Error)?.message || err || '');
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

async function openPageFromLastSavedCacheIfAvailable(pageId: string, promptToken: number): Promise<boolean> {
  let cacheRecord: PageContentCacheRecord | null = null;
  try {
    cacheRecord = await getPageContentCache(pageId);
  } catch (err) {
    log(`Last Saved Cache read failed (${pageId}): ${String((err as Error)?.message || err || '')}`);
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
  // Delay remote verification ~2s to avoid API spam on rapid navigation and give
  // the user a moment to start editing before conflict detection fires
  scheduleCachedPageRemoteVerification(pageId, requestId, { promptToken, source: 'load-page-cache-verify' });
  return true;
}

async function loadPageWithCacheAwareFlow(pageId: string, promptToken: number): Promise<void> {
  if (await openPageFromLastSavedCacheIfAvailable(pageId, promptToken)) return;
  resetCachedPageOpenState(pageId);
  await loadPageFromRemoteDirect(pageId, promptToken);
}

async function retryCurrentPageRemoteVerification(): Promise<boolean> {
  const pageId = String(state.current.id || '');
  const samePage = pageId && String(state.cachedPageOpen.pageId || '') === pageId;
  const status = String(state.cachedPageOpen.remoteStatus || '');
  if (!pageId || !samePage || !state.cachedPageOpen.openedFromCache) return false;
  if (status === 'checking') {
    setStatus(t('cachedOpenLoadedFromCacheChecking'));
    return false;
  }
  if (!canRetryCurrentPageRemoteVerification()) return false;
  cancelCachedPageRemoteVerification();
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

async function handleExternalSyncCheckNowAction(): Promise<void> {
  const pageId = String(state.current.id || '');
  const samePage = pageId && String(state.cachedPageOpen.pageId || '') === pageId;
  const remoteStatus = String(state.cachedPageOpen.remoteStatus || 'idle');
  if (samePage && state.cachedPageOpen.openedFromCache && (remoteStatus === 'checking' || remoteStatus === 'failed' || remoteStatus === 'conflict')) {
    await retryCurrentPageRemoteVerification();
    return;
  }
  await runExternalSyncManualCheck();
}
