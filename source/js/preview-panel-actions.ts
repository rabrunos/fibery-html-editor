function openPreviewPanelMenu(event: MouseEvent): void {
  event.preventDefault(); event.stopPropagation();
  if (!shouldToggleFloatingMenu(els.previewPanelMenu, event.currentTarget)) return;
  els.previewPanelMenu.innerHTML = `
    <button class="context-menu-item" data-panel-action="copy-preview-link">${escapeHtml(t('copyPreviewLink'))}</button>
    <button class="context-menu-item" data-panel-action="open-preview">${escapeHtml(t('openPreview'))}</button>
    <button class="context-menu-item" data-panel-action="refresh-preview">${escapeHtml(t('refreshPreview'))}</button>`;
  const currentTarget = event.currentTarget as HTMLElement;
  const rect = currentTarget.getBoundingClientRect();
  positionFloatingMenu(els.previewPanelMenu, rect.right - 208, rect.bottom + 6);
}
