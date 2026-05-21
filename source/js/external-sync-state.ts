interface ClearExternalSyncCandidateOptions {
  clearDismissed?: boolean;
  clearNotified?: boolean;
}

function externalSyncSnapshotFromPage(page: Partial<FiberyPage> = {}): FiberyPage {
  return {
    id: String(page?.id || ''),
    title: String(page?.title || ''),
    description: String(page?.description || ''),
    html: String(page?.html || '')
  };
}

function clearExternalSyncCandidateForCurrentPage(options: ClearExternalSyncCandidateOptions = {}): void {
  state.externalSync.remoteCandidate = null;
  state.externalSync.remoteSignature = '';
  state.externalSync.baselineSignatureAtDetection = '';
  state.externalSync.status = 'idle';
  if (options.clearDismissed) state.externalSync.dismissedSignature = '';
  if (options.clearNotified) state.externalSync.lastNotifiedSignature = '';
  if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
}

function resetExternalSyncStateForCurrentPage(pageId: string = ''): void {
  state.externalSync.pageId = String(pageId || '');
  state.externalSync.checking = false;
  state.externalSync.lastCheckedAt = 0;
  state.externalSync.lastErrorAt = 0;
  state.externalSync.lastErrorMessage = '';
  state.externalSync.lastSkipReason = '';
  state.externalSync.lastSkipLoggedAt = 0;
  state.externalSync.localBaselineSignature = '';
  state.externalSync.dismissedSignature = '';
  state.externalSync.lastNotifiedSignature = '';
  clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: true });
  if (!state.externalSync.pageId && typeof stopExternalSyncPolling === 'function') stopExternalSyncPolling();
}

function syncExternalSyncBaselineState(): void {
  const pageId = state.blank ? '' : String(state.current.id || '');
  if (pageId !== state.externalSync.pageId) resetExternalSyncStateForCurrentPage(pageId);
  if (!pageId) {
    if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
    if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
    return;
  }

  const baselineSignature = snapshotSignature(currentBaselineSnapshot());
  state.externalSync.localBaselineSignature = baselineSignature;
  if (state.externalSync.remoteSignature && state.externalSync.remoteSignature === baselineSignature) {
    clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: true });
  }
  if (state.externalSync.dismissedSignature && state.externalSync.dismissedSignature === baselineSignature) {
    state.externalSync.dismissedSignature = '';
  }
  if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
}

function captureExternalSyncRemoteCandidate(remotePage: Partial<FiberyPage> = {}): boolean {
  if (state.blank || !state.current.id) return false;
  if (String(remotePage?.id || state.current.id) !== String(state.current.id || '')) return false;

  const remoteSnapshot = externalSyncSnapshotFromPage(remotePage);
  const remoteSignature = snapshotSignature(remoteSnapshot);
  const baselineSignature = snapshotSignature(currentBaselineSnapshot());
  state.externalSync.localBaselineSignature = baselineSignature;

  if (remoteSignature === baselineSignature) {
    clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: true });
    if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
    return false;
  }

  const previousSignature = state.externalSync.remoteSignature;
  state.externalSync.remoteCandidate = {
    id: state.current.id,
    title: remoteSnapshot.title,
    description: remoteSnapshot.description,
    html: remoteSnapshot.html,
    signature: remoteSignature,
    detectedAt: Date.now()
  };
  state.externalSync.remoteSignature = remoteSignature;
  state.externalSync.baselineSignatureAtDetection = baselineSignature;
  state.externalSync.status = 'changed';
  if (previousSignature !== remoteSignature && state.externalSync.dismissedSignature && state.externalSync.dismissedSignature !== remoteSignature) {
    state.externalSync.dismissedSignature = '';
  }
  if (previousSignature !== remoteSignature && state.externalSync.dismissedSignature !== remoteSignature && state.externalSync.lastNotifiedSignature !== remoteSignature) {
    state.externalSync.lastNotifiedSignature = remoteSignature;
    const logKey = hasRealUnsavedChangesForCurrentPage({ syncFromInputs: false })
      ? 'externalSyncDetectedWithLocalEditsLog'
      : 'externalSyncDetectedLog';
    log(t(logKey));
  }
  if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
  return true;
}
