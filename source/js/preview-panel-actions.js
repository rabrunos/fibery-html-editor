function openPreviewPanelMenu(event) {
  event.preventDefault(); event.stopPropagation();
  if (!shouldToggleFloatingMenu(els.previewPanelMenu, event.currentTarget)) return;
  els.previewPanelMenu.innerHTML = `
    <button class="context-menu-item" data-panel-action="copy-preview-link">${escapeHtml(t('copyPreviewLink'))}</button>
    <button class="context-menu-item" data-panel-action="open-preview">${escapeHtml(t('openPreview'))}</button>
    <button class="context-menu-item" data-panel-action="refresh-preview">${escapeHtml(t('refreshPreview'))}</button>`;
  const rect = event.currentTarget.getBoundingClientRect();
  positionFloatingMenu(els.previewPanelMenu, rect.right - 208, rect.bottom + 6);
}
