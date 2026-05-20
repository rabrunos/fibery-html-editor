function draftKeyForPage(pageId = '') { return pageId ? `page:${pageId}` : `unsaved:${state.drafts.unsavedId}`; }

function writeEmergencyDraft() {
  try {
    if (state.blank || !state.current.id || !state.isAdmin || !state.dirty) return;
    updateCurrentFromInputs();
    const snapshot = currentSnapshotFromState();
    if (sameSnapshot(snapshot, currentBaselineSnapshot())) return;
    if (!hasAnyDraftContent(snapshot)) return;
    const record = { pageId: state.current.id, title: snapshot.title, description: snapshot.description, html: snapshot.html, signature: snapshotSignature(snapshot), savedAt: Date.now() };
    localStorage.setItem(LS.emergencyDraft, JSON.stringify(record));
  } catch (_) {}
}

function clearEmergencyDraft() {
  try { localStorage.removeItem(LS.emergencyDraft); } catch (_) {}
}

function clearEmergencyDraftForPage(pageId) {
  try {
    const raw = localStorage.getItem(LS.emergencyDraft);
    if (!raw) return;
    const rec = JSON.parse(raw);
    if (rec && String(rec.pageId || '') === String(pageId || '')) localStorage.removeItem(LS.emergencyDraft);
  } catch (_) {}
}

