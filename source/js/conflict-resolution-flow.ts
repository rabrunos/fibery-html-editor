interface ConflictSnapshots {
  localSnapshot: PageSnapshot;
  remoteSnapshot: FiberyPage;
}

function disposeConflictDiffEditor(): void {
  if (state.conflictCompare.diffEditor) {
    try { (state.conflictCompare.diffEditor as MonacoDiffEditorInstance).dispose(); } catch (_) {}
    state.conflictCompare.diffEditor = null;
  }
  if (state.conflictCompare.diffOriginalModel) {
    try { (state.conflictCompare.diffOriginalModel as MonacoEditorModel).dispose(); } catch (_) {}
    state.conflictCompare.diffOriginalModel = null;
  }
  if (state.conflictCompare.diffModifiedModel) {
    try { (state.conflictCompare.diffModifiedModel as MonacoEditorModel).dispose(); } catch (_) {}
    state.conflictCompare.diffModifiedModel = null;
  }
}

function renderConflictCodeLegend(stats: Partial<DraftLineDiffStats> = {}): void {
  if (!els.conflictCodeDiffLegend) return;
  const added = Number(stats.added || 0);
  const removed = Number(stats.removed || 0);
  const changed = Number(stats.changed || 0);
  const parts: string[] = [];
  if (added) parts.push(`<span class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-1 font-semibold text-green-700">${escapeHtml(t('draftAdded'))}: ${added}</span>`);
  if (removed) parts.push(`<span class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700">${escapeHtml(t('draftRemoved'))}: ${removed}</span>`);
  if (changed) parts.push(`<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">${escapeHtml(t('draftChanged'))}: ${changed}</span>`);
  if (!parts.length) parts.push(`<span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-600">${escapeHtml(t('draftNoCodeDifferences'))}</span>`);
  els.conflictCodeDiffLegend.innerHTML = parts.join('');
}

function syncConflictFallbackScroll(source: HTMLElement, target: HTMLElement): void {
  if (state.conflictCompare.fallbackSyncing) return;
  state.conflictCompare.fallbackSyncing = true;
  target.scrollTop = source.scrollTop;
  target.scrollLeft = source.scrollLeft;
  window.requestAnimationFrame(() => { state.conflictCompare.fallbackSyncing = false; });
}

