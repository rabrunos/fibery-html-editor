function guardErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message || error || '');
  }
  return String(error || '');
}

function hasRealUnsavedChangesForCurrentPage(options: UnsavedChangeCheckOptions = {}): boolean {
  if (state.blank) return false;
  if (options.syncFromInputs !== false) updateCurrentFromInputs();
  const currentSnapshot = currentSnapshotFromState();
  const baselineSnapshot = currentBaselineSnapshot();
  return !sameSnapshot(currentSnapshot, baselineSnapshot);
}

function hasUnsavedPageChangesForTransition(): boolean {
  return hasRealUnsavedChangesForCurrentPage({ syncFromInputs: true });
}

function syncCurrentSnapshotBaselineAndDirty(options: SyncCurrentSnapshotOptions = {}): void {
  if (state.blank) {
    markDirty(false);
    syncBeforeUnloadWarningState();
    return;
  }
  updateCurrentFromInputs();
  if (options.alignBaseline) setCurrentBaseline();
  syncDirtyWithBaseline();
}

function handleBeforeUnloadWarning(event: BeforeUnloadEvent): true | void {
  if (!hasRealUnsavedChangesForCurrentPage({ syncFromInputs: true })) return;
  event.preventDefault();
  event.returnValue = true;
  return true;
}

function syncBeforeUnloadWarningState(): void {
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

function openUnsavedTransitionModal(): Promise<UnsavedTransitionChoice> {
  if (!els.unsavedTransitionModal) return Promise.resolve('cancel');
  els.unsavedTransitionModal.classList.remove('hidden');
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  return new Promise<UnsavedTransitionChoice>((resolve) => {
    state.unsavedTransitionResolver = resolve;
  });
}

function closeUnsavedTransitionModal(choice: UnsavedTransitionChoice = 'cancel'): void {
  if (els.unsavedTransitionModal) els.unsavedTransitionModal.classList.add('hidden');
  const resolver = state.unsavedTransitionResolver;
  state.unsavedTransitionResolver = null;
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  if (resolver) resolver(choice);
}

async function keepDraftBeforeTransition(): Promise<void> {
  if (state.blank) return;
  updateCurrentFromInputs();
  syncDirtyWithBaseline();
  await saveCurrentDraftNow({ force: true });
  syncBeforeUnloadWarningState();
}

async function discardCurrentUnsavedChanges(): Promise<void> {
  if (state.blank) return;
  updateCurrentFromInputs();
  const draftKey = draftKeyForPage(state.current.id || '');
  await deleteDraftByKey(draftKey);

  const baseline = currentBaselineSnapshot();
  state.current.title = baseline.title;
  state.current.description = baseline.description;
  state.current.html = baseline.html;
  renderCurrent();
  syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });
  if (typeof clearExternalSyncCandidateForCurrentPage === 'function') {
    clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: true });
  }
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  syncPreviewMode({ immediate: true });
}

async function runWithUnsavedPageTransitionGuard(proceed?: (() => void | Promise<void>) | null): Promise<boolean> {
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
        if (!(typeof isSaveBlockedByRemoteVerification === 'function' && isSaveBlockedByRemoteVerification())) {
          setStatus(t('unsavedTransitionSaveFailed'));
        }
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
  } catch (error) {
    log(guardErrorMessage(error));
    return false;
  } finally {
    state.unsavedTransitionBusy = false;
    if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  }
}
