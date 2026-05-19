function currentCachedPageRemoteStatus() {
  const pageId = String(state.current.id || '');
  if (!pageId) return 'idle';
  if (String(state.cachedPageOpen.pageId || '') !== pageId) return 'idle';
  return String(state.cachedPageOpen.remoteStatus || 'idle');
}

function shouldForceLocalPreviewForCachedOpen() {
  const status = currentCachedPageRemoteStatus();
  if (!String(state.cachedPageOpen.openedFromCache || '')) return false;
  return status === 'checking' || status === 'failed' || status === 'conflict';
}

function shouldKeepCachedOpenStatusMessage() {
  const status = currentCachedPageRemoteStatus();
  if (!String(state.cachedPageOpen.openedFromCache || '')) return false;
  return status === 'checking' || status === 'verified' || status === 'stale-applied' || status === 'failed' || status === 'conflict';
}

function saveBlockedReasonForCurrentPage() {
  const pageId = String(state.current.id || '');
  if (!pageId) return '';
  if (!state.cachedPageOpen.openedFromCache) return '';
  if (String(state.cachedPageOpen.pageId || '') !== pageId) return '';
  const status = String(state.cachedPageOpen.remoteStatus || 'idle');
  if (status === 'checking') return 'pending';
  if (status === 'failed') return 'failed';
  if (status === 'conflict') return 'conflict';
  return '';
}

function saveBlockedStatusKey(reason = '') {
  if (reason === 'pending') return 'cachedOpenSaveBlockedPending';
  if (reason === 'failed') return 'cachedOpenSaveBlockedFailed';
  if (reason === 'conflict') return 'cachedOpenSaveBlockedConflict';
  return '';
}

function saveBlockedTooltipKey(reason = '') {
  if (reason === 'pending') return 'cachedOpenSaveBlockedPendingTooltip';
  if (reason === 'failed') return 'cachedOpenSaveBlockedFailedTooltip';
  if (reason === 'conflict') return 'cachedOpenSaveBlockedConflictTooltip';
  return '';
}

function isSaveBlockedByRemoteVerification() {
  return !!saveBlockedReasonForCurrentPage();
}

function canRetryCurrentPageRemoteVerification() {
  const pageId = String(state.current.id || '');
  if (!pageId) return false;
  if (!state.cachedPageOpen.openedFromCache) return false;
  if (String(state.cachedPageOpen.pageId || '') !== pageId) return false;
  const status = String(state.cachedPageOpen.remoteStatus || 'idle');
  return status === 'failed' || status === 'conflict';
}

function syncCachedOpenCheckNowButtonLabel() {
  if (!els.externalSyncCheckNowBtn) return;
  const labelKey = canRetryCurrentPageRemoteVerification() ? 'cachedOpenRetryVerifyNow' : 'externalSyncCheckNow';
  const label = t(labelKey);
  els.externalSyncCheckNowBtn.textContent = label;
  els.externalSyncCheckNowBtn.title = label;
}

function syncSaveAvailabilityState(options = {}) {
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

  if (options.announce && blockedReason) {
    const statusKey = saveBlockedStatusKey(blockedReason);
    if (statusKey) setStatus(t(statusKey));
  }
  return !blockedReason;
}

async function requestSavePage(action = 'save', options = {}) {
  if (!state.isAdmin || state.blank) return false;
  const blockedReason = saveBlockedReasonForCurrentPage();
  if (blockedReason) {
    syncSaveAvailabilityState({ announce: options.announce !== false });
    return false;
  }
  return savePage(action);
}

