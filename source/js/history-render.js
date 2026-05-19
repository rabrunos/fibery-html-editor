async function openHistoryModal() {
  if (!state.current.id) return;
  try { await flushDraftAutosaveNow(); } catch (_) {}
  els.historyModal.classList.remove('hidden');
  renderHistory();
}
function closeHistoryModal() { els.historyModal.classList.add('hidden'); }
function historyRowHtml(row) {
  const d = new Date(row.createdAt || Date.now()).toLocaleString(state.lang === 'pt-BR' ? 'pt-BR' : 'en-US');
  const badge = `<span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">${escapeHtml(t('save'))}</span>`;
  return `<div class="p-3 flex items-center gap-3 hover:bg-gray-50"><div class="min-w-0 flex-1"><div class="flex items-center gap-2 text-sm font-medium text-gray-900"><span>${escapeHtml(d)}</span>${badge}</div><div class="truncate text-xs text-gray-500">${escapeHtml(row.title || '')}</div></div><button class="restore-version h-8 px-3 rounded border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50" data-key="${escapeHtml(row.key)}">${escapeHtml(t('restore'))}</button></div>`;
}
async function renderHistory() {
  const manualRows = await getHistory(state.current.id, 'manual');
  if (!manualRows.length) {
    els.historyList.innerHTML = `<div class="p-6 text-sm text-gray-500">${escapeHtml(t('noHistory'))}</div>`;
    return;
  }
  const manualSection = `<div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">${escapeHtml(t('manualHistory'))}</div>${manualRows.map(row => historyRowHtml(row)).join('')}`;
  els.historyList.innerHTML = manualSection;
}
async function restoreVersion(key) {
  if (!key) return;
  const rows = await getHistory(state.current.id, 'manual');
  const row = rows.find(x => x.key === key);
  if (!row) return;
  closeHistoryModal();
  openDraftRecoveryModal({
    key,
    pageId: state.current.id || '',
    currentSnapshot: currentSnapshotFromState(),
    draftRecord: row,
    mode: 'history-manual',
    titleKey: 'compareBeforeRestore',
    subtitle: t('selectedHistoryVersion'),
    rightTitleKey: 'selectedHistoryVersion',
    leftTitleKey: 'currentEditorContent',
    restoreTextKey: 'restoreSelectedVersion',
    showDiscard: false
  });
}
