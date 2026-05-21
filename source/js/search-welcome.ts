function openWelcomeSearch(): void {
  els.welcomeSearchResults.classList.remove('hidden');
  if (!els.welcomeSearchResults.innerHTML.trim()) loadWelcomeSearchResults({ localOnly: true });
}
function closeWelcomeSearch(): void { els.welcomeSearchResults.classList.add('hidden'); }

async function loadWelcomeSearchResults(options: { localOnly?: boolean } = {}): Promise<void> {
  const query = String(state.welcomeSearch.query || '').trim();
  const limit = query ? 20 : 8;
  const localRows = localSearchRows(query, limit);
  state.welcomeSearch.pages = localRows;
  renderWelcomeSearchResults(localRows);
  if (!query || options.localOnly) return;

  const cached = searchCacheEntry(state.welcomeSearch, query);
  if (cached) {
    state.welcomeSearch.pages = cached.pages;
    renderWelcomeSearchResults(cached.pages);
    return;
  }
  if (state.welcomeSearch.loading && state.welcomeSearch.remoteQuery === query) return;

  state.welcomeSearch.loading = true;
  state.welcomeSearch.remoteQuery = query;
  if (!localRows.length) els.welcomeSearchResults.innerHTML = `<div class="p-4 text-center text-sm text-gray-400">${escapeHtml(t('loading'))}</div>`;
  try {
    const rows = normalizePageRows(await API.loadPages({ skip: 0, limit, search: query, source: 'welcome-search' }));
    cachePagesForSidebar(rows);
    setSearchCacheEntry(state.welcomeSearch, query, rows);
    if (state.welcomeSearch.query === query) {
      state.welcomeSearch.pages = rows;
      renderWelcomeSearchResults(rows);
    }
  } catch (err) {
    if (!localRows.length) els.welcomeSearchResults.innerHTML = `<div class="p-4 text-center text-sm text-red-500">${escapeHtml((err as Error).message || String(err))}</div>`;
    log((err as Error).message || String(err));
  } finally {
    if (state.welcomeSearch.remoteQuery === query) {
      state.welcomeSearch.loading = false;
      state.welcomeSearch.remoteQuery = '';
    }
  }
}

function renderWelcomeSearchResults(rows: FiberyPage[]): void { if (!rows.length) { els.welcomeSearchResults.innerHTML = `<div class="p-4 text-center text-sm text-gray-400">${escapeHtml(t('noPages'))}</div>`; return; } let html = ''; if (!state.welcomeSearch.query) html += `<div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(t('recentPages'))}</div>`; for (const [label, pages] of groupedPages(rows)) { if (state.welcomeSearch.query) html += `<div class="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(label)}</div>`; for (const page of pages) html += searchRowHtml(page, true); } els.welcomeSearchResults.innerHTML = html; }
