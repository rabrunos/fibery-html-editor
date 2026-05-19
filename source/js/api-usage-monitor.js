function apiUsageNow() { return Date.now(); }

function apiUsageErrorText(error) {
  return String(error?.message || error || '').slice(0, 140);
}

function apiUsageCallKey(entry = {}) {
  return [entry.kind || 'unknown', entry.operation || 'unknown', entry.source || 'unknown', entry.pageId || ''].join(':');
}

function isApiUsageLogVisible() {
  return !!els.logPanel && !els.logPanel.classList.contains('hidden');
}

function renderApiUsageSummary() {
  if (!els.apiUsageSummaryBox) return;
  const calls = state.apiUsage.recentCalls || [];
  const now = apiUsageNow();
  const windowMs = Number(state.apiUsage.summaryWindowMs || 300000);
  const recent = calls.filter(call => now - Number(call.timestamp || 0) <= windowMs);
  const fiberyCount = recent.filter(call => call.kind === 'fibery-api').length;
  const previewCount = recent.filter(call => call.kind === 'fibery-preview').length;
  const remoteCount = recent.filter(call => call.kind === 'github-remote').length;
  const last = calls[calls.length - 1];
  const lastText = last
    ? `${last.kind}/${last.operation} (${last.source || '-'}) ${Number(last.durationMs || 0)}ms`
    : t('apiUsageNoCalls');
  els.apiUsageSummaryBox.textContent = `${t('apiUsageLast5Min')}: ${fiberyCount} ${t('apiUsageFibery')}, ${previewCount} ${t('apiUsagePreview')}, ${remoteCount} ${t('apiUsageRemote')}. ${t('apiUsageLastCall')}: ${lastText}`;
}

function recordApiUsage(entry = {}) {
  const normalized = {
    kind: String(entry.kind || 'unknown'),
    operation: String(entry.operation || 'unknown'),
    source: String(entry.source || 'unknown'),
    pageId: String(entry.pageId || ''),
    timestamp: Number(entry.timestamp || apiUsageNow()),
    durationMs: Math.max(0, Math.round(Number(entry.durationMs || 0))),
    success: entry.success !== false,
    automatic: !!entry.automatic,
    error: entry.error ? apiUsageErrorText(entry.error) : ''
  };
  state.apiUsage.recentCalls.push(normalized);
  const maxCalls = Math.max(50, Number(state.apiUsage.maxRecentCalls || 100));
  if (state.apiUsage.recentCalls.length > maxCalls) {
    state.apiUsage.recentCalls.splice(0, state.apiUsage.recentCalls.length - maxCalls);
  }
  if (normalized.automatic && normalized.kind === 'fibery-api') {
    state.apiUsage.lastAutomaticFiberyCallAt = normalized.timestamp;
  }
  if (normalized.kind === 'fibery-api' && (!normalized.success || normalized.durationMs >= Number(state.apiUsage.slowCallThresholdMs || 4000))) {
    state.apiUsage.slowModeUntil = normalized.timestamp + Number(state.apiUsage.slowModeMs || 300000);
  }
  if (!normalized.success || isApiUsageLogVisible()) {
    const status = normalized.success ? 'ok' : `fail ${normalized.error || ''}`.trim();
    log(`${t('apiUsageLogPrefix')}: ${normalized.kind}/${normalized.operation} ${normalized.source} ${normalized.durationMs}ms ${status}`);
  }
  renderApiUsageSummary();
  return normalized;
}

function clearApiUsageStats() {
  state.apiUsage.recentCalls = [];
  state.apiUsage.lastAutomaticFiberyCallAt = 0;
  state.apiUsage.slowModeUntil = 0;
  state.apiUsage.inFlight = {};
  renderApiUsageSummary();
}

async function withApiUsage(meta = {}, task) {
  const startedAt = apiUsageNow();
  const key = apiUsageCallKey(meta);
  state.apiUsage.inFlight[key] = Number(state.apiUsage.inFlight[key] || 0) + 1;
  try {
    const result = await task();
    recordApiUsage({ ...meta, timestamp: startedAt, durationMs: apiUsageNow() - startedAt, success: true });
    return result;
  } catch (err) {
    recordApiUsage({ ...meta, timestamp: startedAt, durationMs: apiUsageNow() - startedAt, success: false, error: err });
    throw err;
  } finally {
    state.apiUsage.inFlight[key] = Math.max(0, Number(state.apiUsage.inFlight[key] || 1) - 1);
    if (!state.apiUsage.inFlight[key]) delete state.apiUsage.inFlight[key];
  }
}

function automaticFiberyCooldownRemaining(now = apiUsageNow()) {
  const cooldownMs = Math.max(60000, Number(state.apiUsage.automaticCooldownMs || 180000));
  const slowUntil = Number(state.apiUsage.slowModeUntil || 0);
  if (slowUntil > now) return slowUntil - now;
  const lastAt = Number(state.apiUsage.lastAutomaticFiberyCallAt || 0);
  if (!lastAt) return 0;
  return Math.max(0, cooldownMs - (now - lastAt));
}

function automaticFiberySkipReason(source = '') {
  if (document.hidden) return 'document-hidden';
  if (state.saving) return 'saving';
  if (state.loadingPage) return 'loading-page';
  if (state.sidebar.loading && source !== 'sidebar') return 'sidebar-loading';
  if (state.update.checking || state.update.applying || state.update.rollbacking) return 'update-flow';
  if (Number(automaticFiberyCooldownRemaining()) > 0) return 'automatic-cooldown';
  return '';
}

function canRunAutomaticFiberyCall(source = '') {
  return !automaticFiberySkipReason(source);
}

function logAutomaticFiberySkip(source = '', reason = automaticFiberySkipReason(source)) {
  if (!reason || !isApiUsageLogVisible()) return;
  log(`${t('apiUsageAutomaticSkippedLog')}: ${source || 'unknown'} (${reason})`);
}

function recordPreviewUsage({ operation = 'previewView', source = 'preview-real', pageId = '', automatic = false } = {}) {
  recordApiUsage({
    kind: 'fibery-preview',
    operation,
    source,
    pageId,
    automatic,
    timestamp: apiUsageNow(),
    durationMs: 0,
    success: true
  });
}
