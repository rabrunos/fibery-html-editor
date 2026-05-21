function renderDraftCodeLegend(stats: Partial<DraftLineDiffStats> = {}): void {
  const added = Number(stats.added || 0);
  const removed = Number(stats.removed || 0);
  const changed = Number(stats.changed || 0);
  const parts: string[] = [];
  if (added) parts.push(`<span class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-1 font-semibold text-green-700">${escapeHtml(t('draftAdded'))}: ${added}</span>`);
  if (removed) parts.push(`<span class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700">${escapeHtml(t('draftRemoved'))}: ${removed}</span>`);
  if (changed) parts.push(`<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">${escapeHtml(t('draftChanged'))}: ${changed}</span>`);
  if (!parts.length) parts.push(`<span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-600">${escapeHtml(t('draftNoCodeDifferences'))}</span>`);
  els.draftCodeDiffLegend.innerHTML = parts.join('');
}

function draftFallbackLineHtml(lineNumber: number | '', text: string, type: DraftLineDiffType): string {
  const typeClass = type === 'added' ? 'draft-diff-added' : type === 'removed' ? 'draft-diff-removed' : type === 'changed' ? 'draft-diff-changed' : type === 'empty' ? 'draft-diff-empty' : '';
  const safeNumber = lineNumber === '' ? '&nbsp;' : escapeHtml(String(lineNumber));
  const safeText = text === '' ? '&nbsp;' : escapeHtml(String(text));
  return `<div class="draft-diff-line ${typeClass}"><div class="draft-diff-line-number">${safeNumber}</div><div class="draft-diff-line-code">${safeText}</div></div>`;
}

function syncDraftFallbackScroll(source: HTMLElement, target: HTMLElement): void {
  if (state.drafts.fallbackSyncing) return;
  state.drafts.fallbackSyncing = true;
  target.scrollTop = source.scrollTop;
  target.scrollLeft = source.scrollLeft;
  window.requestAnimationFrame(() => { state.drafts.fallbackSyncing = false; });
}

function renderDraftFallbackDiff(rows: DraftLineDiffRow[], stats: DraftLineDiffStats): void {
  els.draftCodeDiffMonaco.classList.add('hidden');
  els.draftCodeDiffFallback.classList.remove('hidden');
  const leftHtml = rows.map(row => draftFallbackLineHtml(row.leftNo, row.leftLine, row.leftType)).join('');
  const rightHtml = rows.map(row => draftFallbackLineHtml(row.rightNo, row.rightLine, row.rightType)).join('');
  els.draftFallbackCurrentPane.innerHTML = leftHtml || '<div class="p-3 text-xs text-gray-500">-</div>';
  els.draftFallbackLocalPane.innerHTML = rightHtml || '<div class="p-3 text-xs text-gray-500">-</div>';
  els.draftFallbackCurrentPane.onscroll = () => syncDraftFallbackScroll(els.draftFallbackCurrentPane, els.draftFallbackLocalPane);
  els.draftFallbackLocalPane.onscroll = () => syncDraftFallbackScroll(els.draftFallbackLocalPane, els.draftFallbackCurrentPane);
  els.draftFallbackCurrentPane.scrollTop = 0;
  els.draftFallbackLocalPane.scrollTop = 0;
  renderDraftCodeLegend(stats);
}

function diffRangeLineCount(start: number | null | undefined, end: number | null | undefined): number {
  const safeStart = Number(start || 0);
  const safeEnd = Number(end || 0);
  if (safeStart <= 0 || safeEnd <= 0) return 0;
  return Math.max(0, safeEnd - safeStart + 1);
}

function monacoDiffStatsFromChanges(lineChanges: MonacoLineChange[] = []): DraftLineDiffStats {
  const stats: DraftLineDiffStats = { added: 0, removed: 0, changed: 0 };
  for (const change of lineChanges) {
    const removed = diffRangeLineCount(change.originalStartLineNumber, change.originalEndLineNumber);
    const added = diffRangeLineCount(change.modifiedStartLineNumber, change.modifiedEndLineNumber);
    if (removed && added) { stats.changed += Math.max(removed, added); }
    else if (removed) { stats.removed += removed; }
    else if (added) { stats.added += added; }
  }
  return stats;
}

function disposeDraftDiffEditor(): void {
  if (state.drafts.diffEditor) {
    (state.drafts.diffEditor as MonacoDiffEditorInstance).dispose();
    state.drafts.diffEditor = null;
  }
  if (state.drafts.diffOriginalModel) {
    (state.drafts.diffOriginalModel as MonacoEditorModel).dispose();
    state.drafts.diffOriginalModel = null;
  }
  if (state.drafts.diffModifiedModel) {
    (state.drafts.diffModifiedModel as MonacoEditorModel).dispose();
    state.drafts.diffModifiedModel = null;
  }
}

function renderDraftCodeDiff(
  currentSnapshot: Partial<PageSnapshot> | null | undefined,
  draftSnapshot: Partial<PageSnapshot> | null | undefined
): void {
  disposeDraftDiffEditor();
  const currentHtml = String(currentSnapshot?.html || '');
  const draftHtml = String(draftSnapshot?.html || '');
  const fallback = buildDraftLineDiffRows(currentHtml, draftHtml);
  renderDraftCodeLegend(fallback.stats);
  els.draftCodeDiffMonaco.classList.add('hidden');
  els.draftCodeDiffFallback.classList.add('hidden');

  const m = monaco as MonacoGlobal | undefined;
  if (!m?.editor) {
    renderDraftFallbackDiff(fallback.rows, fallback.stats);
    return;
  }

  try {
    state.drafts.diffOriginalModel = m.editor.createModel(currentHtml, 'html');
    state.drafts.diffModifiedModel = m.editor.createModel(draftHtml, 'html');
    state.drafts.diffEditor = m.editor.createDiffEditor(els.draftCodeDiffMonaco, {
      automaticLayout: true, readOnly: true, originalEditable: false, renderIndicators: true,
      renderSideBySide: window.matchMedia('(min-width: 1024px)').matches,
      minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false,
      ignoreTrimWhitespace: false, wordWrap: 'off', fontSize: 12, lineHeight: 20
    });
    const editor = state.drafts.diffEditor as MonacoDiffEditorInstance;
    editor.setModel({
      original: state.drafts.diffOriginalModel as MonacoEditorModel,
      modified: state.drafts.diffModifiedModel as MonacoEditorModel
    });
    els.draftCodeDiffMonaco.classList.remove('hidden');

    const refreshLegend = () => {
      const ed = state.drafts.diffEditor as MonacoDiffEditorInstance | null;
      if (!ed) return;
      const changes = ed.getLineChanges() || [];
      if (!changes.length) {
        renderDraftCodeLegend(currentHtml === draftHtml ? { added: 0, removed: 0, changed: 0 } : fallback.stats);
        return;
      }
      renderDraftCodeLegend(monacoDiffStatsFromChanges(changes));
    };
    editor.onDidUpdateDiff(refreshLegend);
    refreshLegend();
    editor.layout();
    return;
  } catch (err) {
    log((err as Error).message || String(err));
    disposeDraftDiffEditor();
    renderDraftFallbackDiff(fallback.rows, fallback.stats);
  }
}
