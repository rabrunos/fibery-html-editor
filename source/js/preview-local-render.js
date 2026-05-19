function renderLocalPreview() {
  updateCurrentFromInputs();
  const html = getCodeValue();
  const usesTailwind = htmlUsesTailwindStylesheet(html);
  const baseHref = localPreviewBaseHref();
  const renderSignature = localPreviewRenderSignature(html, baseHref, usesTailwind);
  const htmlSignature = snapshotSignature({ title: '', description: '', html });

  if (state.preview.mode === 'local' && state.preview.lastLocalDocSignature === renderSignature) {
    const statusLabel = localPreviewStatusLabel({ usesTailwind });
    els.previewStatus.textContent = statusLabel;
    state.preview.localStatusLabel = statusLabel;
    state.preview.lastLocalUsesTailwind = usesTailwind;
    if (!(typeof shouldKeepCachedOpenStatusMessage === 'function' && shouldKeepCachedOpenStatusMessage())) {
      setStatus(statusLabel);
    }
    return;
  }

  const requestId = localPreviewRequestId();
  const doc = buildLocalPreviewDocument(html, { requestId, baseHref, enableTailwindBrowser: usesTailwind });
  clearPreviewDebounce();
  revokeLocalPreviewObjectUrl();
  state.preview.mode = 'local';
  state.preview.activeRequestId = requestId;
  state.preview.lastLocalDocSignature = renderSignature;
  state.preview.lastLocalHtmlSignature = htmlSignature;
  state.preview.lastLocalUsesTailwind = usesTailwind;
  const statusLabel = localPreviewStatusLabel({ usesTailwind });
  state.preview.localStatusLabel = statusLabel;
  els.previewStatus.textContent = statusLabel;
  if (!(typeof shouldKeepCachedOpenStatusMessage === 'function' && shouldKeepCachedOpenStatusMessage())) {
    setStatus(statusLabel);
  }

  els.previewFrame.removeAttribute('src');
  els.previewFrame.srcdoc = doc;
}
function scheduleLocalPreviewRefresh() {
  if (state.blank) return;
  if (!shouldUseLocalPreview()) { renderRealPreview(); return; }
  clearPreviewDebounce();
  state.preview.debounceTimer = window.setTimeout(() => {
    state.preview.debounceTimer = null;
    if (!shouldUseLocalPreview()) { renderRealPreview(); return; }
    renderLocalPreview();
  }, state.preview.debounceMs);
}
