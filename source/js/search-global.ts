type SearchCacheMap = Record<string, { at: number; pages: FiberyPage[] } | undefined>;

function searchCacheEntry(searchState: SearchState, query: string): { at: number; pages: FiberyPage[] } | null {
  const key = String(query || '').toLowerCase();
  const cached = (searchState.cache as unknown as SearchCacheMap)[key];
  if (!cached) return null;
  if (Date.now() - Number(cached.at || 0) > 120000) return null;
  return cached;
}

function setSearchCacheEntry(searchState: SearchState, query: string, pages: FiberyPage[]): void {
  const key = String(query || '').toLowerCase();
  (searchState.cache as unknown as SearchCacheMap)[key] = { at: Date.now(), pages: normalizePageRows(pages) };
}

function clearSearchCaches(): void {
  state.search.cache = {};
  state.welcomeSearch.cache = {};
}

function localSearchRows(query = '', limit = 20): FiberyPage[] {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const rows = knownLocalPages();
  if (!normalizedQuery) return rows.slice(0, limit);
  return rows
    .filter(page => `${page.title || ''}\n${page.description || ''}`.toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
}

function openSearchModal(): void {
  els.searchModal.classList.remove('hidden');
  els.globalSearchInput.value = '';
  state.search.query = '';
  setTimeout(() => els.globalSearchInput.focus(), 0);
  loadSearchResults({ localOnly: true });
}
function closeSearchModal(): void { els.searchModal.classList.add('hidden'); }

async function loadSearchResults(options: { localOnly?: boolean } = {}): Promise<void> {
  const query = String(state.search.query || '').trim();
  const limit = query ? 20 : 8;
  const localRows = localSearchRows(query, limit);
  state.search.pages = localRows;
  renderSearchResults(localRows);
  if (!query || options.localOnly) return;

  const cached = searchCacheEntry(state.search, query);
  if (cached) {
    state.search.pages = cached.pages;
    renderSearchResults(cached.pages);
    return;
  }
  if (state.search.loading && state.search.remoteQuery === query) return;

  state.search.loading = true;
  state.search.remoteQuery = query;
  if (!localRows.length) els.globalSearchResults.innerHTML = `<div class="p-8 text-center text-sm text-gray-400">${escapeHtml(t('loading'))}</div>`;
  try {
    const rows = normalizePageRows(await API.loadPages({ skip: 0, limit, search: query, source: 'search-global' }));
    cachePagesForSidebar(rows);
    setSearchCacheEntry(state.search, query, rows);
    if (state.search.query === query) {
      state.search.pages = rows;
      renderSearchResults(rows);
    }
  } catch (err) {
    if (!localRows.length) els.globalSearchResults.innerHTML = `<div class="p-8 text-center text-sm text-red-500">${escapeHtml((err as Error).message || String(err))}</div>`;
    log((err as Error).message || String(err));
  } finally {
    if (state.search.remoteQuery === query) {
      state.search.loading = false;
      state.search.remoteQuery = '';
    }
  }
}

function searchRowHtml(page: FiberyPage, compact = false): string {
  const projectId = state.projects.pageToProject[page.id] || '';
  const active = page.id === state.current.id && !state.blank;
  const description = String(page.description || '').trim();
  const title = page.title || 'Untitled';
  const descriptionHtml = description ? `<div class="${compact ? 'truncate' : 'clamp-2'} text-xs leading-4 ${active ? 'text-blue-600/70' : 'text-gray-500'}">${escapeHtml(description)}</div>` : '';
  return `<div class="search-row group flex items-center gap-2 rounded-xl px-3 py-2 ${active ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-100'}" data-page-row-id="${escapeHtml(page.id)}"><button class="page-open min-w-0 flex-1 text-left" data-id="${escapeHtml(page.id)}" title="${escapeHtml(title)}"><div class="flex min-w-0 items-center gap-1"><div class="truncate text-sm font-medium ${active ? 'text-blue-800' : 'text-gray-900'}" data-page-title-id="${escapeHtml(page.id)}">${escapeHtml(title)}</div>${appPageBadge(page.id)}${archivedBadge(page.id)}</div>${descriptionHtml}</button><a class="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50" target="_blank" href="${viewUrl(page.id)}" title="${escapeHtml(t('openPreview'))}">${escapeHtml(t('view'))}</a><button class="page-menu shrink-0 flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900" data-id="${escapeHtml(page.id)}" data-page-id="${escapeHtml(page.id)}" data-page-title="${escapeHtml(title)}" data-project-id="${escapeHtml(projectId)}" title="More">${iconMoreVertical({ className: 'h-4 w-4' })}</button></div>`;
}
function renderSearchResults(rows: FiberyPage[]): void { if (!rows.length) { els.globalSearchResults.innerHTML = `<div class="p-8 text-center text-sm text-gray-400">${escapeHtml(t('noPages'))}</div>`; return; } let html = ''; if (!state.search.query) html += `<div class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(t('recentPages'))}</div>`; for (const [label, pages] of groupedPages(rows)) { if (state.search.query) html += `<div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(label)}</div>`; for (const page of pages) html += searchRowHtml(page); } els.globalSearchResults.innerHTML = html; }