async function applyEmergencyDraftIfRelevant() {
  try {
    const raw = localStorage.getItem(LS.emergencyDraft);
    if (!raw) return;
    const record = JSON.parse(raw);
    if (!record || !record.pageId) { clearEmergencyDraft(); return; }
    if (Date.now() - Number(record.savedAt || 0) > 3600000) { clearEmergencyDraft(); return; }
    const pageId = String(record.pageId || '');
    // Discard if emergency draft is from before the last save for this page
    const pageMeta = getMetaMap()[pageId] || {};
    const lastSavedAt = Number(pageMeta.lastSavedAt || 0);
    if (lastSavedAt && Number(record.savedAt || 0) <= lastSavedAt) { clearEmergencyDraft(); return; }
    const signature = String(record.signature || snapshotSignature(record));
    const key = draftKeyForPage(pageId);
    const existing = state.drafts.byKey[key];
    if (existing) {
      const existingSig = existing.signature || snapshotSignature(existing);
      const existingAt = Number(existing.updatedAt || 0);
      if (existingSig === signature || existingAt >= Number(record.savedAt || 0)) { clearEmergencyDraft(); return; }
    }
    const now = Date.now();
    const newRecord = { id: key, key, pageId, unsavedId: '', title: String(record.title || ''), description: String(record.description || ''), html: String(record.html || ''), signature, updatedAt: Number(record.savedAt || now), baseSavedAt: 0 };
    if (state.db) { try { await txPut('drafts', newRecord); } catch (_) {} }
    state.drafts.byKey[key] = newRecord;
    state.drafts.lastAutosaveAtByKey[key] = newRecord.updatedAt;
    clearDismissedRecovery(key);
    clearEmergencyDraft();
  } catch (_) {
    clearEmergencyDraft();
  }
}
function draftSnapshotFromRecord(record) {
  return {
    title: String(record?.title || ''),
    description: String(record?.description || ''),
    html: String(record?.html || '')
  };
}
function syncDirtyWithBaseline() {
  markDirty(!sameSnapshot(currentSnapshotFromState(), currentBaselineSnapshot()));
}
function hasAnyDraftContent(snapshot) {
  return !!String(snapshot.title || '').trim() || !!String(snapshot.description || '').trim() || !!String(snapshot.html || '').trim();
}
function isDefaultUnsavedSnapshot(snapshot) {
  const title = String(snapshot.title || '').trim();
  const description = String(snapshot.description || '').trim();
  const html = String(snapshot.html || '').trim();
  const defaultTitle = title === '' || title === 'Untitled Page';
  return defaultTitle && !description && !html;
}
function shouldPersistDraftSnapshot(snapshot, pageId = '') {
  if (!snapshot) return false;
  if (pageId) {
    const baseline = currentBaselineSnapshot();
    if (sameSnapshot(snapshot, baseline)) return false;
    return hasAnyDraftContent(snapshot);
  }
  return !isDefaultUnsavedSnapshot(snapshot);
}
function clearDraftAutosaveTimer() {
  if (!state.drafts.autosaveTimer) return;
  window.clearTimeout(state.drafts.autosaveTimer);
  state.drafts.autosaveTimer = null;
}
function loadDismissedRecoveryMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LS.dismissedRecovery) || '{}');
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (_) {}
  return {};
}
function persistDismissedRecoveryMap() {
  try { localStorage.setItem(LS.dismissedRecovery, JSON.stringify(state.drafts.dismissedMap || {})); } catch (_) {}
}
function setDismissedRecovery(key, signature) {
  if (!key || !signature) return;
  state.drafts.dismissedMap[key] = signature;
  persistDismissedRecoveryMap();
}
function clearDismissedRecovery(key) {
  if (!key || state.drafts.dismissedMap[key] === undefined) return;
  delete state.drafts.dismissedMap[key];
  persistDismissedRecoveryMap();
}
function updateRecoveryReopenButton() {
  const candidate = state.drafts.reopenCandidate;
  if (!candidate || !candidate.key || !state.drafts.byKey[candidate.key]) {
    els.reopenRecoveryBtn.classList.add('hidden');
    return;
  }
  const currentKey = draftKeyForPage(state.current.id || '');
  if (state.blank && !String(candidate.key || '').startsWith('unsaved:')) {
    els.reopenRecoveryBtn.classList.add('hidden');
    return;
  }
  if (!state.blank && candidate.key !== currentKey) {
    els.reopenRecoveryBtn.classList.add('hidden');
    return;
  }
  els.reopenRecoveryBtn.textContent = t('reopenRecoveryComparison');
  els.reopenRecoveryBtn.classList.remove('hidden');
}
async function deleteDraftByKey(key) {
  if (!key) return;
  delete state.drafts.byKey[key];
  delete state.drafts.lastAutosaveAtByKey[key];
  if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
  clearDismissedRecovery(key);
  updateRecoveryReopenButton();
  if (state.db) {
    try { await txDelete('drafts', key); } catch (_) {}
  }
}
function getManualHistoryLimit() {
  const raw = Number(localStorage.getItem(LS.versionLimit) || '20');
  if (!Number.isFinite(raw) || raw < 0) return 20;
  return raw;
}
async function saveCurrentDraftNow(options = {}) {
  const force = !!options.force;
  if (!state.db || state.blank || !state.isAdmin) return null;
  updateCurrentFromInputs();
  const pageId = state.current.id || '';
  const key = draftKeyForPage(pageId);
  const snapshot = currentSnapshotFromState();
  if (!shouldPersistDraftSnapshot(snapshot, pageId)) {
    await deleteDraftByKey(key);
    return null;
  }
  const signature = snapshotSignature(snapshot);
  const previous = state.drafts.byKey[key];
  const previousSignature = previous?.signature || (previous ? snapshotSignature(previous) : '');
  if (previous && previousSignature === signature) return previous;

  const now = Date.now();
  const lastAutosaveAt = Number(state.drafts.lastAutosaveAtByKey[key] || 0);
  if (!force && lastAutosaveAt && (now - lastAutosaveAt) < state.drafts.autosaveIntervalMs) return null;

  const meta = pageId ? (getMetaMap()[pageId] || {}) : {};
  const record = {
    id: key,
    key,
    pageId,
    unsavedId: pageId ? '' : state.drafts.unsavedId,
    title: snapshot.title,
    description: snapshot.description,
    html: snapshot.html,
    signature,
    updatedAt: now,
    baseSavedAt: Number(meta.lastSavedAt || 0)
  };
  await txPut('drafts', record);
  state.drafts.byKey[key] = record;
  state.drafts.lastAutosaveAtByKey[key] = now;
  clearDismissedRecovery(key);
  if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
  updateRecoveryReopenButton();
  return record;
}
function scheduleDraftAutosave() {
  if (!state.db || state.blank || !state.isAdmin || !state.dirty) return;
  if (state.drafts.autosaveTimer) return;
  state.drafts.autosaveTimer = window.setTimeout(async () => {
    state.drafts.autosaveTimer = null;
    try { await saveCurrentDraftNow({ force: false }); } catch (err) { log(err.message || String(err)); }
    if (state.dirty && state.isAdmin && !state.blank) scheduleDraftAutosave();
  }, state.drafts.autosaveIntervalMs);
}
async function flushDraftAutosaveNow() {
  if (!state.dirty) return;
  clearDraftAutosaveTimer();
  await saveCurrentDraftNow({ force: true });
}
async function loadDraftsCache() {
  if (!state.db) return;
  try {
    const rows = (await txGetAll('drafts')).filter(row => row?.id);
    const map = {};
    const lastMap = {};
    for (const row of rows) {
      const normalized = { ...row, signature: row.signature || snapshotSignature(row) };
      map[row.id] = normalized;
      lastMap[row.id] = Number(normalized.updatedAt || 0);
    }
    state.drafts.byKey = map;
    state.drafts.lastAutosaveAtByKey = lastMap;
  } catch (err) {
    log(err.message || String(err));
    state.drafts.byKey = {};
    state.drafts.lastAutosaveAtByKey = {};
  }
  state.drafts.dismissedMap = loadDismissedRecoveryMap();
  updateRecoveryReopenButton();
}
