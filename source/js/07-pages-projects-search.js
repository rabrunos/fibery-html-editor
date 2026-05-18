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
  function codeIconSvg(className = 'h-3.5 w-3.5') { return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m8 9-3 3 3 3m8-6 3 3-3 3M13 6l-2 12"/></svg>`; }
  function appPageBadge(pageId) {
    if (!state.appPageId || pageId !== state.appPageId) return '';
    return `<span class="ml-1 inline-flex h-5 w-5 shrink-0 self-center items-center justify-center rounded-md bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200" title="${escapeHtml(t('appPageMarker'))}">${codeIconSvg()}</span>`;
  }
  function projectPageIds() { return new Set((state.projects.items || []).map(item => item.pageId).filter(Boolean)); }
  function rebuildProjectMaps() {
    const pageToProject = {};
    const itemsByProject = {};
    for (const item of state.projects.items || []) {
      if (!item?.projectId || !item?.pageId) continue;
      pageToProject[item.pageId] = item.projectId;
      if (!itemsByProject[item.projectId]) itemsByProject[item.projectId] = [];
      itemsByProject[item.projectId].push(item);
    }
    for (const items of Object.values(itemsByProject)) items.sort((a, b) => { const ma = getMetaMap()[a.pageId] || {}; const mb = getMetaMap()[b.pageId] || {}; const pinDiff = Number(mb.pinnedAt || 0) - Number(ma.pinnedAt || 0); if (pinDiff) return pinDiff; return Number(a.sortOrder || 0) - Number(b.sortOrder || 0); });
    state.projects.pageToProject = pageToProject;
    state.projects.itemsByProject = itemsByProject;
  }
  function getPageSnapshot(pageId) {
    const cached = state.sidebar.pageCache?.[pageId];
    const meta = getMetaMap()[pageId];
    return { id: pageId, title: cached?.title || meta?.title || 'Untitled', description: cached?.description || meta?.description || '' };
  }
  function moreIconSvg(className = 'h-4 w-4') { return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13.5 17.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>`; }
  function archivedBadge(pageId) { return getMetaMap()[pageId]?.archivedAt ? `<span class="archived-badge ml-1">${escapeHtml(t('archive'))}</span>` : ''; }
  function pageMenuButton(pageId, title, projectId = '') { return `<button class="page-menu sidebar-more-btn sidebar-page-menu-btn mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700" data-page-id="${escapeHtml(pageId)}" data-page-title="${escapeHtml(title || 'Untitled')}" data-project-id="${escapeHtml(projectId || '')}" title="More">${moreIconSvg()}</button>`; }
  function projectMenuButton(projectId, projectName) { return `<button class="project-menu sidebar-more-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-700" data-project-id="${escapeHtml(projectId)}" data-project-name="${escapeHtml(projectName || t('untitledProject'))}" title="More">${moreIconSvg()}</button>`; }
  function projectPageItemHtml(item) {
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
  function renderSidebarProjects() {
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
  function openCreateProjectModal(targetPageId = '') {
    state.context.createProjectTargetPageId = targetPageId || '';
    els.createProjectNameInput.value = '';
    els.confirmCreateProjectBtn.disabled = true;
    els.createProjectModal.classList.remove('hidden');
    setTimeout(() => els.createProjectNameInput.focus(), 0);
    closeContextMenus();
  }
  function closeCreateProjectModal() {
    els.createProjectModal.classList.add('hidden');
    state.context.createProjectTargetPageId = '';
  }
  async function createProject(nameOverride = '') {
    const name = String(nameOverride || els.createProjectNameInput.value || '').trim();
    if (!name) return null;
    const now = Date.now();
    const project = { id: 'project-' + now + '-' + Math.random().toString(36).slice(2, 8), name, createdAt: now, updatedAt: now, sortOrder: now, collapsed: false };
    state.projects.rows.unshift(project);
    await txPut('projects', project);
    rebuildProjectMaps();
    renderSidebarProjects();
    setStatus(t('projectCreated'));
    const targetPageId = state.context.createProjectTargetPageId;
    closeCreateProjectModal();
    if (targetPageId) await movePageToProject(targetPageId, project.id);
    return project;
  }
  async function toggleProject(projectId) {
    const project = (state.projects.rows || []).find(p => p.id === projectId);
    if (!project) return;
    project.collapsed = !project.collapsed;
    project.updatedAt = Date.now();
    await txPut('projects', project);
    renderSidebarProjects();
  }
  async function addCurrentPageToProject(projectId) {
    if (!state.current.id || state.blank) { alert(t('currentPageRequired')); return; }
    const existingProjectId = state.projects.pageToProject[state.current.id];
    if (existingProjectId === projectId) { setStatus(t('pageAlreadyInProject')); return; }
    if (existingProjectId) {
      const oldKey = existingProjectId + ':' + state.current.id;
      state.projects.items = state.projects.items.filter(item => item.key !== oldKey);
      await txDelete('projectItems', oldKey);
    }
    const now = Date.now();
    const item = { key: projectId + ':' + state.current.id, projectId, pageId: state.current.id, addedAt: now, sortOrder: now };
    state.projects.items.push(item);
    await txPut('projectItems', item);
    rebuildProjectMaps();
    renderSidebarProjects();
    await loadSidebarPages({ force: true, reset: false });
    setStatus(t('addedToProject'));
  }
  async function removePageFromProject(projectId, pageId) {
    const key = projectId + ':' + pageId;
    state.projects.items = state.projects.items.filter(item => item.key !== key);
    await txDelete('projectItems', key);
    rebuildProjectMaps();
    renderSidebarProjects();
    await loadSidebarPages({ force: true, reset: false });
    setStatus(t('removedFromProject'));
  }
  async function movePageToProject(pageId, projectId) {
    if (!pageId || !projectId) return;
    const existingProjectId = state.projects.pageToProject[pageId];
    if (existingProjectId === projectId) { setStatus(t('pageAlreadyInProject')); return; }
    if (existingProjectId) {
      const oldKey = existingProjectId + ':' + pageId;
      state.projects.items = state.projects.items.filter(item => item.key !== oldKey);
      await txDelete('projectItems', oldKey);
    }
    const now = Date.now();
    const item = { key: projectId + ':' + pageId, projectId, pageId, addedAt: now, sortOrder: now };
    state.projects.items.push(item);
    await txPut('projectItems', item);
    rebuildProjectMaps();
    renderSidebarProjects();
    await loadSidebarPages({ force: true, reset: false });
    setStatus(t('pageMovedToProject'));
  }
  async function renameProject(projectId, nextName) {
    const name = String(nextName || '').trim();
    if (!name) { setStatus(t('renameEmptyIgnored')); return; }
    const project = (state.projects.rows || []).find(p => p.id === projectId);
    if (!project) return;
    project.name = name;
    project.updatedAt = Date.now();
    await txPut('projects', project);
    renderSidebarProjects();
    setStatus(t('projectRenamed'));
  }
  async function renamePage(pageId, nextTitle) {
    const title = String(nextTitle || '').trim();
    if (!title) { setStatus(t('renameEmptyIgnored')); return; }
    let page;
    let previousCurrentSnapshot = null;
    let previousBaselineSnapshot = null;
    if (state.current.id === pageId && !state.blank) {
      updateCurrentFromInputs();
      previousCurrentSnapshot = currentSnapshotFromState();
      previousBaselineSnapshot = currentBaselineSnapshot();
      page = {
        id: pageId,
        title,
        description: previousBaselineSnapshot.description,
        html: previousBaselineSnapshot.html
      };
    } else {
      page = await API.loadPage(pageId);
      page.title = title;
    }
    const saved = await API.savePage(page);
    const newTitle = saved.title || saved.data?.title || title;
    const desc = saved.description || saved.data?.description || page.description || '';
    const html = saved.html || saved.data?.html || page.html || '';
    if (state.current.id === pageId && !state.blank) {
      const hadUnsavedDescription = String(previousCurrentSnapshot?.description || '') !== String(previousBaselineSnapshot?.description || '');
      state.current.title = newTitle;
      if (!hadUnsavedDescription) state.current.description = desc;
      state.currentBaseline = { id: pageId, title: newTitle, description: desc, html };
      els.titleInput.value = newTitle;
      if (!hadUnsavedDescription) els.descriptionInput.value = desc;
      syncDirtyWithBaseline();
    }
    await savePageMeta(pageId, { title: newTitle, description: desc });
    state.sidebar.pageCache[pageId] = { ...(state.sidebar.pageCache[pageId] || {}), id: pageId, title: newTitle, description: desc };
    renderSidebarProjects();
    await loadSidebarPages({ force: true, reset: false });
    if (!els.searchModal.classList.contains('hidden')) await loadSearchResults();
    if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults();
    setStatus(t('pageRenamed'));
  }
  async function togglePinPage(pageId) {
    const meta = getMetaMap()[pageId] || { id: pageId };
    await savePageMeta(pageId, { pinnedAt: meta.pinnedAt ? 0 : Date.now() });
    await loadSidebarPages({ force: true, reset: false });
    renderSidebarProjects();
    setStatus(meta.pinnedAt ? t('unpinned') : t('pinned'));
  }
  async function toggleArchivePage(pageId) {
    const meta = getMetaMap()[pageId] || { id: pageId };
    await savePageMeta(pageId, { archivedAt: meta.archivedAt ? 0 : Date.now() });
    await loadSidebarPages({ force: true, reset: false });
    renderSidebarProjects();
    if (!els.searchModal.classList.contains('hidden')) await loadSearchResults();
    if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults();
    setStatus(meta.archivedAt ? t('unarchived') : t('archived'));
  }

  async function deleteProject(projectId, projectName) {
    const ok = await confirmAction({ title: t('deleteProjectTitle'), message: `${t('deleteProjectMessage')}

${projectName || ''}`, okText: t('deleteProject'), showPreview: false });
    if (!ok) return;
    const itemsToDelete = (state.projects.items || []).filter(item => item.projectId === projectId);
    state.projects.rows = state.projects.rows.filter(project => project.id !== projectId);
    state.projects.items = state.projects.items.filter(item => item.projectId !== projectId);
    await txDelete('projects', projectId);
    for (const item of itemsToDelete) await txDelete('projectItems', item.key);
    rebuildProjectMaps();
    renderSidebarProjects();
    await loadSidebarPages({ force: true, reset: false });
  }
  function pageItemHtml(page, compact = false) {
    const active = page.id === state.current.id && !state.blank;
    const description = String(page.description || '').trim();
    const descriptionHtml = (!compact && description) ? `<div class="page-description sidebar-page-description truncate text-[11px] ${active ? 'text-blue-600/70' : 'text-gray-500'}">${escapeHtml(description)}</div>` : '';
    return `<div class="group sidebar-page-row flex gap-1 rounded-lg ${active ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-100'}" data-page-row-id="${escapeHtml(page.id)}"><button class="page-open sidebar-page-open relative min-w-0 flex-1 rounded-lg py-1 pl-3 pr-1 text-left transition-colors ${active ? 'text-blue-800' : 'text-gray-800'}" data-id="${escapeHtml(page.id)}">${active ? '<span class="sidebar-active-indicator"></span>' : ''}<div class="sidebar-page-mainline min-w-0 gap-1"><div class="page-title min-w-0 flex-1 truncate text-sm font-medium" data-page-title-id="${escapeHtml(page.id)}">${escapeHtml(page.title || 'Untitled')}</div>${appPageBadge(page.id)}${archivedBadge(page.id)}</div>${descriptionHtml}</button>${pageMenuButton(page.id, page.title)}</div>`;
  }
  function renderSidebarPages() {
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
  function updateSidebarActiveState() {
    if (!state.sidebar.open) return;
    document.querySelectorAll('#sidebarPagesList [data-page-row-id], #sidebarProjectsList [data-page-row-id]').forEach(row => {
      const btn = row.querySelector('.page-open');
      if (!btn) return;
      const active = btn.dataset.id === state.current.id && !state.blank;

      row.className = `group sidebar-page-row flex gap-1 rounded-lg ${active ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-100'}`;
      btn.className = `page-open sidebar-page-open relative min-w-0 flex-1 rounded-lg py-1 pl-3 pr-1 text-left transition-colors ${active ? 'text-blue-800' : 'text-gray-800'}`;

      const indicator = btn.querySelector('.sidebar-active-indicator');
      if (active && !indicator) btn.insertAdjacentHTML('afterbegin', '<span class="sidebar-active-indicator"></span>');
      if (!active && indicator) indicator.remove();

      const desc = btn.querySelector('.page-description');
      if (desc) desc.className = `page-description sidebar-page-description truncate text-[11px] ${active ? 'text-blue-600/70' : 'text-gray-500'}`;
    });
  }
  function updateSidebarLoadMore() {
    if (!els.sidebarLoadMoreWrap) return;
    els.sidebarLoadMoreWrap.classList.toggle('hidden', !state.sidebar.open || !state.sidebar.hasMore);
  }

  function startSidebarAutoRefresh() { stopSidebarAutoRefresh(); if (!state.sidebar.open) return; state.sidebar.refreshTimer = window.setInterval(() => { if (state.sidebar.open && !document.hidden) loadSidebarPages({ force: true, reset: false }); }, 60000); }
  function stopSidebarAutoRefresh() { if (state.sidebar.refreshTimer) { window.clearInterval(state.sidebar.refreshTimer); state.sidebar.refreshTimer = null; } }
  function setSidebarOpen(open, persist = true) {
    state.sidebar.open = !!open;
    if (els.sidebarScroll) els.sidebarScroll.classList.remove('hidden');
    els.sidebar.style.width = state.sidebar.open ? '288px' : '56px';
    els.sidebar.classList.toggle('sidebar-collapsed', !state.sidebar.open);
    document.querySelectorAll('.sidebar-label').forEach(el => el.classList.toggle('hidden', !state.sidebar.open));
    els.sidebarCloseIcon.classList.toggle('hidden', !state.sidebar.open);
    els.sidebarOpenIcon.classList.toggle('hidden', state.sidebar.open);
    if (persist) localStorage.setItem(LS.sidebarOpen, state.sidebar.open ? '1' : '0');
    if (state.sidebar.open) { loadSidebarPages({ force: true, reset: !state.sidebar.pages.length }); startSidebarAutoRefresh(); } else { stopSidebarAutoRefresh(); }
  }

  function openSearchModal() { els.searchModal.classList.remove('hidden'); els.globalSearchInput.value = ''; state.search.query = ''; setTimeout(() => els.globalSearchInput.focus(), 0); loadSearchResults(); }
  function closeSearchModal() { els.searchModal.classList.add('hidden'); }
  async function loadSearchResults() { els.globalSearchResults.innerHTML = `<div class="p-8 text-center text-sm text-gray-400">${escapeHtml(t('loading'))}</div>`; try { const rows = normalizePageRows(await API.loadPages({ skip: 0, limit: state.search.query ? 20 : 8, search: state.search.query })); state.search.pages = rows; renderSearchResults(rows); } catch (err) { els.globalSearchResults.innerHTML = `<div class="p-8 text-center text-sm text-red-500">${escapeHtml(err.message || err)}</div>`; } }
  function searchRowHtml(page, compact = false) {
    const projectId = state.projects.pageToProject[page.id] || '';
    const active = page.id === state.current.id && !state.blank;
    const description = String(page.description || '').trim();
    const title = page.title || 'Untitled';
    const descriptionHtml = description ? `<div class="${compact ? 'truncate' : 'clamp-2'} text-xs leading-4 ${active ? 'text-blue-600/70' : 'text-gray-500'}">${escapeHtml(description)}</div>` : '';
    return `<div class="search-row group flex items-center gap-2 rounded-xl px-3 py-2 ${active ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-100'}" data-page-row-id="${escapeHtml(page.id)}"><button class="page-open min-w-0 flex-1 text-left" data-id="${escapeHtml(page.id)}" title="${escapeHtml(title)}"><div class="flex min-w-0 items-center gap-1"><div class="truncate text-sm font-medium ${active ? 'text-blue-800' : 'text-gray-900'}" data-page-title-id="${escapeHtml(page.id)}">${escapeHtml(title)}</div>${appPageBadge(page.id)}${archivedBadge(page.id)}</div>${descriptionHtml}</button><a class="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50" target="_blank" href="${viewUrl(page.id)}" title="${escapeHtml(t('openPreview'))}">${escapeHtml(t('view'))}</a><button class="page-menu shrink-0 flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900" data-id="${escapeHtml(page.id)}" data-page-id="${escapeHtml(page.id)}" data-page-title="${escapeHtml(title)}" data-project-id="${escapeHtml(projectId)}" title="More">${moreIconSvg('h-4 w-4')}</button></div>`;
  }
  function renderSearchResults(rows) { if (!rows.length) { els.globalSearchResults.innerHTML = `<div class="p-8 text-center text-sm text-gray-400">${escapeHtml(t('noPages'))}</div>`; return; } let html = ''; if (!state.search.query) html += `<div class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(t('recentPages'))}</div>`; for (const [label, pages] of groupedPages(rows)) { if (state.search.query) html += `<div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(label)}</div>`; for (const page of pages) html += searchRowHtml(page); } els.globalSearchResults.innerHTML = html; }

  function openWelcomeSearch() { els.welcomeSearchResults.classList.remove('hidden'); if (!els.welcomeSearchResults.innerHTML.trim()) loadWelcomeSearchResults(); }
  function closeWelcomeSearch() { els.welcomeSearchResults.classList.add('hidden'); }
  async function loadWelcomeSearchResults() { els.welcomeSearchResults.innerHTML = `<div class="p-4 text-center text-sm text-gray-400">${escapeHtml(t('loading'))}</div>`; try { const rows = normalizePageRows(await API.loadPages({ skip: 0, limit: state.welcomeSearch.query ? 20 : 8, search: state.welcomeSearch.query })); state.welcomeSearch.pages = rows; renderWelcomeSearchResults(rows); } catch (err) { els.welcomeSearchResults.innerHTML = `<div class="p-4 text-center text-sm text-red-500">${escapeHtml(err.message || err)}</div>`; } }
  function renderWelcomeSearchResults(rows) { if (!rows.length) { els.welcomeSearchResults.innerHTML = `<div class="p-4 text-center text-sm text-gray-400">${escapeHtml(t('noPages'))}</div>`; return; } let html = ''; if (!state.welcomeSearch.query) html += `<div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(t('recentPages'))}</div>`; for (const [label, pages] of groupedPages(rows)) { if (state.welcomeSearch.query) html += `<div class="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">${escapeHtml(label)}</div>`; for (const page of pages) html += searchRowHtml(page, true); } els.welcomeSearchResults.innerHTML = html; }
