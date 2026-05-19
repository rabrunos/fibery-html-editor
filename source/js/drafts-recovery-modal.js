function closeDraftRecoveryModal() {
  disposeDraftDiffEditor();
  if (els.draftCodeDiffMonaco) els.draftCodeDiffMonaco.classList.add('hidden');
  if (els.draftCodeDiffFallback) els.draftCodeDiffFallback.classList.add('hidden');
  if (els.draftFallbackCurrentPane) els.draftFallbackCurrentPane.innerHTML = '';
  if (els.draftFallbackLocalPane) els.draftFallbackLocalPane.innerHTML = '';
  els.draftRecoveryModal.classList.add('hidden');
  state.drafts.activeDraftKey = '';
  state.drafts.activeRecovery = null;
}
function openDraftRecoveryModal({ key, pageId, currentSnapshot, draftRecord, mode = 'draft', titleKey = 'draftRecoveryTitle', subtitle = '', rightTitleKey = 'draftLocalVersion', leftTitleKey = 'draftCurrentVersion', leftSubtitle = '', rightSubtitle = '', restoreTextKey = 'restoreDraft', showDiscard = true } = {}) {
  if (!draftRecord) return;
  const draftSnapshot = draftSnapshotFromRecord(draftRecord);
  const diff = draftDiffMap(currentSnapshot, draftSnapshot);
  const draftUpdatedLabel = draftUpdatedAtLabel(Number(draftRecord.updatedAt || draftRecord.createdAt || 0));
  const computedLeftSubtitle = leftSubtitle || (mode === 'draft' ? t('draftLoadedFromFibery') : '');
  const computedRightSubtitle = rightSubtitle || `${t('draftUpdatedAt')}: ${draftUpdatedLabel || '-'}`;
  els.draftRecoveryTitle.textContent = t(titleKey);
  els.draftRecoverySubtitle.textContent = subtitle || (pageId ? t('draftRecoverySubtitleSaved') : t('draftRecoverySubtitleUnsaved'));
  els.draftCurrentColumn.innerHTML = draftColumnHtml(t(leftTitleKey), currentSnapshot, diff, { subtitle: computedLeftSubtitle });
  els.draftLocalColumn.innerHTML = draftColumnHtml(t(rightTitleKey), draftSnapshot, diff, { subtitle: computedRightSubtitle });
  renderDraftCodeDiff(currentSnapshot, draftSnapshot);
  els.restoreDraftBtn.textContent = t(restoreTextKey);
  els.keepCurrentVersionBtn.textContent = t('keepCurrentVersion');
  els.discardDraftBtn.classList.toggle('hidden', !showDiscard);
  state.drafts.activeDraftKey = key;
  state.drafts.activeRecovery = { mode, key, pageId: pageId || '', record: draftRecord };
  els.draftRecoveryModal.classList.remove('hidden');
}
async function keepCurrentVersionFromDraft() {
  const recovery = state.drafts.activeRecovery;
  if (recovery?.mode === 'draft' && recovery.key) {
    const record = state.drafts.byKey[recovery.key];
    const signature = record?.signature || (record ? snapshotSignature(record) : '');
    if (signature) {
      setDismissedRecovery(recovery.key, signature);
      state.drafts.reopenCandidate = { key: recovery.key };
    }
    setStatus(t('draftKeptCurrent'));
  }
  updateRecoveryReopenButton();
  closeDraftRecoveryModal();
}
async function discardDraftFromModal() {
  const recovery = state.drafts.activeRecovery;
  const key = recovery?.key || state.drafts.activeDraftKey;
  await deleteDraftByKey(key);
  if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
  updateRecoveryReopenButton();
  closeDraftRecoveryModal();
  setStatus(t('draftDiscarded'));
}
async function restoreDraftFromModal() {
  const recovery = state.drafts.activeRecovery;
  if (!recovery) { closeDraftRecoveryModal(); return; }
  const key = recovery.key || state.drafts.activeDraftKey;
  const record = recovery.record || (key ? state.drafts.byKey[key] : null);
  if (!record) { closeDraftRecoveryModal(); return; }
  const snapshot = draftSnapshotFromRecord(record);
  state.current.title = snapshot.title;
  state.current.description = snapshot.description;
  state.current.html = snapshot.html;
  renderCurrent();
  markDirty(true);
  syncPreviewMode({ immediate: true });
  if (key) clearDismissedRecovery(key);
  if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
  updateRecoveryReopenButton();
  closeDraftRecoveryModal();
  setStatus(recovery.mode === 'history-manual' ? t('restoredFromHistory') : t('draftRestored'));
}
async function maybePromptDraftRecoveryForCurrentPage(promptToken = state.drafts.promptToken) {
  if (!state.db || state.blank) return;
  if (promptToken !== state.drafts.promptToken) return;
  const key = draftKeyForPage(state.current.id || '');
  if (!key) return;
  const record = state.drafts.byKey[key];
  if (!record) return;
  const draftSnapshot = draftSnapshotFromRecord(record);
  if (!shouldPersistDraftSnapshot(draftSnapshot, record.pageId || '')) { await deleteDraftByKey(key); return; }
  const currentSnapshot = currentSnapshotFromState();
  if (sameSnapshot(currentSnapshot, draftSnapshot)) { await deleteDraftByKey(key); return; }
  const signature = record.signature || snapshotSignature(record);
  if (state.drafts.dismissedMap[key] && state.drafts.dismissedMap[key] === signature) {
    state.drafts.reopenCandidate = { key };
    updateRecoveryReopenButton();
    return;
  }
  state.drafts.reopenCandidate = null;
  updateRecoveryReopenButton();
  openDraftRecoveryModal({ key, pageId: state.current.id || '', currentSnapshot, draftRecord: record, mode: 'draft' });
}
async function maybePromptUnsavedDraftRecovery(promptToken = state.drafts.promptToken) {
  if (!state.db || !state.blank) return;
  if (promptToken !== state.drafts.promptToken) return;
  const key = draftKeyForPage('');
  const record = state.drafts.byKey[key];
  if (!record) return;
  const draftSnapshot = draftSnapshotFromRecord(record);
  if (!shouldPersistDraftSnapshot(draftSnapshot, '')) { await deleteDraftByKey(key); return; }
  const blankSnapshot = { title: '', description: '', html: '' };
  if (sameSnapshot(blankSnapshot, draftSnapshot)) { await deleteDraftByKey(key); return; }
  const signature = record.signature || snapshotSignature(record);
  if (state.drafts.dismissedMap[key] && state.drafts.dismissedMap[key] === signature) {
    state.drafts.reopenCandidate = { key };
    updateRecoveryReopenButton();
    return;
  }
  state.drafts.reopenCandidate = null;
  updateRecoveryReopenButton();
  openDraftRecoveryModal({ key, pageId: '', currentSnapshot: blankSnapshot, draftRecord: record, mode: 'draft' });
}
function openRecoveryFromButton() {
  const key = state.drafts.reopenCandidate?.key;
  if (!key) return;
  if (state.blank && !String(key).startsWith('unsaved:')) return;
  const record = state.drafts.byKey[key];
  if (!record) {
    state.drafts.reopenCandidate = null;
    updateRecoveryReopenButton();
    return;
  }
  const currentSnapshot = state.blank ? { title: '', description: '', html: '' } : currentSnapshotFromState();
  openDraftRecoveryModal({ key, pageId: state.current.id || '', currentSnapshot, draftRecord: record, mode: 'draft' });
}
