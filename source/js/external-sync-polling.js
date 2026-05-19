function hasOpenExternalSyncBlockingModal() {
  if (!els.unsavedTransitionModal || !els.confirmModal || !els.draftRecoveryModal) return false;
  if (!els.unsavedTransitionModal.classList.contains('hidden')) return true;
  if (!els.confirmModal.classList.contains('hidden')) return true;
  if (!els.draftRecoveryModal.classList.contains('hidden')) return true;
  return false;
}

function shouldPauseExternalSyncPolling() {
  if (!state.externalSync.enabled) return true;
  if (state.blank || !state.current.id) return true;
  if (document.hidden) return true;
  if (state.saving || state.loadingPage) return true;
  if (state.externalSync.checking) return true;
  if (state.unsavedTransitionBusy || !!state.unsavedTransitionResolver) return true;
  if (state.update.checking || state.update.applying || state.update.rollbacking) return true;
  if (hasOpenExternalSyncBlockingModal()) return true;
  return false;
}

function stopExternalSyncPolling() {
  if (!state.externalSync.timer) return;
  window.clearTimeout(state.externalSync.timer);
  state.externalSync.timer = null;
}

function scheduleExternalSyncPolling(delayMs = state.externalSync.intervalMs) {
  stopExternalSyncPolling();
  if (!state.externalSync.enabled) return;
  const safeDelay = Math.max(1000, Number(delayMs || state.externalSync.intervalMs || 60000));
  state.externalSync.timer = window.setTimeout(() => {
    state.externalSync.timer = null;
    void runExternalSyncPollingCycle();
  }, safeDelay);
}

async function checkExternalSyncNow() {
  if (shouldPauseExternalSyncPolling()) return false;
  const pageId = String(state.current.id || '');
  if (!pageId) return false;
  state.externalSync.checking = true;
  state.externalSync.status = 'checking';
  try {
    const remotePage = await API.loadPage(pageId);
    if (state.blank || String(state.current.id || '') !== pageId) return false;
    captureExternalSyncRemoteCandidate(remotePage || {});
    state.externalSync.lastCheckedAt = Date.now();
    state.externalSync.lastErrorAt = 0;
    state.externalSync.lastErrorMessage = '';
    return true;
  } catch (err) {
    state.externalSync.lastErrorAt = Date.now();
    state.externalSync.lastErrorMessage = String(err?.message || err || '');
    state.externalSync.status = 'error';
    log(`${t('externalSyncCheckErrorLog')}: ${state.externalSync.lastErrorMessage}`);
    return false;
  } finally {
    state.externalSync.checking = false;
  }
}

async function runExternalSyncPollingCycle(options = {}) {
  if (!state.externalSync.enabled) return;
  if (!options.force && shouldPauseExternalSyncPolling()) {
    stopExternalSyncPolling();
    return;
  }
  await checkExternalSyncNow();
  if (shouldPauseExternalSyncPolling()) {
    stopExternalSyncPolling();
    return;
  }
  scheduleExternalSyncPolling(state.externalSync.intervalMs);
}

function syncExternalSyncPollingState(options = {}) {
  const immediate = !!options.immediate;
  if (!state.externalSync.enabled) {
    stopExternalSyncPolling();
    return;
  }
  if (shouldPauseExternalSyncPolling()) {
    stopExternalSyncPolling();
    return;
  }
  if (!immediate && state.externalSync.timer) return;
  scheduleExternalSyncPolling(immediate ? 1200 : state.externalSync.intervalMs);
}
