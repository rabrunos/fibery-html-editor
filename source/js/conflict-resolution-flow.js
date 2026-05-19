function disposeConflictDiffEditor() {
  if (state.conflictCompare.diffEditor) {
    try { state.conflictCompare.diffEditor.dispose(); } catch (_) {}
    state.conflictCompare.diffEditor = null;
  }
  if (state.conflictCompare.diffOriginalModel) {
    try { state.conflictCompare.diffOriginalModel.dispose(); } catch (_) {}
    state.conflictCompare.diffOriginalModel = null;
  }
  if (state.conflictCompare.diffModifiedModel) {
    try { state.conflictCompare.diffModifiedModel.dispose(); } catch (_) {}
    state.conflictCompare.diffModifiedModel = null;
  }
}

function renderConflictCodeLegend(stats = {}) {
  if (!els.conflictCodeDiffLegend) return;
  const added = Number(stats.added || 0);
  const removed = Number(stats.removed || 0);
  const changed = Number(stats.changed || 0);
  const parts = [];
  if (added) parts.push(`<span class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-1 font-semibold text-green-700">${escapeHtml(t('draftAdded'))}: ${added}</span>`);
  if (removed) parts.push(`<span class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700">${escapeHtml(t('draftRemoved'))}: ${removed}</span>`);
  if (changed) parts.push(`<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">${escapeHtml(t('draftChanged'))}: ${changed}</span>`);
  if (!parts.length) parts.push(`<span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-600">${escapeHtml(t('draftNoCodeDifferences'))}</span>`);
  els.conflictCodeDiffLegend.innerHTML = parts.join('');
}

function syncConflictFallbackScroll(source, target) {
  if (state.conflictCompare.fallbackSyncing) return;
  state.conflictCompare.fallbackSyncing = true;
  target.scrollTop = source.scrollTop;
  target.scrollLeft = source.scrollLeft;
  window.requestAnimationFrame(() => { state.conflictCompare.fallbackSyncing = false; });
}

function renderConflictFallbackDiff(rows, stats) {
  if (!els.conflictCodeDiffMonaco || !els.conflictCodeDiffFallback) return;
  els.conflictCodeDiffMonaco.classList.add('hidden');
  els.conflictCodeDiffFallback.classList.remove('hidden');
  const leftHtml = rows.map(row => draftFallbackLineHtml(row.leftNo, row.leftLine, row.leftType)).join('');
  const rightHtml = rows.map(row => draftFallbackLineHtml(row.rightNo, row.rightLine, row.rightType)).join('');
  if (els.conflictFallbackLeftPane) {
    els.conflictFallbackLeftPane.innerHTML = leftHtml || '<div class="p-3 text-xs text-gray-500">-</div>';
    els.conflictFallbackLeftPane.onscroll = () => syncConflictFallbackScroll(els.conflictFallbackLeftPane, els.conflictFallbackRightPane);
    els.conflictFallbackLeftPane.scrollTop = 0;
  }
  if (els.conflictFallbackRightPane) {
    els.conflictFallbackRightPane.innerHTML = rightHtml || '<div class="p-3 text-xs text-gray-500">-</div>';
    els.conflictFallbackRightPane.onscroll = () => syncConflictFallbackScroll(els.conflictFallbackRightPane, els.conflictFallbackLeftPane);
    els.conflictFallbackRightPane.scrollTop = 0;
  }
  renderConflictCodeLegend(stats);
}

function renderConflictCodeDiff(leftSnapshot, rightSnapshot) {
  disposeConflictDiffEditor();
  if (!els.conflictCodeDiffMonaco || !els.conflictCodeDiffFallback) return;
  const leftCode = String(leftSnapshot?.html || '');
  const rightCode = String(rightSnapshot?.html || '');
  const fallback = buildDraftLineDiffRows(leftCode, rightCode);
  renderConflictCodeLegend(fallback.stats);
  els.conflictCodeDiffMonaco.classList.add('hidden');
  els.conflictCodeDiffFallback.classList.add('hidden');

  if (!(window.monaco && window.monaco.editor && els.conflictCodeDiffMonaco)) {
    renderConflictFallbackDiff(fallback.rows, fallback.stats);
    return;
  }

  try {
    state.conflictCompare.diffOriginalModel = monaco.editor.createModel(leftCode, 'html');
    state.conflictCompare.diffModifiedModel = monaco.editor.createModel(rightCode, 'html');
    state.conflictCompare.diffEditor = monaco.editor.createDiffEditor(els.conflictCodeDiffMonaco, {
      automaticLayout: true, readOnly: true, originalEditable: false, renderIndicators: true,
      renderSideBySide: window.matchMedia('(min-width: 1024px)').matches,
      minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false,
      ignoreTrimWhitespace: false, wordWrap: 'off', fontSize: 12, lineHeight: 20
    });
    state.conflictCompare.diffEditor.setModel({ original: state.conflictCompare.diffOriginalModel, modified: state.conflictCompare.diffModifiedModel });
    els.conflictCodeDiffMonaco.classList.remove('hidden');
    const refreshLegend = () => {
      const editor = state.conflictCompare.diffEditor;
      if (!editor) return;
      const changes = editor.getLineChanges() || [];
      if (!changes.length) {
        renderConflictCodeLegend(leftCode === rightCode ? { added: 0, removed: 0, changed: 0 } : fallback.stats);
        return;
      }
      renderConflictCodeLegend(monacoDiffStatsFromChanges(changes));
    };
    state.conflictCompare.diffEditor.onDidUpdateDiff(refreshLegend);
    refreshLegend();
    state.conflictCompare.diffEditor.layout();
  } catch (err) {
    log(err.message || String(err));
    disposeConflictDiffEditor();
    renderConflictFallbackDiff(fallback.rows, fallback.stats);
  }
}

