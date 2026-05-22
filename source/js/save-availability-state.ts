interface SyncSaveAvailabilityOptions {
  announce?: boolean;
}

function currentCachedPageRemoteStatus(): RemoteStatus {
  const pageId = String(state.current.id || '');
  if (!pageId) return 'idle';
  if (String(state.cachedPageOpen.pageId || '') !== pageId) return 'idle';
  return (state.cachedPageOpen.remoteStatus || 'idle') as RemoteStatus;
}

function shouldForceLocalPreviewForCachedOpen(): boolean {
  const status = currentCachedPageRemoteStatus();
  if (!String(state.cachedPageOpen.openedFromCache || '')) return false;
  // conflict-resolved-local: user chose local/cache; keep local preview until manual save publishes to Fibery.
  return status === 'checking' || status === 'failed' || status === 'conflict' || status === 'conflict-resolved-local';
}

function shouldKeepCachedOpenStatusMessage(): boolean {
  const status = currentCachedPageRemoteStatus();
  if (!String(state.cachedPageOpen.openedFromCache || '')) return false;
  return status === 'failed' || status === 'conflict';
}

function saveBlockedReasonForCurrentPage(): SaveBlockedReason {
  const pageId = String(state.current.id || '');
  if (!pageId) return '';
  if (!state.cachedPageOpen.openedFromCache) return '';
  if (String(state.cachedPageOpen.pageId || '') !== pageId) return '';
  const status = String(state.cachedPageOpen.remoteStatus || 'idle');
  if (status === 'checking') return 'pending';
  if (status === 'failed') return 'failed';
  if (status === 'conflict') return 'conflict';
  if (status === 'conflict-resolved-local') return '';
  return '';
}

function saveBlockedStatusKey(reason: SaveBlockedReason = ''): string {
  if (reason === 'pending') return 'cachedOpenSaveBlockedPending';
  if (reason === 'failed') return 'cachedOpenSaveBlockedFailed';
  if (reason === 'conflict') return 'cachedOpenSaveBlockedConflict';
  return '';
}

function saveBlockedTooltipKey(reason: SaveBlockedReason = ''): string {
  if (reason === 'pending') return 'cachedOpenSaveBlockedPendingTooltip';
  if (reason === 'failed') return 'cachedOpenSaveBlockedFailedTooltip';
  if (reason === 'conflict') return 'cachedOpenSaveBlockedConflictTooltip';
  return '';
}

function isSaveBlockedByRemoteVerification(): boolean {
  return !!saveBlockedReasonForCurrentPage();
}

function canRetryCurrentPageRemoteVerification(): boolean {
  const pageId = String(state.current.id || '');
  if (!pageId) return false;
  if (!state.cachedPageOpen.openedFromCache) return false;
  if (String(state.cachedPageOpen.pageId || '') !== pageId) return false;
  const status = String(state.cachedPageOpen.remoteStatus || 'idle');
  return status === 'failed' || status === 'conflict';
}

function syncCachedOpenCheckNowButtonLabel(): void {
  if (!els.externalSyncCheckNowBtn) return;
  const labelKey = canRetryCurrentPageRemoteVerification() ? 'cachedOpenRetryVerifyNow' : 'externalSyncCheckNow';
  const label = t(labelKey);
  els.externalSyncCheckNowBtn.textContent = label;
  els.externalSyncCheckNowBtn.title = label;
}

function shouldShowExternalSyncCheckNowButton(): boolean {
  if (state.blank || !state.current.id || !state.externalSync.enabled) return false;
  const currentPageId = String(state.current.id || '');
  const cachedPageId = String(state.cachedPageOpen.pageId || '');
  const cachedStatus = String(state.cachedPageOpen.remoteStatus || 'idle');
  const hasCachedRetryAction = !!state.cachedPageOpen.openedFromCache && cachedPageId === currentPageId && (cachedStatus === 'failed' || cachedStatus === 'conflict');
  if (hasCachedRetryAction) return true;
  const hasExternalSyncErrorAction = state.externalSync.pageId === currentPageId && (state.externalSync.status === 'error' || !!state.externalSync.lastErrorMessage);
  return hasExternalSyncErrorAction;
}

function syncExternalSyncCheckNowVisibility(): void {
  if (!els.externalSyncCheckNowBtn) return;
  const shouldShow = shouldShowExternalSyncCheckNowButton();
  els.externalSyncCheckNowBtn.classList.toggle('hidden', !shouldShow);
  if (!shouldShow) els.externalSyncCheckNowBtn.disabled = false;
}

function syncSaveAvailabilityState(options: SyncSaveAvailabilityOptions = {}): boolean {
  if (!els.saveBtn) return true;
  const blockedReason = saveBlockedReasonForCurrentPage();
  state.cachedPageOpen.saveBlockedReason = blockedReason;
  const disabled = !state.isAdmin || state.saving || state.blank || !!blockedReason;
  els.saveBtn.disabled = disabled;

  const blockedTooltipKey = saveBlockedTooltipKey(blockedReason);
  if (blockedTooltipKey) {
    els.saveBtn.title = t(blockedTooltipKey);
  } else if (!state.isAdmin) {
    els.saveBtn.title = t('readOnly');
  } else {
    els.saveBtn.title = t('save');
  }

  syncCachedOpenCheckNowButtonLabel();
  syncExternalSyncCheckNowVisibility();

  if (options.announce && blockedReason) {
    const statusKey = saveBlockedStatusKey(blockedReason);
    if (statusKey) setStatus(t(statusKey));
  }
  if (typeof syncConflictCompareButtonState === 'function') syncConflictCompareButtonState();
  return !blockedReason;
}

async function requestSavePage(action: string = 'save', options: { announce?: boolean } = {}): Promise<boolean> {
  if (!state.isAdmin || state.blank) return false;
  const blockedReason = saveBlockedReasonForCurrentPage();
  if (blockedReason) {
    syncSaveAvailabilityState({ announce: options.announce !== false });
    return false;
  }
  return savePage(action);
}
