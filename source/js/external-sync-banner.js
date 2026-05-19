function hasVisibleExternalSyncNotice() {
  if (!state.externalSync.enabled) return false;
  if (state.blank || !state.current.id) return false;
  if (!state.externalSync.remoteCandidate || !state.externalSync.remoteSignature) return false;
  if (state.externalSync.pageId && state.externalSync.pageId !== state.current.id) return false;
  const baselineSignature = snapshotSignature(currentBaselineSnapshot());
  if (state.externalSync.remoteSignature === baselineSignature) return false;
  if (state.externalSync.dismissedSignature && state.externalSync.dismissedSignature === state.externalSync.remoteSignature) return false;
  return true;
}

function externalSyncNoticeMessageKey() {
  return hasRealUnsavedChangesForCurrentPage({ syncFromInputs: false })
    ? 'externalSyncMessageWithLocalEdits'
    : 'externalSyncMessageNoLocalEdits';
}

function renderExternalSyncNotice() {
  if (!els.externalSyncNotice || !els.externalSyncNoticeTitle || !els.externalSyncNoticeMessage) return;
  if (!hasVisibleExternalSyncNotice()) {
    els.externalSyncNotice.classList.add('hidden');
    return;
  }

  els.externalSyncNoticeTitle.textContent = t('externalSyncDetectedTitle');
  els.externalSyncNoticeMessage.textContent = t(externalSyncNoticeMessageKey());
  if (els.externalSyncDismissBtn) {
    els.externalSyncDismissBtn.textContent = t('externalSyncDismiss');
    els.externalSyncDismissBtn.title = t('externalSyncDismiss');
  }
  els.externalSyncNotice.classList.remove('hidden');
}

function dismissExternalSyncNotice() {
  if (!state.externalSync.remoteSignature) return;
  state.externalSync.dismissedSignature = state.externalSync.remoteSignature;
  renderExternalSyncNotice();
}
