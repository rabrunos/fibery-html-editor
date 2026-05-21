function codeIconSvg(className = 'h-3.5 w-3.5'): string { return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m8 9-3 3 3 3m8-6 3 3-3 3M13 6l-2 12"/></svg>`; }
function appPageBadge(pageId: string): string {
  if (!state.appPageId || pageId !== state.appPageId) return '';
  return `<span class="ml-1 inline-flex h-5 w-5 shrink-0 self-center items-center justify-center rounded-md bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200" title="${escapeHtml(t('appPageMarker'))}">${codeIconSvg()}</span>`;
}
function projectPageIds(): Set<string> { return new Set((state.projects.items || []).map(item => item.pageId).filter(Boolean)); }
function moreIconSvg(className = 'h-4 w-4'): string { return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13.5 17.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>`; }
function archivedBadge(pageId: string): string { return getMetaMap()[pageId]?.archivedAt ? `<span class="archived-badge ml-1">${escapeHtml(t('archive'))}</span>` : ''; }
function pageMenuButton(pageId: string, title: string, projectId = ''): string { return `<button class="page-menu sidebar-more-btn sidebar-page-menu-btn mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700" data-page-id="${escapeHtml(pageId)}" data-page-title="${escapeHtml(title || 'Untitled')}" data-project-id="${escapeHtml(projectId || '')}" title="More">${moreIconSvg()}</button>`; }
function projectMenuButton(projectId: string, projectName: string): string { return `<button class="project-menu sidebar-more-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700" data-project-id="${escapeHtml(projectId)}" data-project-name="${escapeHtml(projectName || t('untitledProject'))}" title="More">${moreIconSvg()}</button>`; }
function pageItemHtml(page: FiberyPage, compact = false): string {
  const active = page.id === state.current.id && !state.blank;
  const description = String(page.description || '').trim();
  const descriptionHtml = (!compact && description) ? `<div class="page-description sidebar-page-description truncate text-[11px] ${active ? 'text-blue-600/70' : 'text-gray-500'}">${escapeHtml(description)}</div>` : '';
  return `<div class="group sidebar-page-row flex gap-1 rounded-lg ${active ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-100'}" data-page-row-id="${escapeHtml(page.id)}"><button class="page-open sidebar-page-open relative min-w-0 flex-1 rounded-lg py-1 pl-3 pr-1 text-left transition-colors ${active ? 'text-blue-800' : 'text-gray-800'}" data-id="${escapeHtml(page.id)}">${active ? '<span class="sidebar-active-indicator"></span>' : ''}<div class="sidebar-page-mainline min-w-0 gap-1"><div class="page-title min-w-0 flex-1 truncate text-sm font-medium" data-page-title-id="${escapeHtml(page.id)}">${escapeHtml(page.title || 'Untitled')}</div>${appPageBadge(page.id)}${archivedBadge(page.id)}</div>${descriptionHtml}</button>${pageMenuButton(page.id, page.title)}</div>`;
}
function renderSidebarPages(): void {
  if (!state.sidebar.open) return;
  renderSidebarProjects();
  if (!state.sidebar.pages.length) {
    els.sidebarPagesList.innerHTML = `<div class="sidebar-label p-4 text-center text-sm text-gray-400">${escapeHtml(t('noPages'))}</div>`;
    updateSidebarLoadMore();
    return;
  }
  els.sidebarPagesList.innerHTML = state.sidebar.pages.map(page => pageItemHtml(page)).join('');
  updateSidebarLoadMore();
}
function updateSidebarActiveState(): void {
  if (!state.sidebar.open) return;
  document.querySelectorAll('#sidebarPagesList [data-page-row-id], #sidebarProjectsList [data-page-row-id]').forEach(row => {
    const btn = row.querySelector('.page-open') as HTMLElement | null;
    if (!btn) return;
    const active = (btn as HTMLElement & { dataset: DOMStringMap }).dataset.id === state.current.id && !state.blank;

    row.className = `group sidebar-page-row flex gap-1 rounded-lg ${active ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-100'}`;
    btn.className = `page-open sidebar-page-open relative min-w-0 flex-1 rounded-lg py-1 pl-3 pr-1 text-left transition-colors ${active ? 'text-blue-800' : 'text-gray-800'}`;

    const indicator = btn.querySelector('.sidebar-active-indicator');
    if (active && !indicator) btn.insertAdjacentHTML('afterbegin', '<span class="sidebar-active-indicator"></span>');
    if (!active && indicator) indicator.remove();

    const desc = btn.querySelector('.page-description');
    if (desc) desc.className = `page-description sidebar-page-description truncate text-[11px] ${active ? 'text-blue-600/70' : 'text-gray-500'}`;
  });
}
function updateSidebarLoadMore(): void {
  if (!els.sidebarLoadMoreWrap) return;
  els.sidebarLoadMoreWrap.classList.toggle('hidden', !state.sidebar.open || !state.sidebar.hasMore);
}
