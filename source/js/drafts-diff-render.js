function renderDraftCodeLegend(stats = {}) {
  const added = Number(stats.added || 0);
  const removed = Number(stats.removed || 0);
  const changed = Number(stats.changed || 0);
  const parts = [];
  if (added) parts.push(`<span class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-1 font-semibold text-green-700">${escapeHtml(t('draftAdded'))}: ${added}</span>`);
  if (removed) parts.push(`<span class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700">${escapeHtml(t('draftRemoved'))}: ${removed}</span>`);
  if (changed) parts.push(`<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">${escapeHtml(t('draftChanged'))}: ${changed}</span>`);
  if (!parts.length) parts.push(`<span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-600">${escapeHtml(t('draftNoCodeDifferences'))}</span>`);
  els.draftCodeDiffLegend.innerHTML = parts.join('');
}
function draftFallbackLineHtml(lineNumber, text, type) {
  const typeClass = type === 'added' ? 'draft-diff-added' : type === 'removed' ? 'draft-diff-removed' : type === 'changed' ? 'draft-diff-changed' : type === 'empty' ? 'draft-diff-empty' : '';
  const safeNumber = lineNumber === '' ? '&nbsp;' : escapeHtml(String(lineNumber));
  const safeText = text === '' ? '&nbsp;' : escapeHtml(String(text));
  return `<div class="draft-diff-line ${typeClass}"><div class="draft-diff-line-number">${safeNumber}</div><div class="draft-diff-line-code">${safeText}</div></div>`;
}
function syncDraftFallbackScroll(source, target) {
  if (state.drafts.fallbackSyncing) return;
  state.drafts.fallbackSyncing = true;
  target.scrollTop = source.scrollTop;
  target.scrollLeft = source.scrollLeft;
  window.requestAnimationFrame(() => { state.drafts.fallbackSyncing = false; });
}
function renderDraftFallbackDiff(rows, stats) {
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
function diffRangeLineCount(start, end) {
  const safeStart = Number(start || 0);
  const safeEnd = Number(end || 0);
  if (safeStart <= 0 || safeEnd <= 0) return 0;
  return Math.max(0, safeEnd - safeStart + 1);
}
function monacoDiffStatsFromChanges(lineChanges = []) {
  const stats = { added: 0, removed: 0, changed: 0 };
  for (const change of lineChanges) {
    const removed = diffRangeLineCount(change.originalStartLineNumber, change.originalEndLineNumber);
    const added = diffRangeLineCount(change.modifiedStartLineNumber, change.modifiedEndLineNumber);
    if (removed && added) { stats.changed += Math.max(removed, added); }
    else if (removed) { stats.removed += removed; }
    else if (added) { stats.added += added; }
  }
  return stats;
}
function disposeDraftDiffEditor() {
  if (state.drafts.diffEditor) { state.drafts.diffEditor.dispose(); state.drafts.diffEditor = null; }
  if (state.drafts.diffOriginalModel) { state.drafts.diffOriginalModel.dispose(); state.drafts.diffOriginalModel = null; }
  if (state.drafts.diffModifiedModel) { state.drafts.diffModifiedModel.dispose(); state.drafts.diffModifiedModel = null; }
}
function renderDraftCodeDiff(currentSnapshot, draftSnapshot) {
  disposeDraftDiffEditor();
  const currentHtml = String(currentSnapshot?.html || '');
  const draftHtml = String(draftSnapshot?.html || '');
  const fallback = buildDraftLineDiffRows(currentHtml, draftHtml);
  renderDraftCodeLegend(fallback.stats);
  els.draftCodeDiffMonaco.classList.add('hidden');
  els.draftCodeDiffFallback.classList.add('hidden');

  if (!(window.monaco && window.monaco.editor && els.draftCodeDiffMonaco)) {
    renderDraftFallbackDiff(fallback.rows, fallback.stats);
    return;
  }

  try {
    state.drafts.diffOriginalModel = monaco.editor.createModel(currentHtml, 'html');
    state.drafts.diffModifiedModel = monaco.editor.createModel(draftHtml, 'html');
    state.drafts.diffEditor = monaco.editor.createDiffEditor(els.draftCodeDiffMonaco, {
      automaticLayout: true, readOnly: true, originalEditable: false, renderIndicators: true,
      renderSideBySide: window.matchMedia('(min-width: 1024px)').matches,
      minimap: { enabled: false }, lineNumbers: 'on', scrollBeyondLastLine: false,
      ignoreTrimWhitespace: false, wordWrap: 'off', fontSize: 12, lineHeight: 20
    });
    state.drafts.diffEditor.setModel({ original: state.drafts.diffOriginalModel, modified: state.drafts.diffModifiedModel });
    els.draftCodeDiffMonaco.classList.remove('hidden');

    const refreshLegend = () => {
      const editor = state.drafts.diffEditor;
      if (!editor) return;
      const changes = editor.getLineChanges() || [];
      if (!changes.length) {
        renderDraftCodeLegend(currentHtml === draftHtml ? { added: 0, removed: 0, changed: 0 } : fallback.stats);
        return;
      }
      renderDraftCodeLegend(monacoDiffStatsFromChanges(changes));
    };
    state.drafts.diffEditor.onDidUpdateDiff(refreshLegend);
    refreshLegend();
    state.drafts.diffEditor.layout();
    return;
  } catch (err) {
    log(err.message || String(err));
    disposeDraftDiffEditor();
    renderDraftFallbackDiff(fallback.rows, fallback.stats);
  }
}