function renderConflictDiffTabs(mode) {
  if (!els.conflictDiffTabRemote || !els.conflictDiffTabLocal) return;
  els.conflictDiffTabRemote.textContent = t('conflictDiffTabRemote');
  els.conflictDiffTabLocal.textContent = t('conflictDiffTabLocal');
  const activeClasses = ['border-blue-300', 'bg-blue-50', 'text-blue-700'];
  const inactiveClasses = ['border-gray-200', 'bg-white', 'text-gray-600'];
  if (mode === 'local') {
    els.conflictDiffTabLocal.classList.remove(...inactiveClasses);
    els.conflictDiffTabLocal.classList.add(...activeClasses);
    els.conflictDiffTabRemote.classList.remove(...activeClasses);
    els.conflictDiffTabRemote.classList.add(...inactiveClasses);
  } else {
    els.conflictDiffTabRemote.classList.remove(...inactiveClasses);
    els.conflictDiffTabRemote.classList.add(...activeClasses);
    els.conflictDiffTabLocal.classList.remove(...activeClasses);
    els.conflictDiffTabLocal.classList.add(...inactiveClasses);
  }
}

function conflictSnapshotsFromState() {
  const candidate = state.cachedPageOpen.remoteCandidate;
  if (!candidate) return null;
  updateCurrentFromInputs();
  const baseSnapshot = currentBaselineSnapshot();
  const localSnapshot = currentSnapshotFromState();
  const remoteSnapshot = {
    id: String(candidate.id || state.current.id || ''),
    title: String(candidate.title || ''),
    description: String(candidate.description || ''),
    html: String(candidate.html || '')
  };
  return { baseSnapshot, localSnapshot, remoteSnapshot };
}

function renderConflictCompareContent(baseSnapshot, localSnapshot, remoteSnapshot) {
  if (!els.conflictBaseColumn || !els.conflictLocalColumn || !els.conflictRemoteColumn) return;
  const diffBaseLocal = draftDiffMap(baseSnapshot, localSnapshot);
  const diffBaseRemote = draftDiffMap(baseSnapshot, remoteSnapshot);
  const baseTime = Number(state.cachedPageOpen.verifiedAt || 0);
  const remoteTime = Number(state.cachedPageOpen.remoteCandidate?.detectedAt || 0);
  const baseSubtitle = baseTime ? draftUpdatedAtLabel(baseTime) : '';
  const remoteSubtitle = remoteTime ? draftUpdatedAtLabel(remoteTime) : '';
  els.conflictBaseColumn.innerHTML = draftColumnHtml(t('conflictBaseLabel'), baseSnapshot, { title: false, description: false, html: false }, { subtitle: baseSubtitle });
  els.conflictLocalColumn.innerHTML = draftColumnHtml(t('conflictLocalLabel'), localSnapshot, diffBaseLocal, { subtitle: '' });
  els.conflictRemoteColumn.innerHTML = draftColumnHtml(t('conflictRemoteLabel'), remoteSnapshot, diffBaseRemote, { subtitle: remoteSubtitle });
  const mode = state.conflictCompare.diffMode;
  renderConflictDiffTabs(mode);
  renderConflictCodeDiff(baseSnapshot, mode === 'local' ? localSnapshot : remoteSnapshot);
}

function openConflictCompareModal() {
  if (!els.conflictCompareModal) return;
  const snapshots = conflictSnapshotsFromState();
  if (!snapshots) return;
  if (els.conflictCompareTitle) els.conflictCompareTitle.textContent = t('conflictCompareTitle');
  if (els.conflictCompareSubtitle) els.conflictCompareSubtitle.textContent = t('conflictCompareSubtitle');
  if (els.conflictKeepLocalBtn) els.conflictKeepLocalBtn.textContent = t('conflictKeepLocal');
  if (els.conflictLoadRemoteBtn) els.conflictLoadRemoteBtn.textContent = t('conflictLoadRemote');
  if (els.conflictContinueEditingBtn) els.conflictContinueEditingBtn.textContent = t('conflictContinueEditing');
  state.conflictCompare.diffMode = 'remote';
  renderConflictCompareContent(snapshots.baseSnapshot, snapshots.localSnapshot, snapshots.remoteSnapshot);
  els.conflictCompareModal.classList.remove('hidden');
}

