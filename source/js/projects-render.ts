function getPageSnapshot(pageId: string): { id: string; title: string; description: string } {
  const cached = state.sidebar.pageCache?.[pageId];
  const meta = getMetaMap()[pageId];
  return { id: pageId, title: cached?.title || meta?.title || 'Untitled', description: cached?.description || meta?.description || '' };
}
function projectPageItemHtml(item: ProjectItemRecord): string {
  const page = getPageSnapshot(item.pageId);
  if (getMetaMap()[page.id]?.archivedAt) return '';
  const active = page.id === state.current.id && !state.blank;
  const description = String(page.description || '').trim();
  const descriptionHtml = description ? `<div class="page-description sidebar-page-description truncate text-[11px] ${active ? 'text-blue-600/70' : 'text-gray-500'}">${escapeHtml(description)}</div>` : '';
  return `<div class="group group/projectitem sidebar-page-row flex gap-1 rounded-lg ${active ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-100'}" data-page-row-id="${escapeHtml(page.id)}">
    <button class="page-open sidebar-page-open relative min-w-0 flex-1 rounded-lg py-1 pl-3 pr-1 text-left ${active ? 'text-blue-800' : 'text-gray-800'}" data-id="${escapeHtml(page.id)}">${active ? '<span class="sidebar-active-indicator"></span>' : ''}<div class="sidebar-page-mainline min-w-0 gap-1"><div class="page-title min-w-0 flex-1 truncate text-sm font-medium" data-page-title-id="${escapeHtml(page.id)}">${escapeHtml(page.title || 'Untitled')}</div>${appPageBadge(page.id)}${archivedBadge(page.id)}</div>${descriptionHtml}</button>
    ${pageMenuButton(page.id, page.title, item.projectId)}
  </div>`;
}
function renderSidebarProjects(): void {
  if (!state.sidebar.open || !els.sidebarProjectsList) return;
  const projects = [...(state.projects.rows || [])].sort((a, b) => Number(b.sortOrder || 0) - Number(a.sortOrder || 0));
  if (!projects.length) {
    els.sidebarProjectsList.innerHTML = `<div class="px-2 py-2 text-xs text-gray-400">${escapeHtml(t('noProjects'))}</div>`;
    return;
  }
  els.sidebarProjectsList.innerHTML = projects.map(project => {
    const items = state.projects.itemsByProject[project.id] || [];
    const collapsed = !!project.collapsed;
    const chevron = collapsed ? 'M8.25 4.5 15.75 12l-7.5 7.5' : 'm19.5 8.25-7.5 7.5-7.5-7.5';
    const pagesHtml = collapsed ? '' : `<div class="mt-1 space-y-1 pl-2">${items.length ? items.map(projectPageItemHtml).join('') : `<div class="px-3 py-2 text-xs text-gray-400">${escapeHtml(t('noPages'))}</div>`}</div>`;
    return `<div class="project-block rounded-lg">
      <div class="group group/project flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-gray-100">
        <button class="project-toggle flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200" data-project-id="${escapeHtml(project.id)}" title="${escapeHtml(project.name || t('untitledProject'))}">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="${chevron}"/></svg>
        </button>
        <div class="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700" data-project-title-id="${escapeHtml(project.id)}" title="${escapeHtml(project.name || t('untitledProject'))}">${escapeHtml(project.name || t('untitledProject'))}</div>
        ${projectMenuButton(project.id, project.name || t('untitledProject'))}
      </div>
      ${pagesHtml}
    </div>`;
  }).join('');
}
