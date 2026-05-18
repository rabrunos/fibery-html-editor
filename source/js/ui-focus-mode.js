function enterPreviewFocus() { if (!state.current.id) return; state.previewFocus = true; document.body.classList.add('preview-focus'); }
function exitPreviewFocus() { state.previewFocus = false; document.body.classList.remove('preview-focus'); window.setTimeout(() => { try { state.code.editor?.layout(); } catch (_) {} }, 0); }
