function hasRealUnsavedChangesForCurrentPage(options = {}) {
  if (state.blank) return false;
  if (options.syncFromInputs !== false) updateCurrentFromInputs();
  const currentSnapshot = currentSnapshotFromState();
  const baselineSnapshot = currentBaselineSnapshot();
  return !sameSnapshot(currentSnapshot, baselineSnapshot);
}

function hasUnsavedPageChangesForTransition() {
  return hasRealUnsavedChangesForCurrentPage({ syncFromInputs: true });
}

function syncCurrentSnapshotBaselineAndDirty(options = {}) {
  if (state.blank) {
    markDirty(false);
    syncBeforeUnloadWarningState();
    return;
  }
  updateCurrentFromInputs();
  if (options.alignBaseline) setCurrentBaseline();
  syncDirtyWithBaseline();
}

function handleBeforeUnloadWarning(event) {
  if (!hasRealUnsavedChangesForCurrentPage({ syncFromInputs: true })) return;
  event.preventDefault();
  event.returnValue = true;
  return true;
}

function syncBeforeUnloadWarningState() {
  const shouldWarn = hasRealUnsavedChangesForCurrentPage({ syncFromInputs: false });
  if (shouldWarn && !state.unsavedBeforeUnloadWarningActive) {
    window.addEventListener('beforeunload', handleBeforeUnloadWarning);
    state.unsavedBeforeUnloadWarningActive = true;
    return;
  }
  if (!shouldWarn && state.unsavedBeforeUnloadWarningActive) {
    window.removeEventListener('beforeunload', handleBeforeUnloadWarning);
    state.unsavedBeforeUnloadWarningActive = false;
  }
}

function openUnsavedTransitionModal() {
  if (!els.unsavedTransitionModal) return Promise.resolve('cancel');
  els.unsavedTransitionModal.classList.remove('hidden');
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  return new Promise(resolve => {
    state.unsavedTransitionResolver = resolve;
  });
}

function closeUnsavedTransitionModal(choice = 'cancel') {
  if (els.unsavedTransitionModal) els.unsavedTransitionModal.classList.add('hidden');
  const resolver = state.unsavedTransitionResolver;
  state.unsavedTransitionResolver = null;
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  if (resolver) resolver(choice);
}

async function keepDraftBeforeTransition() {
  if (state.blank) return;
  updateCurrentFromInputs();
  syncDirtyWithBaseline();
  await saveCurrentDraftNow({ force: true });
  syncBeforeUnloadWarningState();
}

async function discardCurrentUnsavedChanges() {
  if (state.blank) return;
  updateCurrentFromInputs();
  const discardedSignature = snapshotSignature(currentSnapshotFromState());
  const draftKey = draftKeyForPage(state.current.id || '');
  await deleteDraftByKey(draftKey);
  if (state.current.id) await clearAutosaveHistoryBySignature(state.current.id, discardedSignature);

  const baseline = currentBaselineSnapshot();
  state.current.title = baseline.title;
  state.current.description = baseline.description;
  state.current.html = baseline.html;
  renderCurrent();
  syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
  if (typeof clearExternalSyncCandidateForCurrentPage === 'function') clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: true });
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  syncPreviewMode({ immediate: true });
}

async function runWithUnsavedPageTransitionGuard(proceed) {
  if (typeof proceed !== 'function') return false;
  if (state.unsavedTransitionBusy) return false;
  state.unsavedTransitionBusy = true;
  try {
    if (!hasUnsavedPageChangesForTransition()) {
      await proceed();
      return true;
    }

    const choice = await openUnsavedTransitionModal();
    if (choice === 'cancel') return false;

    if (choice === 'save-open') {
      const saved = await savePage('save');
      if (!saved) {
        setStatus(t('unsavedTransitionSaveFailed'));
        return false;
      }
      await proceed();
      return true;
    }

    if (choice === 'keep-draft') {
      await keepDraftBeforeTransition();
      await proceed();
      return true;
    }

    if (choice === 'discard') {
      await discardCurrentUnsavedChanges();
      await proceed();
      return true;
    }

    return false;
  } catch (err) {
    log(err?.message || String(err));
    return false;
  } finally {
    state.unsavedTransitionBusy = false;
    if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  }
}
