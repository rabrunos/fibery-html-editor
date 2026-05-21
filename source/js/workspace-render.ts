function markDirty(value = true): void {
  state.dirty = !!value;
  els.dirtyBadge.classList.toggle('hidden', !state.dirty);
  if (state.dirty) scheduleDraftAutosave();
  else clearDraftAutosaveTimer();
  if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
  if (typeof syncBeforeUnloadWarningState === 'function') syncBeforeUnloadWarningState();
}

function updateCharCount(): void {
  els.charCount.textContent = String(getCodeValue().length) + ' chars';
}

function updateCurrentFromInputs(): void {
  state.current.title = els.titleInput.value;
  state.current.description = els.descriptionInput.value;
  state.current.html = getCodeValue();
}

function showBlankPage(): void {
  clearPreviewDebounce();
  revokeLocalPreviewObjectUrl();
  state.preview.mode = 'real';
  state.preview.paused = false;
  state.preview.needsSync = false;
  state.preview.pendingForceRealReload = false;
  state.preview.localStatusLabel = '';
  state.preview.activeRequestId = '';
  state.preview.lastLocalDocSignature = '';
  state.preview.lastLocalHtmlSignature = '';
  state.preview.lastLocalUsesTailwind = false;
  state.preview.lastRealUrl = '';
  state.blank = true;
  state.current = { id: '', title: '', description: '', html: '' };
  resetCachedPageOpenState('');
  setCurrentBaseline();
  if (typeof resetExternalSyncStateForCurrentPage === 'function') resetExternalSyncStateForCurrentPage('');
  markDirty(false);
  setCodeValue('');
  els.pageHeader.classList.add('hidden');
  els.splitArea.classList.add('hidden');
  els.welcomeView.classList.remove('hidden');
  els.historyBtn.disabled = true;
  els.deleteBtn.disabled = true;
  if (els.externalSyncCheckNowBtn) els.externalSyncCheckNowBtn.classList.add('hidden');
  if (els.updateAppBtn) els.updateAppBtn.classList.add('hidden');
  els.previewFrame.removeAttribute('src');
  els.previewFrame.srcdoc = '';
  setStatus(t('noPage'));
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  updateSidebarActiveState();
  renderSidebarProjects();
  updateRecoveryReopenButton();
  syncSaveAvailabilityState();
  syncCachedOpenCheckNowButtonLabel();
}

function showWorkspace(): void {
  state.blank = false;
  els.welcomeView.classList.add('hidden');
  els.pageHeader.classList.remove('hidden');
  els.splitArea.classList.remove('hidden');
  window.setTimeout(() => { try { (state.code.editor as { layout(): void } | null)?.layout(); } catch (_) {} }, 0);
}

function setPanelMode(mode: string, persist = true): void {
  state.panelMode = (['both', 'editor', 'preview'].includes(mode) ? mode : 'both') as PanelMode;
  document.body.classList.toggle('panel-editor-only', state.panelMode === 'editor');
  document.body.classList.toggle('panel-preview-only', state.panelMode === 'preview');
  [els.quickBothBtn, els.quickEditorBtn, els.quickPreviewBtn].forEach(btn => btn && btn.classList.remove('bg-blue-50', 'text-blue-700'));
  const activeBtn = state.panelMode === 'editor' ? els.quickEditorBtn : state.panelMode === 'preview' ? els.quickPreviewBtn : els.quickBothBtn;
  if (activeBtn) activeBtn.classList.add('bg-blue-50', 'text-blue-700');
  if (persist) localStorage.setItem(LS.panelMode, state.panelMode);
  syncPreviewVisibilityState({ immediate: true });
  window.setTimeout(() => { try { (state.code.editor as { layout(): void } | null)?.layout(); } catch (_) {} }, 0);
}

function renderCurrent(): void {
  showWorkspace();
  els.titleInput.value = state.current.title || '';
  els.descriptionInput.value = state.current.description || '';
  setCodeValue(state.current.html || '');
  updateCharCount();
  markDirty(false);
  els.historyBtn.disabled = !state.current.id;
  if (els.openViewMenuBtn) els.openViewMenuBtn.disabled = !state.current.id;
  els.deleteBtn.disabled = !state.current.id || !state.isAdmin;
  if (els.externalSyncCheckNowBtn) els.externalSyncCheckNowBtn.classList.toggle('hidden', !state.current.id || !state.externalSync.enabled);
  if (els.updateAppBtn) els.updateAppBtn.classList.toggle('hidden', !(state.appPageId && state.current.id === state.appPageId && !state.blank));
  updateSidebarActiveState();
  updateRecoveryReopenButton();
  syncSaveAvailabilityState();
  syncCachedOpenCheckNowButtonLabel();
}
