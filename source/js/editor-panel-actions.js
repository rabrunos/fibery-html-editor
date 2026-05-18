function openEditorPanelMenu(event) {
  event.preventDefault(); event.stopPropagation();
  if (!shouldToggleFloatingMenu(els.editorPanelMenu, event.currentTarget)) return;
  els.editorPanelMenu.innerHTML = `
    <button class="context-menu-item" data-panel-action="paste-replace">${escapeHtml(t('pasteReplace'))}</button>
    <button class="context-menu-item" data-panel-action="import-html">${escapeHtml(t('importHtml'))}</button>
    <button class="context-menu-item" data-panel-action="select-all-code">${escapeHtml(t('selectAllCode'))}</button>`;
  const rect = event.currentTarget.getBoundingClientRect();
  positionFloatingMenu(els.editorPanelMenu, rect.right - 208, rect.bottom + 6);
}
function selectAllCode(target) {
  if (state.code.editor) {
    const model = state.code.editor.getModel();
    state.code.editor.focus();
    if (model && window.monaco) {
      const lastLine = model.getLineCount();
      const lastColumn = model.getLineMaxColumn(lastLine);
      state.code.editor.setSelection(new monaco.Range(1, 1, lastLine, lastColumn));
    }
  } else {
    els.codeEditorFallback.focus();
    els.codeEditorFallback.select();
  }
  showToastNear(target, t('codeSelected'));
}
async function pasteReplaceCode(target) {
  let text = '';
  try {
    text = await navigator.clipboard.readText();
  } catch (_) {
    const fallback = window.prompt(t('pasteReplacePrompt'), '');
    if (fallback === null) return;
    text = fallback;
  }
  setCodeValue(text || '');
  updateCurrentFromInputs();
  markDirty(true);
  scheduleLocalPreviewRefresh();
  showToastNear(target, t('pastedReplaced'));
}
function importHtmlFile(target) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.html,.htm,text/html';
  input.style.display = 'none';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCodeValue(String(reader.result || ''));
      updateCurrentFromInputs();
      markDirty(true);
      scheduleLocalPreviewRefresh();
      showToastNear(target || els.editorPanelMenuBtn, t('htmlImported'));
      log(`${t('htmlImported')}: ${file.name}`);
    };
    reader.onerror = () => {
      showToastNear(target || els.editorPanelMenuBtn, t('importHtmlError'));
      log(`${t('importHtmlError')}: ${file.name}`);
    };
    reader.readAsText(file);
  });
  document.body.appendChild(input);
  input.click();
}