function closeConflictCompareModal() {
  if (!els.conflictCompareModal) return;
  disposeConflictDiffEditor();
  if (els.conflictCodeDiffMonaco) els.conflictCodeDiffMonaco.classList.add('hidden');
  if (els.conflictCodeDiffFallback) els.conflictCodeDiffFallback.classList.add('hidden');
  if (els.conflictFallbackLeftPane) els.conflictFallbackLeftPane.innerHTML = '';
  if (els.conflictFallbackRightPane) els.conflictFallbackRightPane.innerHTML = '';
  if (els.conflictBaseColumn) els.conflictBaseColumn.innerHTML = '';
  if (els.conflictLocalColumn) els.conflictLocalColumn.innerHTML = '';
  if (els.conflictRemoteColumn) els.conflictRemoteColumn.innerHTML = '';
  els.conflictCompareModal.classList.add('hidden');
}

function keepLocalEditsFromConflict() {
  if (String(state.cachedPageOpen.remoteStatus || '') !== 'conflict') {
    closeConflictCompareModal();
    return;
  }
  state.cachedPageOpen.remoteStatus = 'conflict-resolved-local';
  state.cachedPageOpen.saveBlockedReason = '';
  state.cachedPageOpen.remoteCandidate = null;
  syncSaveAvailabilityState();
  closeConflictCompareModal();
  setStatus(t('conflictKeepLocalStatus'));
  log(t('conflictKeepLocalLog'));
}

async function loadFiberyVersionFromConflict() {
  const candidate = state.cachedPageOpen.remoteCandidate;
  if (!candidate) { closeConflictCompareModal(); return; }

  const confirmed = await openConfirm({
    title: t('conflictLoadRemoteConfirmTitle'),
    message: t('conflictLoadRemoteConfirmMessage'),
    okText: t('conflictLoadRemoteConfirmButton')
  });
  if (!confirmed) return;

  closeConflictCompareModal();

  try {
    await saveCurrentDraftNow({ force: true });
    log(t('conflictLoadRemoteDraftSaved'));
  } catch (_) {}

  const pageId = String(state.current.id || candidate.id || '');
  const remoteSnapshot = {
    id: pageId,
    title: String(candidate.title || ''),
    description: String(candidate.description || ''),
    html: String(candidate.html || '')
  };

  state.current = { id: remoteSnapshot.id, title: remoteSnapshot.title, description: remoteSnapshot.description, html: remoteSnapshot.html };
  setCurrentBaseline();
  renderCurrent();
  syncCurrentSnapshotBaselineAndDirty({ alignBaseline: true });

  const remoteSignature = String(candidate.signature || snapshotSignature(remoteSnapshot));
  const resolvedAt = Date.now();
  await savePageContentCacheSafe(remoteSnapshot, { pageId, source: 'conflict-resolve-load-remote', cachedAt: resolvedAt, verifiedAt: resolvedAt, signature: remoteSignature });

  state.cachedPageOpen.remoteStatus = 'verified';
  state.cachedPageOpen.saveBlockedReason = '';
  state.cachedPageOpen.remoteCandidate = null;
  state.cachedPageOpen.cacheSignature = remoteSignature;
  state.cachedPageOpen.verifiedAt = resolvedAt;
  if (typeof clearExternalSyncCandidateForCurrentPage === 'function') {
    clearExternalSyncCandidateForCurrentPage({ clearDismissed: true, clearNotified: false });
  }
  syncSaveAvailabilityState();
  renderLocalPreview();
  setStatus(t('conflictLoadRemoteStatus'));
  log(t('conflictLoadRemoteLog'));
}

function continueEditingFromConflict() {
  closeConflictCompareModal();
}

function switchConflictDiffTab(mode) {
  if (mode === state.conflictCompare.diffMode) return;
  state.conflictCompare.diffMode = mode;
  renderConflictDiffTabs(mode);
  const snapshots = conflictSnapshotsFromState();
  if (!snapshots) return;
  renderConflictCodeDiff(snapshots.baseSnapshot, mode === 'local' ? snapshots.localSnapshot : snapshots.remoteSnapshot);
}

function syncConflictCompareButtonState() {
  if (!els.conflictCompareOpenBtn) return;
  const isConflict = String(state.cachedPageOpen.remoteStatus || '') === 'conflict';
  els.conflictCompareOpenBtn.classList.toggle('hidden', !isConflict);
  if (isConflict) {
    els.conflictCompareOpenBtn.textContent = t('conflictCompareOpenBtn');
    els.conflictCompareOpenBtn.title = t('conflictCompareOpenBtn');
  }
}
