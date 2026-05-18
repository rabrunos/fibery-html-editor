function enterPreviewFocus() { if (!state.current.id) return; state.previewFocus = true; document.body.classList.add('preview-focus'); }
  function exitPreviewFocus() { state.previewFocus = false; document.body.classList.remove('preview-focus'); window.setTimeout(() => { try { state.code.editor?.layout(); } catch (_) {} }, 0); }

  function setAdminMode(isAdmin) { state.isAdmin = isAdmin; els.saveBtn.disabled = !isAdmin; els.newPageBtn.disabled = !isAdmin; if (els.welcomeNewPageBtn) els.welcomeNewPageBtn.disabled = !isAdmin; els.deleteBtn.disabled = !isAdmin || !state.current.id; if (!isAdmin) { setCodeReadOnly(true); els.titleInput.readOnly = true; els.descriptionInput.readOnly = true; setStatus(t('readOnly')); } renderUpdateAppPanel(); }
  function setupResize() { const saved = localStorage.getItem(LS.split); if (saved) setSplit(Number(saved)); let dragging = false; const move = (clientX) => { const rect = els.splitArea.getBoundingClientRect(); const pct = ((clientX - rect.left) / rect.width) * 100; setSplit(pct); }; const onPointerMove = (e) => { if (dragging) { e.preventDefault(); move(e.clientX); } }; const stop = () => { if (!dragging) return; dragging = false; document.body.classList.remove('select-none', 'split-dragging'); els.dragOverlay.classList.add('hidden'); els.previewFrame.classList.remove('pointer-events-none'); }; els.splitter.addEventListener('pointerdown', (e) => { dragging = true; e.preventDefault(); document.body.classList.add('select-none', 'split-dragging'); els.dragOverlay.classList.remove('hidden'); els.previewFrame.classList.add('pointer-events-none'); try { els.splitter.setPointerCapture(e.pointerId); } catch (_) {} move(e.clientX); }); window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop); els.dragOverlay.addEventListener('pointermove', onPointerMove); els.dragOverlay.addEventListener('pointerup', stop); els.splitter.addEventListener('dblclick', () => setSplit(50)); }
  function setSplit(pct) { const clamped = Math.max(25, Math.min(75, pct || 50)); els.splitArea.style.gridTemplateColumns = `minmax(320px, ${clamped}%) 6px minmax(320px, 1fr)`; localStorage.setItem(LS.split, String(clamped)); }

  function openSettings() { els.settingsModal.classList.remove('hidden'); els.moreMenu.classList.add('hidden'); }
  function closeSettings() { els.settingsModal.classList.add('hidden'); }
  function toggleLog() {
    els.logPanel.classList.toggle('hidden');
    if (els.logMenuText) els.logMenuText.textContent = els.logPanel.classList.contains('hidden') ? t('showLog') : t('hideLog');
  }

  function bindEvents() {
    els.titleInput.addEventListener('input', () => { updateCurrentFromInputs(); markDirty(true); scheduleLocalPreviewRefresh(); });
    els.descriptionInput.addEventListener('input', () => { updateCurrentFromInputs(); markDirty(true); scheduleLocalPreviewRefresh(); });
    els.saveBtn.addEventListener('click', () => savePage('save'));
    els.updateAppBtn.addEventListener('click', openUpdateAppModal);
    els.refreshBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); refreshPreview(); });
    els.newPageBtn.addEventListener('click', newPage);
    els.welcomeNewPageBtn.addEventListener('click', newPage);
    els.searchPagesBtn.addEventListener('click', openSearchModal);
    els.historyBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); openHistoryModal(); });
    els.deleteBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); deleteCurrentPage(); });
    els.openViewMenuBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); if (state.current.id) window.open(viewUrl(state.current.id), '_blank'); });
    els.moreBtn.addEventListener('click', (e) => { e.stopPropagation(); closeContextMenus(); const opening = els.moreMenu.classList.contains('hidden'); els.moreMenu.classList.toggle('hidden', !opening); els.moreBtn.classList.toggle('menu-open', opening); });
    els.sidebarSettingsBtn.addEventListener('click', openSettings);
    els.quickBothBtn.addEventListener('click', () => setPanelMode('both'));
    els.quickEditorBtn.addEventListener('click', () => setPanelMode('editor'));
    els.quickPreviewBtn.addEventListener('click', () => setPanelMode('preview'));
    els.logToggleBtn.addEventListener('click', toggleLog);
    els.copyHtmlBtn.addEventListener('click', (e) => copyText(getCodeValue(), e.currentTarget, t('copiedCode')));
    els.editorPanelMenuBtn.addEventListener('click', openEditorPanelMenu);
    els.previewPanelMenuBtn.addEventListener('click', openPreviewPanelMenu);
    els.previewFocusBtn.addEventListener('click', enterPreviewFocus);
    els.previewFocusExitBtn.addEventListener('click', exitPreviewFocus);
    els.clearLogBtn.addEventListener('click', () => { els.logBox.innerHTML = ''; });
    els.toggleSidebarBtn.addEventListener('click', () => setSidebarOpen(!state.sidebar.open));
    els.brandBtn.addEventListener('click', async () => {
      if (!state.sidebar.open) {
        setSidebarOpen(true);
        return;
      }
      try { await flushDraftAutosaveNow(); } catch (err) { log(err.message || String(err)); }
      showBlankPage();
    });
    els.refreshSidebarBtn.addEventListener('click', () => loadSidebarPages({ force: true, reset: false }));
    els.sidebarLoadMoreBtn.addEventListener('click', () => loadSidebarPages({ force: true, append: true }));
    els.newProjectBtn.addEventListener('click', () => openCreateProjectModal(''));
    els.sidebarProjectsList.addEventListener('click', async (e) => {
      const pageMenu = e.target.closest('.page-menu');
      if (pageMenu) { openPageContextMenu(e, pageMenu.dataset.pageId, pageMenu.dataset.pageTitle || '', pageMenu.dataset.projectId || ''); return; }
      const projectMenu = e.target.closest('.project-menu');
      if (projectMenu) { openProjectContextMenu(e, projectMenu.dataset.projectId, projectMenu.dataset.projectName || ''); return; }
      const toggle = e.target.closest('.project-toggle');
      if (toggle) { e.preventDefault(); e.stopPropagation(); await toggleProject(toggle.dataset.projectId); return; }
      const btn = e.target.closest('.page-open');
      if (!btn) return;
      await loadPage(btn.dataset.id);
    });
    els.sidebarPagesList.addEventListener('click', async (e) => { const menu = e.target.closest('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId, menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = e.target.closest('.page-open'); if (!btn) return; await loadPage(btn.dataset.id); });
    els.globalSearchInput.addEventListener('input', () => { clearTimeout(state.search.debounce); state.search.query = els.globalSearchInput.value.trim(); state.search.debounce = setTimeout(loadSearchResults, 280); });
    els.globalSearchResults.addEventListener('click', async (e) => { const menu = e.target.closest('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId, menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = e.target.closest('.page-open'); if (!btn) return; closeSearchModal(); await loadPage(btn.dataset.id); });
    els.closeSearchBtn.addEventListener('click', closeSearchModal);
    els.searchModal.addEventListener('click', (e) => { if (e.target === els.searchModal) closeSearchModal(); });
    els.welcomeSearchInput.addEventListener('focus', openWelcomeSearch);
    els.welcomeSearchInput.addEventListener('input', () => { clearTimeout(state.welcomeSearch.debounce); state.welcomeSearch.query = els.welcomeSearchInput.value.trim(); state.welcomeSearch.debounce = setTimeout(loadWelcomeSearchResults, 260); openWelcomeSearch(); });
    els.welcomeSearchResults.addEventListener('click', async (e) => { const menu = e.target.closest('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId, menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = e.target.closest('.page-open'); if (!btn) return; closeWelcomeSearch(); await loadPage(btn.dataset.id); });
    els.confirmOpenPreviewBtn.addEventListener('click', () => { const id = els.confirmOpenPreviewBtn.dataset.previewId || state.current.id; if (id) window.open(viewUrl(id), '_blank'); });
    els.closeSettingsBtn.addEventListener('click', closeSettings);
    els.settingsModal.addEventListener('click', (e) => { if (e.target === els.settingsModal) closeSettings(); });
    els.closeUpdateAppBtn.addEventListener('click', closeUpdateAppModal);
    els.updateCloseBtn.addEventListener('click', closeUpdateAppModal);
    els.updateVerifyAgainBtn.addEventListener('click', () => { void checkRemoteUpdateInfo(); });
    els.updateApplyBtn.addEventListener('click', () => { void applyRemoteUpdate(); });
    els.updateAppModal.addEventListener('click', (e) => { if (e.target === els.updateAppModal) closeUpdateAppModal(); });
    els.langSelect.addEventListener('change', () => { localStorage.setItem(LS.lang, els.langSelect.value); applyI18n(); if (state.blank) showBlankPage(); else renderCurrent(); });
    els.openLastToggle.addEventListener('change', () => localStorage.setItem(LS.openLast, els.openLastToggle.checked ? '1' : '0'));
    els.versionLimitSelect.addEventListener('change', async () => { localStorage.setItem(LS.versionLimit, els.versionLimitSelect.value); if (state.current.id) await enforceHistoryLimit(state.current.id); });
    els.autosaveLimitSelect.addEventListener('change', async () => { localStorage.setItem(LS.autosaveLimit, els.autosaveLimitSelect.value); if (state.current.id) await enforceAutosaveHistoryLimit(state.current.id); });
    els.pageContextMenu.addEventListener('click', async (e) => {
      e.stopPropagation();
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;
      const action = actionBtn.dataset.action;
      const pageId = state.context.pageId;
      if (action === 'move-to-project') { openMoveProjectMenu(actionBtn); return; }
      closeContextMenus();
      if (action === 'rename-page') startInlineRenameTitle(pageId);
      if (action === 'open-preview' && pageId) window.open(viewUrl(pageId), '_blank');
      if (action === 'copy-page-link' && pageId) copyText(viewUrl(pageId), actionBtn, t('copiedPageLink'));
      if (action === 'pin-page') await togglePinPage(pageId);
      if (action === 'archive-page') await toggleArchivePage(pageId);
      if (action === 'remove-from-project' && state.context.projectId) await removePageFromProject(state.context.projectId, pageId);
      if (action === 'delete-page') await deletePageFromList(pageId, state.context.pageTitle || '');
    });
    els.moveProjectMenu.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target.closest('[data-project-action]');
      if (!btn) return;
      const action = btn.dataset.projectAction;
      const pageId = state.context.pageId;
      closeContextMenus();
      if (action === 'new-project') openCreateProjectModal(pageId);
      if (action === 'move') await movePageToProject(pageId, btn.dataset.projectId);
    });
    els.projectContextMenu.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const projectId = state.context.projectId;
      closeContextMenus();
      if (action === 'add-current-to-project') await addCurrentPageToProject(projectId);
      if (action === 'rename-project') startInlineRenameProject(projectId);
      if (action === 'delete-project') await deleteProject(projectId, projectName(projectId));
    });
    els.editorPanelMenu.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target.closest('[data-panel-action]');
      if (!btn) return;
      const action = btn.dataset.panelAction;
      closeContextMenus();
      if (action === 'paste-replace') await pasteReplaceCode(btn);
      if (action === 'import-html') importHtmlFile(els.editorPanelMenuBtn || btn);
      if (action === 'select-all-code') selectAllCode(btn);
    });
    els.previewPanelMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest('[data-panel-action]');
      if (!btn) return;
      const action = btn.dataset.panelAction;
      closeContextMenus();
      if (action === 'copy-preview-link') copyText(state.current.id ? viewUrl(state.current.id) : '', btn, t('copiedPreviewLink'));
      if (action === 'open-preview' && state.current.id) window.open(viewUrl(state.current.id), '_blank');
      if (action === 'refresh-preview') refreshPreview();
    });
    window.addEventListener('message', handleLocalPreviewMessage);
    els.createProjectNameInput.addEventListener('input', () => { els.confirmCreateProjectBtn.disabled = !els.createProjectNameInput.value.trim(); });
    els.createProjectNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && els.createProjectNameInput.value.trim()) createProject(); if (e.key === 'Escape') closeCreateProjectModal(); });
    els.confirmCreateProjectBtn.addEventListener('click', () => createProject());
    els.cancelCreateProjectBtn.addEventListener('click', closeCreateProjectModal);
    els.closeCreateProjectBtn.addEventListener('click', closeCreateProjectModal);
    els.createProjectModal.addEventListener('click', (e) => { if (e.target === els.createProjectModal) closeCreateProjectModal(); });
    els.restoreDraftBtn.addEventListener('click', () => restoreDraftFromModal());
    els.keepCurrentVersionBtn.addEventListener('click', () => keepCurrentVersionFromDraft());
    els.discardDraftBtn.addEventListener('click', () => discardDraftFromModal());
    els.closeDraftRecoveryBtn.addEventListener('click', () => keepCurrentVersionFromDraft());
    els.draftRecoveryModal.addEventListener('click', (e) => { if (e.target === els.draftRecoveryModal) keepCurrentVersionFromDraft(); });
    els.reopenRecoveryBtn.addEventListener('click', () => openRecoveryFromButton());
    document.addEventListener('click', (e) => { if (!els.moreMenu.contains(e.target) && !els.moreBtn.contains(e.target)) { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); } if (!els.welcomeSearchResults.contains(e.target) && !els.welcomeSearchInput.contains(e.target)) closeWelcomeSearch();  closeContextMenus(); });
    els.closeHistoryBtn.addEventListener('click', closeHistoryModal);
    els.historyModal.addEventListener('click', (e) => { if (e.target === els.historyModal) closeHistoryModal(); });
    els.historyList.addEventListener('click', async (e) => { const btn = e.target.closest('.restore-version'); if (!btn) return; await restoreVersion(btn.dataset.key, btn.dataset.source || 'manual'); });
    els.confirmCancelBtn.addEventListener('click', () => closeConfirm(false));
    els.confirmOkBtn.addEventListener('click', () => closeConfirm(true));
    els.confirmModal.addEventListener('click', (e) => { if (e.target === els.confirmModal) closeConfirm(false); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!els.draftRecoveryModal.classList.contains('hidden')) { keepCurrentVersionFromDraft(); return; } if (state.previewFocus) exitPreviewFocus(); els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); closeSearchModal(); closeSettings(); closeUpdateAppModal(); closeWelcomeSearch(); closeContextMenus(); closeCreateProjectModal(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (state.isAdmin && !state.blank) savePage('save'); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearchModal(); } });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        void flushDraftAutosaveNow();
        return;
      }
      if (state.sidebar.open) loadSidebarPages({ force: true, reset: false });
    });
    window.addEventListener('beforeunload', () => { stopSidebarAutoRefresh(); clearPreviewDebounce(); revokeLocalPreviewObjectUrl(); void flushDraftAutosaveNow(); });
  }

  async function init() {
    els.langSelect.value = localStorage.getItem(LS.lang) || 'auto';
    els.openLastToggle.checked = (localStorage.getItem(LS.openLast) ?? '1') === '1';
    els.versionLimitSelect.value = localStorage.getItem(LS.versionLimit) || '20';
    els.autosaveLimitSelect.value = localStorage.getItem(LS.autosaveLimit) || '10';
    state.panelMode = localStorage.getItem(LS.panelMode) || 'both';
    applyI18n();
    await setupCodeEditor();
    bindEvents();
    setupResize();
    setPanelMode(state.panelMode, false);
    state.db = await openDb();
    await loadPageMetaCache();
    await loadProjectsCache();
    await loadDraftsCache();
    try { setAdminMode(await API.checkIsAdmin()); } catch (_) { setAdminMode(false); }
    setSidebarOpen((localStorage.getItem(LS.sidebarOpen) ?? '1') === '1', false);
    const lastId = localStorage.getItem(LS.lastPageId);
    if (els.openLastToggle.checked && lastId) {
      try { await loadPage(lastId); } catch (err) { log(err.message || String(err)); showBlankPage(); void maybePromptUnsavedDraftRecovery(state.drafts.promptToken); }
    } else {
      showBlankPage();
      void maybePromptUnsavedDraftRecovery(state.drafts.promptToken);
    }
  }

  init().catch(err => { console.error(err); alert(err.message || String(err)); });
