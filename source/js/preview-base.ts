function revokeLocalPreviewObjectUrl(): void {
  const current = state.preview?.localObjectUrl;
  if (!current) return;
  try { URL.revokeObjectURL(current); } catch (_) {}
  state.preview.localObjectUrl = '';
}

function clearPreviewDebounce(): void {
  if (!state.preview.debounceTimer) return;
  window.clearTimeout(state.preview.debounceTimer);
  state.preview.debounceTimer = null;
}

function queuePreviewSync({ forceRealReload = false }: QueuePreviewSyncOptions = {}): void {
  if (forceRealReload) state.preview.pendingForceRealReload = true;
  state.preview.needsSync = true;
}

function isPreviewPanelVisible(): boolean {
  if (state.blank) return false;
  if (state.previewFocus) return true;
  if (String(state.panelMode || 'both') === 'editor') return false;
  if (!els.splitArea || els.splitArea.classList.contains('hidden')) return false;
  if (!els.previewPane) return false;
  try { return els.previewPane.getClientRects().length > 0; } catch (_) { return false; }
}

function pausePreviewIfHidden({ markNeedsSync = true }: PausePreviewOptions = {}): boolean {
  if (isPreviewPanelVisible()) return false;
  clearPreviewDebounce();
  if (markNeedsSync && !state.blank) queuePreviewSync();
  if (state.blank || !state.current.id) return true;
  if (state.preview.paused) return true;
  state.preview.paused = true;
  state.preview.mode = 'paused';
  state.preview.activeRequestId = '';
  state.preview.localStatusLabel = '';
  state.preview.lastLocalDocSignature = '';
  state.preview.lastLocalHtmlSignature = '';
  state.preview.lastLocalUsesTailwind = false;
  try {
    if (els.previewFrame) {
      els.previewFrame.removeAttribute('srcdoc');
      if (els.previewFrame.getAttribute('src') !== 'about:blank') els.previewFrame.src = 'about:blank';
    }
  } catch (_) {}
  log(t('previewPausedHiddenLog'));
  return true;
}

function resumePreviewIfVisible({ immediate = true }: ResumePreviewOptions = {}): boolean {
  if (!isPreviewPanelVisible()) return false;
  const wasPaused = !!state.preview.paused;
  const needsSync = !!state.preview.needsSync;
  const forceRealReload = !!state.preview.pendingForceRealReload;
  state.preview.paused = false;
  state.preview.needsSync = false;
  state.preview.pendingForceRealReload = false;
  if (wasPaused) log(t('previewResumedLog'));
  if (state.blank) return true;
  if (wasPaused || needsSync || forceRealReload) {
    syncPreviewMode({ immediate: immediate !== false, forceRealReload });
  }
  return true;
}

function syncPreviewVisibilityState(options: SyncPreviewVisibilityOptions = {}): boolean {
  if (isPreviewPanelVisible()) return resumePreviewIfVisible(options);
  return pausePreviewIfHidden({ markNeedsSync: options.markNeedsSync !== false });
}

function localPreviewBaseHref(): string {
  try { return new URL('.', window.location.href).href; } catch (_) {}
  try { return window.location.origin + '/'; } catch (_) {}
  return '';
}

function localPreviewStatusLabel({ usesTailwind = false }: LocalPreviewStatusOptions = {}): string {
  return usesTailwind ? t('localPreviewStatusTailwind') : t('localPreviewStatus');
}

function previewHeaderStatusLabel(): string {
  if (state.blank) return '—';
  return String(state.current.title || state.current.id || t('preview'));
}

function updatePreviewHeaderStatus(): void {
  if (!els.previewStatus) return;
  els.previewStatus.textContent = previewHeaderStatusLabel();
}

function logPreviewModeChange(nextMode: PreviewMode | string, previousMode: PreviewMode | string): void {
  const next = String(nextMode || '');
  const previous = String(previousMode || '');
  if (!next || next === previous) return;
  if (next === 'real' && !state.current.id) return;
  state.preview.lastLoggedMode = next;
  log(t(next === 'local' ? 'previewModeLocalLog' : 'previewModeRealLog'));
}

function htmlUsesTailwindStylesheet(html: string = ''): boolean {
  return /<link\b[^>]*href\s*=\s*["'](?:\.\/|\/)?tailwind\.css["'][^>]*>/i.test(String(html || ''));
}

function shouldUseLocalPreview(): boolean {
  if (state.blank) return false;
  if (typeof shouldForceLocalPreviewForCachedOpen === 'function' && shouldForceLocalPreviewForCachedOpen()) return true;
  if (!state.current.id) return true;
  return !sameSnapshot(currentSnapshotFromState(), currentBaselineSnapshot());
}

function localPreviewRenderSignature(html: string, baseHref: string, usesTailwind: boolean): ContentSignature {
  return snapshotSignature({
    title: String(baseHref || ''),
    description: usesTailwind ? '1' : '0',
    html: String(html || '')
  });
}

function localPreviewRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function handleLocalPreviewMessage(event: MessageEvent<LocalPreviewMessagePayload>): void {
  const data = event.data;
  if (!data || data.source !== LOCAL_PREVIEW_MESSAGE_SOURCE) return;
  if (event.source !== els.previewFrame.contentWindow) return;
  if (state.preview.mode !== 'local') return;
  if (!data.requestId || data.requestId !== state.preview.activeRequestId) return;

  if (data.type === 'css-load') {
    log(`${t('localPreviewPocCssLoaded')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
  } else if (data.type === 'css-error') {
    log(`${t('localPreviewPocCssFailed')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
  } else if (data.type === 'css-timeout') {
    log(`${t('localPreviewPocCssTimeout')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
  } else if (data.type === 'css-missing') {
    log(`${t('localPreviewPocCssMissing')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
  } else if (data.type === 'tailwind-browser-load') {
    log(t('localPreviewTailwindBrowserLoaded'));
  } else if (data.type === 'tailwind-browser-error') {
    log(t('localPreviewTailwindBrowserFailed'));
  }
}
