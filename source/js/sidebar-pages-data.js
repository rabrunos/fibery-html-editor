function normalizePageRows(rows) { return (rows || []).map(p => ({ id: p.id, title: p.title || 'Untitled', description: p.description || '', ...p })); }
function pageListSignature(pages) { return pages.map(p => [p.id, p.title || '', p.description || ''].join('::')).join('|'); }
function savedLocalPages() {
  return Object.values(getMetaMap())
    .filter(meta => meta?.id && Number(meta.lastSavedAt || 0) > 0 && !meta.archivedAt)
    .sort((a, b) => {
      const pinDiff = Number(b.pinnedAt || 0) - Number(a.pinnedAt || 0);
      if (pinDiff) return pinDiff;
      return Number(b.lastSavedAt || 0) - Number(a.lastSavedAt || 0);
    })
    .map(meta => ({ id: meta.id, title: meta.title || 'Untitled', description: meta.description || '', __localSaved: true }));
}
async function loadSidebarPages(options = {}) {
  const opts = typeof options === 'boolean' ? { force: options, reset: true } : (options || {});
  const force = !!opts.force;
  const append = !!opts.append;
  const reset = !!opts.reset;
  if (!state.sidebar.open && !force) return;
  if (state.sidebar.loading) return;
  state.sidebar.loading = true;
  const previous = state.sidebar.pages;
  if (reset) state.sidebar.visibleLimit = state.sidebar.limit;
  if (append) state.sidebar.visibleLimit += state.sidebar.limit;
  if (!previous.length && !append) {
    els.sidebarPagesList.innerHTML = `<div class="sidebar-label p-4 text-center text-sm text-gray-400">${escapeHtml(t('loading'))}</div>`;
    els.sidebarLoadMoreWrap.classList.add('hidden');
  }
  try {
    const apiLimit = state.sidebar.visibleLimit + 1;
    const rows = await API.loadPages({ skip: 0, limit: apiLimit, search: '' });
    const apiRows = normalizePageRows(rows);
    for (const page of apiRows) if (page?.id) state.sidebar.pageCache[page.id] = page;
    for (const page of savedLocalPages()) if (page?.id && !state.sidebar.pageCache[page.id]) state.sidebar.pageCache[page.id] = page;
    const projectIds = projectPageIds();
    const saved = savedLocalPages().filter(p => !projectIds.has(p.id));
    const savedIds = new Set(saved.map(x => x.id));
    const combinedAll = saved.concat(apiRows.filter(p => p.id && !savedIds.has(p.id) && !projectIds.has(p.id) && !getMetaMap()[p.id]?.archivedAt));
    const nextPages = combinedAll.slice(0, state.sidebar.visibleLimit);
    state.sidebar.hasMore = combinedAll.length > state.sidebar.visibleLimit || rows.length > state.sidebar.visibleLimit;
    if (pageListSignature(previous) !== pageListSignature(nextPages) || previous.length !== nextPages.length) {
      state.sidebar.pages = nextPages;
      renderSidebarPages();
    } else {
      state.sidebar.pages = nextPages;
      updateSidebarActiveState();
      updateSidebarLoadMore();
    }
  } catch (err) {
    els.sidebarPagesList.innerHTML = `<div class="sidebar-label p-4 text-center text-sm text-red-500">${escapeHtml(err.message || err)}</div>`;
    els.sidebarLoadMoreWrap.classList.add('hidden');
  } finally {
    state.sidebar.loading = false;
  }
}
