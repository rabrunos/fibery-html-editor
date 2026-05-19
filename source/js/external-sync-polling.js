function hasOpenExternalSyncBlockingModal() {
  if (!els.unsavedTransitionModal || !els.confirmModal || !els.draftRecoveryModal) return false;
  if (!els.unsavedTransitionModal.classList.contains('hidden')) return true;
  if (!els.confirmModal.classList.contains('hidden')) return true;
  if (!els.draftRecoveryModal.classList.contains('hidden')) return true;
  return false;
}

function externalSyncDebugLoggingEnabled() {
  return !!els.logPanel && !els.logPanel.classList.contains('hidden');
}

function logExternalSyncDebug(message, options = {}) {
  if (!message) return;
  if (!options.force && !externalSyncDebugLoggingEnabled()) return;
  log(message);
}

function externalSyncRemainingCooldownMs(now = Date.now()) {
  const minCooldownMs = Math.max(120000, Number(state.externalSync.minCooldownMs || 180000));
  const lastCheckedAt = Number(state.externalSync.lastCheckedAt || 0);
  if (!lastCheckedAt) return 0;
  return Math.max(0, minCooldownMs - (now - lastCheckedAt));
}

function externalSyncSkipReason(options = {}) {
  const manual = !!options.manual;
  if (!state.externalSync.enabled) return 'disabled';
  if (state.blank || !state.current.id) return 'no-current-page';
  if (document.hidden) return 'document-hidden';
  if (state.saving) return 'saving';
  if (state.loadingPage) return 'loading-page';
  if (state.sidebar.loading) return 'sidebar-loading';
  if (state.externalSync.checking) return 'already-checking';
  if (state.unsavedTransitionBusy || !!state.unsavedTransitionResolver) return 'unsaved-transition';
  if (state.update.checking || state.update.applying || state.update.rollbacking) return 'update-flow';
  if (hasOpenExternalSyncBlockingModal()) return 'blocking-modal';
  if (!manual && externalSyncRemainingCooldownMs() > 0) return 'cooldown';
  return '';
}

function logExternalSyncSkip(reason) {
  if (!reason) return;
  const now = Date.now();
  const sameReason = reason === String(state.externalSync.lastSkipReason || '');
  const tooSoon = sameReason && (now - Number(state.externalSync.lastSkipLoggedAt || 0)) < 30000;
  state.externalSync.lastSkipReason = reason;
  state.externalSync.lastSkipLoggedAt = now;
  if (tooSoon) return;
  logExternalSyncDebug(`${t('externalSyncCheckSkippedLog')}: ${reason}`);
}

function externalSyncNextDelayMs() {
  const intervalMs = Math.max(120000, Number(state.externalSync.intervalMs || 300000));
  const cooldownMs = externalSyncRemainingCooldownMs();
  if (!cooldownMs) return intervalMs;
  return Math.max(intervalMs, cooldownMs);
}

function stopExternalSyncPolling() {
  if (!state.externalSync.timer) return;
  window.clearTimeout(state.externalSync.timer);
  state.externalSync.timer = null;
}

function scheduleExternalSyncPolling(delayMs = externalSyncNextDelayMs()) {
  stopExternalSyncPolling();
  if (!state.externalSync.enabled) return;
  const safeDelay = Math.max(120000, Number(delayMs || externalSyncNextDelayMs()));
  state.externalSync.timer = window.setTimeout(() => {
    state.externalSync.timer = null;
    void runExternalSyncPollingCycle();
  }, safeDelay);
}

async function checkExternalSyncNow(options = {}) {
  const manual = !!options.manual;
  const skipReason = externalSyncSkipReason({ manual });
  if (skipReason) {
    logExternalSyncSkip(skipReason);
    return false;
  }
  const pageId = String(state.current.id || '');
  if (!pageId) return false;
  logExternalSyncDebug(manual ? t('externalSyncManualCheckStartedLog') : t('externalSyncCheckStartedLog'));
  state.externalSync.checking = true;
  state.externalSync.status = 'checking';
  try {
    const remotePage = await API.loadPage(pageId);
    if (state.blank || String(state.current.id || '') !== pageId) return false;
    captureExternalSyncRemoteCandidate(remotePage || {});
    state.externalSync.lastCheckedAt = Date.now();
    state.externalSync.lastErrorAt = 0;
    state.externalSync.lastErrorMessage = '';
    state.externalSync.lastSkipReason = '';
    state.externalSync.lastSkipLoggedAt = 0;
    logExternalSyncDebug(manual ? t('externalSyncManualCheckCompletedLog') : t('externalSyncCheckCompletedLog'));
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
  const manual = !!options.manual;
  await checkExternalSyncNow({ manual });
  syncExternalSyncPollingState({ forceReschedule: manual });
}

async function runExternalSyncManualCheck() {
  if (els.externalSyncCheckNowBtn) els.externalSyncCheckNowBtn.disabled = true;
  try {
    await runExternalSyncPollingCycle({ manual: true });
  } finally {
    if (els.externalSyncCheckNowBtn) els.externalSyncCheckNowBtn.disabled = false;
  }
}

function syncExternalSyncPollingState(options = {}) {
  const forceReschedule = !!options.forceReschedule;
  if (!state.externalSync.enabled) {
    stopExternalSyncPolling();
    return;
  }
  const skipReason = externalSyncSkipReason({ manual: false });
  if (skipReason && skipReason !== 'cooldown') {
    logExternalSyncSkip(skipReason);
    stopExternalSyncPolling();
    return;
  }
  if (state.externalSync.timer && !forceReschedule) return;
  scheduleExternalSyncPolling(externalSyncNextDelayMs());
}
