interface SidebarLoadOptions {
  force?: boolean;
  append?: boolean;
  reset?: boolean;
  automatic?: boolean;
  source?: string;
  remote?: boolean;
  bypassRemoteTtl?: boolean;
}

function normalizePageRows(rows: FiberyPage[]): FiberyPage[] {
  return (rows || []).map(p => ({ ...p, title: p.title || 'Untitled', description: p.description || '' }));
}
function pageListSignature(pages: FiberyPage[]): string { return pages.map(p => [p.id, p.title || '', p.description || ''].join('::')).join('|'); }
function savedLocalPages(): FiberyPage[] {
  return Object.values(getMetaMap())
    .filter(meta => meta?.id && Number(meta.lastSavedAt || 0) > 0 && !meta.archivedAt)
    .sort((a, b) => {
      const pinDiff = Number(b.pinnedAt || 0) - Number(a.pinnedAt || 0);
      if (pinDiff) return pinDiff;
      return Number(b.lastSavedAt || 0) - Number(a.lastSavedAt || 0);
    })
    .map(meta => ({ id: meta.id, title: meta.title || 'Untitled', description: meta.description || '', html: '', __localSaved: true } as FiberyPage & { __localSaved: boolean }));
}

function knownLocalPages(): FiberyPage[] {
  const byId: Record<string, FiberyPage & { __localSaved?: boolean }> = {};
  for (const page of Object.values(state.sidebar.pageCache || {})) {
    const p = page as { id?: string; title?: string; description?: string; html?: string };
    if (p?.id) byId[p.id] = { ...p as FiberyPage, id: p.id, title: p.title || 'Untitled', description: p.description || '' };
  }
  for (const page of savedLocalPages()) {
    if (page?.id) byId[page.id] = { ...(byId[page.id] || {}), ...page };
  }
  if (!state.blank && state.current.id) {
    byId[state.current.id] = {
      ...(byId[state.current.id] || {}),
      id: state.current.id,
      title: state.current.title || 'Untitled',
      description: state.current.description || ''
    } as FiberyPage;
  }
  return Object.values(byId)
    .filter(page => page.id && !getMetaMap()[page.id]?.archivedAt)
    .sort((a, b) => pageTime(b) - pageTime(a));
}

function sidebarPagesFromCache(): FiberyPage[] {
  const projectIds = projectPageIds();
  return knownLocalPages().filter(page => page.id && !projectIds.has(page.id));
}

function cachePagesForSidebar(rows: FiberyPage[]): void {
  for (const page of normalizePageRows(rows)) {
    if (page?.id) state.sidebar.pageCache[page.id] = page;
  }
}

function refreshSidebarFromLocalCache(options: { reset?: boolean; append?: boolean } = {}): void {
  if (!state.sidebar.open) return;
  if (options.reset) state.sidebar.visibleLimit = state.sidebar.limit;
  if (options.append) state.sidebar.visibleLimit += state.sidebar.limit;

  const previous = state.sidebar.pages || [];
  const combinedAll = sidebarPagesFromCache();
  const nextPages = combinedAll.slice(0, state.sidebar.visibleLimit);
  state.sidebar.hasMore = combinedAll.length > state.sidebar.visibleLimit;
  state.sidebar.pages = nextPages;

  if (!nextPages.length) {
    renderSidebarPages();
    return;
  }
  if (pageListSignature(previous) !== pageListSignature(nextPages) || previous.length !== nextPages.length) {
    renderSidebarPages();
  } else {
    updateSidebarActiveState();
    updateSidebarLoadMore();
  }
}

function shouldUseRecentSidebarRemoteLoad(options: { force?: boolean; bypassRemoteTtl?: boolean } = {}): boolean {
  if (options.force || options.bypassRemoteTtl) return false;
  const lastRemoteLoadAt = Number(state.sidebar.lastRemoteLoadAt || 0);
  const ttl = Math.max(60000, Number(state.sidebar.remoteCacheTtlMs || 300000));
  return !!lastRemoteLoadAt && (Date.now() - lastRemoteLoadAt) < ttl;
}

async function loadSidebarPages(options: SidebarLoadOptions | boolean = {}): Promise<void> {
  const opts: SidebarLoadOptions = typeof options === 'boolean' ? { force: options, reset: true } : (options || {});
  const force = !!opts.force;
  const append = !!opts.append;
  const reset = !!opts.reset;
  const automatic = !!opts.automatic;
  const source = opts.source || (automatic ? 'sidebar-auto' : 'sidebar-manual');
  if (!state.sidebar.open && !force) return;
  if (state.sidebar.loading) return;

  refreshSidebarFromLocalCache({ reset, append });
  if (!force && !opts.remote) return;
  if (shouldUseRecentSidebarRemoteLoad({ force, bypassRemoteTtl: !!opts.bypassRemoteTtl })) return;
  if (automatic && !canRunAutomaticFiberyCall('sidebar')) {
    logAutomaticFiberySkip('sidebar');
    return;
  }

  state.sidebar.loading = true;
  const previous = state.sidebar.pages;
  if (!previous.length && !append) {
    els.sidebarPagesList.innerHTML = `<div class="sidebar-label p-4 text-center text-sm text-gray-400">${escapeHtml(t('loading'))}</div>`;
    els.sidebarLoadMoreWrap.classList.add('hidden');
  }
  try {
    const apiLimit = state.sidebar.visibleLimit + 1;
    const rows = await API.loadPages({ skip: 0, limit: apiLimit, search: '', source, automatic });
    cachePagesForSidebar(rows);
    state.sidebar.lastRemoteLoadAt = Date.now();
    const projectIds = projectPageIds();
    const saved = savedLocalPages().filter(p => !projectIds.has(p.id));
    const savedIds = new Set(saved.map(x => x.id));
    const apiRows = normalizePageRows(rows);
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
    if (!state.sidebar.pages.length) {
      els.sidebarPagesList.innerHTML = `<div class="sidebar-label p-4 text-center text-sm text-red-500">${escapeHtml((err as Error).message || String(err))}</div>`;
      els.sidebarLoadMoreWrap.classList.add('hidden');
    }
    log((err as Error).message || String(err));
  } finally {
    state.sidebar.loading = false;
  }
}
