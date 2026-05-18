function positionFloatingMenu(menu, x, y) {
    menu.classList.remove('hidden');
    const rect = menu.getBoundingClientRect();
    const left = Math.min(Math.max(8, x), window.innerWidth - rect.width - 8);
    const top = Math.min(Math.max(8, y), window.innerHeight - rect.height - 8);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }
  function closeContextMenus() {
    els.pageContextMenu.classList.add('hidden');
    els.moveProjectMenu.classList.add('hidden');
    els.projectContextMenu.classList.add('hidden');
    els.editorPanelMenu.classList.add('hidden');
    els.previewPanelMenu.classList.add('hidden');
    document.querySelectorAll('.menu-open').forEach(btn => btn.classList.remove('menu-open'));
  }
  function shouldToggleFloatingMenu(menu, trigger) {
    const sameTriggerOpen = !!trigger?.classList?.contains('menu-open') && menu && !menu.classList.contains('hidden');
    closeContextMenus();
    if (sameTriggerOpen) return false;
    trigger?.classList?.add('menu-open');
    return true;
  }
  function projectName(projectId) { return (state.projects.rows || []).find(p => p.id === projectId)?.name || t('untitledProject'); }
  function openEditorPanelMenu(event) {
    event.preventDefault(); event.stopPropagation();
    if (!shouldToggleFloatingMenu(els.editorPanelMenu, event.currentTarget)) return;
    els.editorPanelMenu.innerHTML = `
      <button class="context-menu-item" data-panel-action="paste-replace">${escapeHtml(t('pasteReplace'))}</button>
      <button class="context-menu-item" data-panel-action="import-html">${escapeHtml(t('importHtml'))}</button>
      <button class="context-menu-item" data-panel-action="select-all-code">${escapeHtml(t('selectAllCode'))}</button>`;
    const rect = event.currentTarget.getBoundingClientRect();
    positionFloatingMenu(els.editorPanelMenu, rect.right - 208, rect.bottom + 6);
  }
  function openPreviewPanelMenu(event) {
    event.preventDefault(); event.stopPropagation();
    if (!shouldToggleFloatingMenu(els.previewPanelMenu, event.currentTarget)) return;
    els.previewPanelMenu.innerHTML = `
      <button class="context-menu-item" data-panel-action="copy-preview-link">${escapeHtml(t('copyPreviewLink'))}</button>
      <button class="context-menu-item" data-panel-action="open-preview">${escapeHtml(t('openPreview'))}</button>
      <button class="context-menu-item" data-panel-action="refresh-preview">${escapeHtml(t('refreshPreview'))}</button>`;
    const rect = event.currentTarget.getBoundingClientRect();
    positionFloatingMenu(els.previewPanelMenu, rect.right - 208, rect.bottom + 6);
  }
  function selectAllCode(target) {
    if (state.code.editor) {
      const model = state.code.editor.getModel();
      state.code.editor.focus();
      if (model && window.monaco) {
        const lastLine = model.getLineCount();
        const lastColumn = model.getLineMaxColumn(lastLine);
        state.code.editor.setSelection(new monaco.Range(1, 1, lastLine, lastColumn));
      }
    } else {
      els.codeEditorFallback.focus();
      els.codeEditorFallback.select();
    }
    showToastNear(target, t('codeSelected'));
  }
  async function pasteReplaceCode(target) {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch (_) {
      const fallback = window.prompt(t('pasteReplacePrompt'), '');
      if (fallback === null) return;
      text = fallback;
    }
    setCodeValue(text || '');
    updateCurrentFromInputs();
    markDirty(true);
    scheduleLocalPreviewRefresh();
    showToastNear(target, t('pastedReplaced'));
  }
  function importHtmlFile(target) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.htm,text/html';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCodeValue(String(reader.result || ''));
        updateCurrentFromInputs();
        markDirty(true);
        scheduleLocalPreviewRefresh();
        showToastNear(target || els.editorPanelMenuBtn, t('htmlImported'));
        log(`${t('htmlImported')}: ${file.name}`);
      };
      reader.onerror = () => {
        showToastNear(target || els.editorPanelMenuBtn, t('importHtmlError'));
        log(`${t('importHtmlError')}: ${file.name}`);
      };
      reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
  }
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
  function openProjectContextMenu(event, projectId, projectTitle = '') {
    event.preventDefault(); event.stopPropagation();
    if (!shouldToggleFloatingMenu(els.projectContextMenu, event.currentTarget)) return;
    state.context.projectId = projectId;
    els.projectContextMenu.innerHTML = `<button class="context-menu-item" data-action="add-current-to-project">${escapeHtml(t('addCurrentToProject'))}</button><div class="my-1 border-t border-gray-100"></div><button class="context-menu-item" data-action="rename-project">${escapeHtml(t('renameProject'))}</button><button class="context-menu-item context-menu-danger" data-action="delete-project">${escapeHtml(t('deleteProject'))}</button>`;
    positionFloatingMenu(els.projectContextMenu, event.clientX, event.clientY);
  }
  function startInlineRenameTitle(pageId) {
    closeContextMenus();
    const target = document.querySelector(`[data-page-title-id="${CSS.escape(pageId)}"]`);
    if (!target) return;
    const oldValue = target.textContent.trim();
    target.innerHTML = `<input class="inline-rename-input" value="${escapeHtml(oldValue)}" />`;
    const input = target.querySelector('input');
    let done = false;
    const commit = async () => { if (done) return; done = true; const value = input.value.trim(); if (!value || value === oldValue) { target.textContent = oldValue; return; } try { await renamePage(pageId, value); } catch (err) { alert(err.message || String(err)); target.textContent = oldValue; } };
    const cancel = () => { done = true; target.textContent = oldValue; };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } if (e.key === 'Escape') { e.preventDefault(); cancel(); } });
    input.addEventListener('blur', commit);
    input.focus(); input.select();
  }
  function startInlineRenameProject(projectId) {
    closeContextMenus();
    const target = document.querySelector(`[data-project-title-id="${CSS.escape(projectId)}"]`);
    if (!target) return;
    const oldValue = target.textContent.trim();
    target.innerHTML = `<input class="inline-rename-input" value="${escapeHtml(oldValue)}" />`;
    const input = target.querySelector('input');
    let done = false;
    const commit = async () => { if (done) return; done = true; const value = input.value.trim(); if (!value || value === oldValue) { target.textContent = oldValue; return; } try { await renameProject(projectId, value); } catch (err) { alert(err.message || String(err)); target.textContent = oldValue; } };
    const cancel = () => { done = true; target.textContent = oldValue; };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } if (e.key === 'Escape') { e.preventDefault(); cancel(); } });
    input.addEventListener('blur', commit);
    input.focus(); input.select();
  }
  async function openHistoryModal() {
    if (!state.current.id) return;
    try { await flushDraftAutosaveNow(); } catch (_) {}
    els.historyModal.classList.remove('hidden');
    renderHistory();
  }
  function closeHistoryModal() { els.historyModal.classList.add('hidden'); }
  function openDb() { return new Promise((resolve, reject) => { const req = indexedDB.open('FiberyHtmlEditorPro', 4); req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('versions')) { const store = db.createObjectStore('versions', { keyPath: 'key' }); store.createIndex('pageId', 'pageId', { unique: false }); store.createIndex('createdAt', 'createdAt', { unique: false }); } if (!db.objectStoreNames.contains('pageMeta')) { const meta = db.createObjectStore('pageMeta', { keyPath: 'id' }); meta.createIndex('lastSavedAt', 'lastSavedAt', { unique: false }); meta.createIndex('lastOpenedAt', 'lastOpenedAt', { unique: false }); } if (!db.objectStoreNames.contains('projects')) { const projects = db.createObjectStore('projects', { keyPath: 'id' }); projects.createIndex('sortOrder', 'sortOrder', { unique: false }); } if (!db.objectStoreNames.contains('projectItems')) { const items = db.createObjectStore('projectItems', { keyPath: 'key' }); items.createIndex('projectId', 'projectId', { unique: false }); items.createIndex('pageId', 'pageId', { unique: false }); } if (!db.objectStoreNames.contains('drafts')) { const drafts = db.createObjectStore('drafts', { keyPath: 'id' }); drafts.createIndex('pageId', 'pageId', { unique: false }); drafts.createIndex('unsavedId', 'unsavedId', { unique: false }); drafts.createIndex('updatedAt', 'updatedAt', { unique: false }); } }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  function txPut(storeName, value) { return new Promise((resolve, reject) => { const tx = state.db.transaction(storeName, 'readwrite'); tx.objectStore(storeName).put(value); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); }
  function txDelete(storeName, key) { return new Promise((resolve, reject) => { const tx = state.db.transaction(storeName, 'readwrite'); tx.objectStore(storeName).delete(key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); }
  function txGetAll(storeName) { return new Promise((resolve, reject) => { const tx = state.db.transaction(storeName, 'readonly'); const req = tx.objectStore(storeName).getAll(); req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error); }); }
  async function loadPageMetaCache() { if (!state.db) return; const map = {}; try { for (const row of await txGetAll('pageMeta')) { if (row?.id) map[row.id] = row; } } catch (_) {} try { const local = JSON.parse(localStorage.getItem(LS.pageMeta) || '{}') || {}; for (const [id, meta] of Object.entries(local)) { if (!map[id] && meta && typeof meta === 'object') { const record = { id, ...meta, id: meta.id || id }; map[id] = record; await txPut('pageMeta', record); } } } catch (_) {} setMetaMap(map); }
  async function loadProjectsCache() {
    if (!state.db) return;
    try {
      state.projects.rows = (await txGetAll('projects')).filter(project => project?.id);
      state.projects.items = (await txGetAll('projectItems')).filter(item => item?.projectId && item?.pageId);
      rebuildProjectMaps();
    } catch (err) { log(err.message || String(err)); }
  }
  async function saveHistory(action = 'save') {
    if (!state.current.id || !state.db) return;
    const now = Date.now();
    const record = {
      key: `manual:${state.current.id}:${now}:${Math.random().toString(36).slice(2, 8)}`,
      kind: 'manual',
      pageId: state.current.id,
      title: state.current.title,
      description: state.current.description,
      html: state.current.html,
      signature: snapshotSignature(state.current),
      action,
      createdAt: now
    };
    await txPut('versions', record);
    await enforceHistoryLimit(state.current.id);
  }
  function getHistory(pageId, kind = 'all') {
    return new Promise((resolve, reject) => {
      const tx = state.db.transaction('versions', 'readonly');
      const idx = tx.objectStore('versions').index('pageId');
      const req = idx.getAll(pageId);
      req.onsuccess = () => {
        const rows = (req.result || []).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        if (kind === 'manual') return resolve(rows.filter(row => (row.kind || 'manual') === 'manual'));
        if (kind === 'autosave') return resolve(rows.filter(row => row.kind === 'autosave'));
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });
  }
  function deleteVersion(key) { return new Promise((resolve, reject) => { const tx = state.db.transaction('versions', 'readwrite'); tx.objectStore('versions').delete(key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); }
  async function enforceHistoryLimit(pageId) {
    const limit = getManualHistoryLimit();
    if (!limit) return;
    const rows = await getHistory(pageId, 'manual');
    const excess = rows.slice(limit);
    for (const row of excess) await deleteVersion(row.key);
  }
  async function enforceAutosaveHistoryLimit(pageId) {
    const limit = getAutosaveLimit();
    if (!limit) return;
    const rows = await getHistory(pageId, 'autosave');
    const excess = rows.slice(limit);
    for (const row of excess) await deleteVersion(row.key);
  }
  async function clearAutosaveHistoryBySignature(pageId, signature) {
    if (!pageId || !signature) return;
    const rows = await getHistory(pageId, 'autosave');
    for (const row of rows) {
      if (String(row.signature || '') === String(signature)) await deleteVersion(row.key);
    }
  }
  function historyRowHtml(row, source = 'manual') {
    const d = new Date(row.createdAt || Date.now()).toLocaleString(state.lang === 'pt-BR' ? 'pt-BR' : 'en-US');
    const badge = source === 'autosave'
      ? `<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">${escapeHtml(t('autosave'))}</span>`
      : `<span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">${escapeHtml(t('save'))}</span>`;
    return `<div class="p-3 flex items-center gap-3 hover:bg-gray-50"><div class="min-w-0 flex-1"><div class="flex items-center gap-2 text-sm font-medium text-gray-900"><span>${escapeHtml(d)}</span>${badge}</div><div class="truncate text-xs text-gray-500">${escapeHtml(row.title || '')}</div></div><button class="restore-version h-8 px-3 rounded border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50" data-source="${escapeHtml(source)}" data-key="${escapeHtml(row.key)}">${escapeHtml(t('restore'))}</button></div>`;
  }
  async function renderHistory() {
    const manualRows = await getHistory(state.current.id, 'manual');
    const autosaveRows = await getHistory(state.current.id, 'autosave');
    if (!manualRows.length && !autosaveRows.length) {
      els.historyList.innerHTML = `<div class="p-6 text-sm text-gray-500">${escapeHtml(t('noHistory'))}</div>`;
      return;
    }
    const manualSection = `<div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">${escapeHtml(t('manualHistory'))}</div>${manualRows.length ? manualRows.map(row => historyRowHtml(row, 'manual')).join('') : `<div class="p-4 text-xs text-gray-400">${escapeHtml(t('noHistory'))}</div>`}`;
    const autosaveSection = `<div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-t border-gray-200">${escapeHtml(t('autosaves'))}</div>${autosaveRows.length ? autosaveRows.map(row => historyRowHtml(row, 'autosave')).join('') : `<div class="p-4 text-xs text-gray-400">${escapeHtml(t('noAutosaves'))}</div>`}`;
    els.historyList.innerHTML = `${manualSection}${autosaveSection}`;
  }
  async function restoreVersion(key, source = 'manual') {
    if (!key) return;
    const rows = await getHistory(state.current.id, source === 'autosave' ? 'autosave' : 'manual');
    const row = rows.find(x => x.key === key);
    if (!row) return;
    closeHistoryModal();
    openDraftRecoveryModal({
      key,
      pageId: state.current.id || '',
      currentSnapshot: currentSnapshotFromState(),
      draftRecord: row,
      mode: source === 'autosave' ? 'history-autosave' : 'history-manual',
      titleKey: 'compareBeforeRestore',
      subtitle: source === 'autosave' ? t('selectedAutosave') : t('selectedHistoryVersion'),
      rightTitleKey: source === 'autosave' ? 'selectedAutosave' : 'selectedHistoryVersion',
      leftTitleKey: 'currentEditorContent',
      restoreTextKey: 'restoreSelectedVersion',
      showDiscard: false
    });
  }
