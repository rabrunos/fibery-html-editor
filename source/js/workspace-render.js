function markDirty(value = true) {
  state.dirty = !!value;
  els.dirtyBadge.classList.toggle('hidden', !state.dirty);
  if (state.dirty) scheduleDraftAutosave();
  else clearDraftAutosaveTimer();
  if (typeof syncBeforeUnloadWarningState === 'function') syncBeforeUnloadWarningState();
}
function updateCharCount() { els.charCount.textContent = String(getCodeValue().length) + ' chars'; }
function updateCurrentFromInputs() { state.current.title = els.titleInput.value; state.current.description = els.descriptionInput.value; state.current.html = getCodeValue(); }
function showBlankPage() {
  clearPreviewDebounce();
  revokeLocalPreviewObjectUrl();
  state.preview.mode = 'real';
  state.preview.localStatusLabel = '';
  state.preview.activeRequestId = '';
  state.preview.lastLocalDocSignature = '';
  state.preview.lastLocalHtmlSignature = '';
  state.preview.lastLocalUsesTailwind = false;
  state.preview.lastRealUrl = '';
  state.blank = true;
  state.current = { id: '', title: '', description: '', html: '' };
  setCurrentBaseline();
  markDirty(false);
  setCodeValue('');
  els.pageHeader.classList.add('hidden');
  els.splitArea.classList.add('hidden');
  els.welcomeView.classList.remove('hidden');
  els.historyBtn.disabled = true;
  els.deleteBtn.disabled = true;
  if (els.updateAppBtn) els.updateAppBtn.classList.add('hidden');
  els.previewFrame.removeAttribute('src');
  els.previewFrame.srcdoc = '';
  setStatus(t('noPage'));
  updateSidebarActiveState();
  renderSidebarProjects();
  updateRecoveryReopenButton();
}
function showWorkspace() {
  state.blank = false;
  els.welcomeView.classList.add('hidden');
  els.pageHeader.classList.remove('hidden');
  els.splitArea.classList.remove('hidden');
  window.setTimeout(() => { try { state.code.editor?.layout(); } catch (_) {} }, 0);
}
function setPanelMode(mode, persist = true) {
  state.panelMode = ['both', 'editor', 'preview'].includes(mode) ? mode : 'both';
  document.body.classList.toggle('panel-editor-only', state.panelMode === 'editor');
  document.body.classList.toggle('panel-preview-only', state.panelMode === 'preview');
  [els.quickBothBtn, els.quickEditorBtn, els.quickPreviewBtn].forEach(btn => btn && btn.classList.remove('bg-blue-50','text-blue-700'));
  const activeBtn = state.panelMode === 'editor' ? els.quickEditorBtn : state.panelMode === 'preview' ? els.quickPreviewBtn : els.quickBothBtn;
  if (activeBtn) activeBtn.classList.add('bg-blue-50','text-blue-700');
  if (persist) localStorage.setItem(LS.panelMode, state.panelMode);
  window.setTimeout(() => { try { state.code.editor?.layout(); } catch (_) {} }, 0);
}
function renderCurrent() {
  showWorkspace();
  els.titleInput.value = state.current.title || '';
  els.descriptionInput.value = state.current.description || '';
  setCodeValue(state.current.html || '');
  updateCharCount();
  markDirty(false);
  els.historyBtn.disabled = !state.current.id;
  if (els.openViewMenuBtn) els.openViewMenuBtn.disabled = !state.current.id;
  els.deleteBtn.disabled = !state.current.id || !state.isAdmin;
  if (els.updateAppBtn) els.updateAppBtn.classList.toggle('hidden', !(state.appPageId && state.current.id === state.appPageId && !state.blank));
  updateSidebarActiveState();
  updateRecoveryReopenButton();
}
