function revokeLocalPreviewObjectUrl() {
  const current = state.preview?.localObjectUrl;
  if (!current) return;
  try { URL.revokeObjectURL(current); } catch (_) {}
  state.preview.localObjectUrl = '';
}
function clearPreviewDebounce() {
  if (!state.preview.debounceTimer) return;
  window.clearTimeout(state.preview.debounceTimer);
  state.preview.debounceTimer = null;
}
function localPreviewBaseHref() {
  try { return new URL('.', window.location.href).href; } catch (_) {}
  try { return window.location.origin + '/'; } catch (_) {}
  return '';
}
function localPreviewStatusLabel({ usesTailwind = false } = {}) { return usesTailwind ? t('localPreviewStatusTailwind') : t('localPreviewStatus'); }
function previewHeaderStatusLabel() {
  if (state.blank) return '—';
  return String(state.current.title || state.current.id || t('preview'));
}
function updatePreviewHeaderStatus() {
  if (!els.previewStatus) return;
  els.previewStatus.textContent = previewHeaderStatusLabel();
}
function logPreviewModeChange(nextMode, previousMode) {
  const next = String(nextMode || '');
  const previous = String(previousMode || '');
  if (!next || next === previous) return;
  if (next === 'real' && !state.current.id) return;
  state.preview.lastLoggedMode = next;
  log(t(next === 'local' ? 'previewModeLocalLog' : 'previewModeRealLog'));
}
function htmlUsesTailwindStylesheet(html = '') {
  return /<link\b[^>]*href\s*=\s*["'](?:\.\/|\/)?tailwind\.css["'][^>]*>/i.test(String(html || ''));
}
function shouldUseLocalPreview() {
  if (state.blank) return false;
  if (typeof shouldForceLocalPreviewForCachedOpen === 'function' && shouldForceLocalPreviewForCachedOpen()) return true;
  if (!state.current.id) return true;
  return !sameSnapshot(currentSnapshotFromState(), currentBaselineSnapshot());
}
function localPreviewRenderSignature(html, baseHref, usesTailwind) {
  return snapshotSignature({
    title: String(baseHref || ''),
    description: usesTailwind ? '1' : '0',
    html: String(html || '')
  });
}
function localPreviewRequestId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function handleLocalPreviewMessage(event) {
  const data = event?.data;
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