function renderConflictFallbackDiff(rows: DraftLineDiffRow[], stats: DraftLineDiffStats): void {
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

function renderConflictCodeDiff(
  leftSnapshot: Partial<PageSnapshot> | null | undefined,
  rightSnapshot: Partial<PageSnapshot> | null | undefined
): void {
  disposeConflictDiffEditor();
  if (!els.conflictCodeDiffMonaco || !els.conflictCodeDiffFallback) return;
  const leftCode = String(leftSnapshot?.html || '');
  const rightCode = String(rightSnapshot?.html || '');
  const fallback = buildDraftLineDiffRows(leftCode, rightCode);
  renderConflictCodeLegend(fallback.stats);
  els.conflictCodeDiffMonaco.classList.add('hidden');
  els.conflictCodeDiffFallback.classList.add('hidden');

  const m = monaco as MonacoGlobal | undefined;
  if (!m?.editor) {
    renderConflictFallbackDiff(fallback.rows, fallback.stats);
    return;
  }

  try {
    state.conflictCompare.diffOriginalModel = m.editor.createModel(leftCode, 'html');
    state.conflictCompare.diffModifiedModel = m.editor.createModel(rightCode, 'html');
    state.conflictCompare.diffEditor = m.editor.createDiffEditor(els.conflictCodeDiffMonaco, {
      automaticLayout: true, readOnly: true, originalEditable: false, renderIndicators: true,
      renderSideBySide: window.matchMedia('(min-width: 1024px)').matches,
      minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false,
      ignoreTrimWhitespace: false, wordWrap: 'off', fontSize: 12, lineHeight: 20
    });
    const editor = state.conflictCompare.diffEditor as MonacoDiffEditorInstance;
    editor.setModel({
      original: state.conflictCompare.diffOriginalModel as MonacoEditorModel,
      modified: state.conflictCompare.diffModifiedModel as MonacoEditorModel
    });
    els.conflictCodeDiffMonaco.classList.remove('hidden');
    const refreshLegend = () => {
      const ed = state.conflictCompare.diffEditor as MonacoDiffEditorInstance | null;
      if (!ed) return;
      const changes = ed.getLineChanges() || [];
      if (!changes.length) {
        renderConflictCodeLegend(leftCode === rightCode ? { added: 0, removed: 0, changed: 0 } : fallback.stats);
        return;
      }
      renderConflictCodeLegend(monacoDiffStatsFromChanges(changes));
    };
    editor.onDidUpdateDiff(refreshLegend);
    refreshLegend();
    editor.layout();
  } catch (err) {
    log(String((err as Error)?.message || err || ''));
    disposeConflictDiffEditor();
    renderConflictFallbackDiff(fallback.rows, fallback.stats);
  }
}

function conflictSnapshotsFromState(): ConflictSnapshots | null {
  const candidate = state.cachedPageOpen.remoteCandidate;
  if (!candidate) return null;
  updateCurrentFromInputs();
  const localSnapshot = currentSnapshotFromState();
  const remoteSnapshot: FiberyPage = {
    id: String(candidate.id || state.current.id || ''),
    title: String(candidate.title || ''),
    description: String(candidate.description || ''),
    html: String(candidate.html || '')
  };
  return { localSnapshot, remoteSnapshot };
}

function renderConflictCompareContent(localSnapshot: PageSnapshot, remoteSnapshot: FiberyPage): void {
  if (!els.conflictLocalColumn || !els.conflictRemoteColumn) return;
  const userEdited = hasUserEditedSinceCachedOpen(String(state.current.id || ''));
  const diffLocalRemote = draftDiffMap(localSnapshot, remoteSnapshot);
  const remoteTime = Number(state.cachedPageOpen.remoteCandidate?.detectedAt || 0);
  const remoteSubtitle = remoteTime ? draftUpdatedAtLabel(remoteTime) : '';
  const localLabel = userEdited ? t('conflictDraftLabel') : t('conflictCacheLabel');
  els.conflictLocalColumn.innerHTML = draftColumnHtml(localLabel, localSnapshot, { title: false, description: false, html: false }, { subtitle: '' });
  els.conflictRemoteColumn.innerHTML = draftColumnHtml(t('conflictRemoteLabel'), remoteSnapshot, diffLocalRemote, { subtitle: remoteSubtitle });
  renderConflictCodeDiff(localSnapshot, remoteSnapshot);
}

function openConflictCompareModal(): void {
  if (!els.conflictCompareModal) return;
  const snapshots = conflictSnapshotsFromState();
  if (!snapshots) return;
  if (els.conflictCompareTitle) els.conflictCompareTitle.textContent = t('conflictCompareTitle');
  if (els.conflictCompareSubtitle) els.conflictCompareSubtitle.textContent = t('conflictCompareSubtitle');
  const userEdited = hasUserEditedSinceCachedOpen(String(state.current.id || ''));
  if (els.conflictKeepLocalBtn) els.conflictKeepLocalBtn.textContent = userEdited ? t('conflictKeepDraft') : t('conflictKeepCache');
  if (els.conflictLoadRemoteBtn) els.conflictLoadRemoteBtn.textContent = t('conflictLoadRemote');
  renderConflictCompareContent(snapshots.localSnapshot, snapshots.remoteSnapshot);
  els.conflictCompareModal.classList.remove('hidden');
  syncConflictCompareButtonState();
}

function closeConflictCompareModal(): void {
  if (!els.conflictCompareModal) return;
  disposeConflictDiffEditor();
  if (els.conflictCodeDiffMonaco) els.conflictCodeDiffMonaco.classList.add('hidden');
  if (els.conflictCodeDiffFallback) els.conflictCodeDiffFallback.classList.add('hidden');
  if (els.conflictFallbackLeftPane) els.conflictFallbackLeftPane.innerHTML = '';
  if (els.conflictFallbackRightPane) els.conflictFallbackRightPane.innerHTML = '';
  if (els.conflictLocalColumn) els.conflictLocalColumn.innerHTML = '';
  if (els.conflictRemoteColumn) els.conflictRemoteColumn.innerHTML = '';
  els.conflictCompareModal.classList.add('hidden');
  syncConflictCompareButtonState();
}

function keepLocalEditsFromConflict(): void {
  if (state.cachedPageOpen.remoteStatus !== 'conflict') {
    closeConflictCompareModal();
    return;
  }
  state.cachedPageOpen.remoteStatus = 'conflict-resolved-local';
  state.cachedPageOpen.saveBlockedReason = '';
  state.cachedPageOpen.remoteCandidate = null;
  syncSaveAvailabilityState();
  syncPreviewMode({ immediate: true });
  closeConflictCompareModal();
  setStatus(t('conflictKeepLocalStatus'));
  log(t('conflictKeepLocalLog'));
}

async function loadFiberyVersionFromConflict(): Promise<void> {
  const candidate = state.cachedPageOpen.remoteCandidate;
  if (!candidate) { closeConflictCompareModal(); return; }

  closeConflictCompareModal();

  const pageId = String(state.current.id || candidate.id || '');
  // Only save draft if user actually has local edits; in the no-edit case (cache == editor)
  // saveCurrentDraftNow would delete any existing draft since snapshot == baseline.
  if (hasUserEditedSinceCachedOpen(pageId)) {
    try {
      await saveCurrentDraftNow({ force: true });
      log(t('conflictLoadRemoteDraftSaved'));
    } catch (_) {}
  }
  const remoteSnapshot: FiberyPage = {
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
  // Editor == confirmed Fibery original → use real preview; syncPreviewMode decides correctly.
  syncPreviewMode({ immediate: true });
  setStatus(t('conflictLoadRemoteStatus'));
  log(t('conflictLoadRemoteLog'));
}

function syncConflictCompareButtonState(): void {
  if (!els.conflictCompareOpenBtn) return;
  const isConflict = state.cachedPageOpen.remoteStatus === 'conflict';
  const modalOpen = !!els.conflictCompareModal && !els.conflictCompareModal.classList.contains('hidden');
  els.conflictCompareOpenBtn.classList.toggle('hidden', !isConflict || !!modalOpen);
  if (isConflict && !modalOpen) {
    els.conflictCompareOpenBtn.textContent = t('conflictCompareOpenBtn');
    els.conflictCompareOpenBtn.title = t('conflictCompareOpenBtn');
  }
}
