function enterPreviewFocus(): void {
  if (!state.current.id) return;
  state.previewFocus = true;
  document.body.classList.add('preview-focus');
  syncPreviewVisibilityState({ immediate: true });
}

function exitPreviewFocus(): void {
  state.previewFocus = false;
  document.body.classList.remove('preview-focus');
  syncPreviewVisibilityState({ immediate: true });
  window.setTimeout(() => { try { (state.code.editor as { layout(): void } | null)?.layout(); } catch (_) {} }, 0);
}
