function viewUrl(id: string): string {
  if (!id) return 'about:blank';
  return new URL('/api/ai-answer/pages/' + encodeURIComponent(id) + '/view', window.location.origin).href;
}

function renderRealPreview({ forceReload = false }: RealPreviewRenderOptions = {}): void {
  if (pausePreviewIfHidden()) {
    if (forceReload) queuePreviewSync({ forceRealReload: true });
    return;
  }
  state.preview.paused = false;
  state.preview.needsSync = false;
  if (forceReload) state.preview.pendingForceRealReload = false;
  const previousMode = state.preview.mode;
  clearPreviewDebounce();
  revokeLocalPreviewObjectUrl();
  state.preview.mode = 'real';
  logPreviewModeChange('real', previousMode);
  state.preview.activeRequestId = '';
  state.preview.localStatusLabel = '';
  state.preview.lastLocalDocSignature = '';
  state.preview.lastLocalHtmlSignature = '';
  state.preview.lastLocalUsesTailwind = false;
  if (!state.current.id) {
    els.previewFrame.removeAttribute('src');
    els.previewFrame.srcdoc = '<div style="font-family:system-ui;padding:24px;color:#6b7280;">' + t('noPage') + '</div>';
    els.previewStatus.textContent = '—';
    return;
  }
  const url = viewUrl(state.current.id);
  updatePreviewHeaderStatus();
  els.previewFrame.removeAttribute('srcdoc');
  if (forceReload && els.previewFrame.src === url) {
    try {
      recordPreviewUsage({ source: 'preview-real-reload', pageId: state.current.id });
      // Preserve legacy behavior: attempt direct reload and fallback to src assignment on failure.
      els.previewFrame.contentWindow!.location.reload();
      return;
    } catch (_) {}
  }
  if (els.previewFrame.src !== url || forceReload) {
    els.previewFrame.src = url;
    recordPreviewUsage({ source: forceReload ? 'preview-real-force' : 'preview-real', pageId: state.current.id });
  }
  state.preview.lastRealUrl = url;
}

function refreshPreview(): void {
  renderRealPreview({ forceReload: true });
}

function syncPreviewMode({ immediate = false, forceRealReload = false }: SyncPreviewModeOptions = {}): void {
  if (state.blank) return;
  if (pausePreviewIfHidden()) {
    if (forceRealReload) queuePreviewSync({ forceRealReload: true });
    return;
  }
  if (shouldUseLocalPreview()) {
    if (immediate) {
      clearPreviewDebounce();
      renderLocalPreview();
      return;
    }
    scheduleLocalPreviewRefresh();
    return;
  }
  renderRealPreview({ forceReload: !!forceRealReload });
}
