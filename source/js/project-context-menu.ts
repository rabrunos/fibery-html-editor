function openProjectContextMenu(event: MouseEvent, projectId: string, _projectTitle = ''): void {
  event.preventDefault(); event.stopPropagation();
  if (!shouldToggleFloatingMenu(els.projectContextMenu, event.currentTarget)) return;
  state.context.projectId = projectId;
  els.projectContextMenu.innerHTML = `<button class="context-menu-item" data-action="add-current-to-project">${escapeHtml(t('addCurrentToProject'))}</button><div class="my-1 border-t border-gray-100"></div><button class="context-menu-item" data-action="rename-project">${escapeHtml(t('renameProject'))}</button><button class="context-menu-item context-menu-danger" data-action="delete-project">${escapeHtml(t('deleteProject'))}</button>`;
  positionFloatingMenu(els.projectContextMenu, event.clientX, event.clientY);
}
