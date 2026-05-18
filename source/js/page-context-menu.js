function openPageContextMenu(event, pageId, pageTitle = '', projectId = '') {
  event.preventDefault(); event.stopPropagation();
  if (!shouldToggleFloatingMenu(els.pageContextMenu, event.currentTarget)) return;
  state.context.pageId = pageId; state.context.pageTitle = pageTitle || 'Untitled'; state.context.projectId = projectId || state.projects.pageToProject[pageId] || '';
  const meta = getMetaMap()[pageId] || {};
  const removeText = state.context.projectId ? t('removeFromProjectNamed').replace('{project}', projectName(state.context.projectId)) : '';
  els.pageContextMenu.innerHTML = `
    <button class="context-menu-item" data-action="rename-page">${escapeHtml(t('rename'))}</button>
    <button class="context-menu-item" data-action="open-preview">${escapeHtml(t('openPreview'))}</button>
    <button class="context-menu-item" data-action="copy-page-link">${escapeHtml(t('copyPageLink'))}</button>
    <button class="context-menu-item" data-action="pin-page">${escapeHtml(meta.pinnedAt ? t('unpin') : t('pin'))}</button>
    <button class="context-menu-item" data-action="archive-page">${escapeHtml(meta.archivedAt ? t('unarchive') : t('archive'))}</button>
    <button class="context-menu-item justify-between" data-action="move-to-project"><span>${escapeHtml(t('moveToProject'))}</span><span class="text-gray-400">›</span></button>
    ${state.context.projectId ? `<button class="context-menu-item" data-action="remove-from-project">${escapeHtml(removeText)}</button>` : ''}
    <div class="my-1 border-t border-gray-100"></div>
    <button class="context-menu-item context-menu-danger" data-action="delete-page">${escapeHtml(t('deletePage'))}</button>`;
  positionFloatingMenu(els.pageContextMenu, event.clientX, event.clientY);
}
function openMoveProjectMenu(anchor) {
  const pageId = state.context.pageId;
  const projects = [...(state.projects.rows || [])].sort((a,b) => Number(b.sortOrder || 0) - Number(a.sortOrder || 0));
  els.moveProjectMenu.innerHTML = `<button class="context-menu-item" data-project-action="new-project">${escapeHtml(t('newProject'))}</button>${projects.length ? '<div class="my-1 border-t border-gray-100"></div>' : ''}` + projects.map(project => `<button class="context-menu-item" data-project-action="move" data-project-id="${escapeHtml(project.id)}"><span class="truncate">${escapeHtml(project.name || t('untitledProject'))}</span></button>`).join('');
  const rect = anchor.getBoundingClientRect();
  positionFloatingMenu(els.moveProjectMenu, rect.right + 4, rect.top);
  state.context.pageId = pageId;
}
