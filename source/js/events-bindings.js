function bindEvents() {
  els.titleInput.addEventListener('input', () => { updateCurrentFromInputs(); markDirty(true); scheduleLocalPreviewRefresh(); });
  els.descriptionInput.addEventListener('input', () => { updateCurrentFromInputs(); markDirty(true); scheduleLocalPreviewRefresh(); });
  els.saveBtn.addEventListener('click', () => savePage('save'));
  els.updateAppBtn.addEventListener('click', openUpdateAppModal);
  els.refreshBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); refreshPreview(); });
  els.newPageBtn.addEventListener('click', () => { void runWithUnsavedPageTransitionGuard(async () => { await newPage(); }); });
  els.welcomeNewPageBtn.addEventListener('click', () => { void runWithUnsavedPageTransitionGuard(async () => { await newPage(); }); });
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
    await runWithUnsavedPageTransitionGuard(async () => {
      showBlankPage();
    });
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
    if (!state.blank && btn.dataset.id === state.current.id) return;
    await runWithUnsavedPageTransitionGuard(async () => {
      await loadPage(btn.dataset.id);
    });
  });
  els.sidebarPagesList.addEventListener('click', async (e) => { const menu = e.target.closest('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId, menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = e.target.closest('.page-open'); if (!btn) return; if (!state.blank && btn.dataset.id === state.current.id) return; await runWithUnsavedPageTransitionGuard(async () => { await loadPage(btn.dataset.id); }); });
  els.globalSearchInput.addEventListener('input', () => { clearTimeout(state.search.debounce); state.search.query = els.globalSearchInput.value.trim(); state.search.debounce = setTimeout(loadSearchResults, 280); });
  els.globalSearchResults.addEventListener('click', async (e) => { const menu = e.target.closest('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId, menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = e.target.closest('.page-open'); if (!btn) return; if (!state.blank && btn.dataset.id === state.current.id) { closeSearchModal(); return; } await runWithUnsavedPageTransitionGuard(async () => { await loadPage(btn.dataset.id); closeSearchModal(); }); });
  els.closeSearchBtn.addEventListener('click', closeSearchModal);
  els.searchModal.addEventListener('click', (e) => { if (e.target === els.searchModal) closeSearchModal(); });
  els.welcomeSearchInput.addEventListener('focus', openWelcomeSearch);
  els.welcomeSearchInput.addEventListener('input', () => { clearTimeout(state.welcomeSearch.debounce); state.welcomeSearch.query = els.welcomeSearchInput.value.trim(); state.welcomeSearch.debounce = setTimeout(loadWelcomeSearchResults, 260); openWelcomeSearch(); });
  els.welcomeSearchResults.addEventListener('click', async (e) => { const menu = e.target.closest('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId, menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = e.target.closest('.page-open'); if (!btn) return; if (!state.blank && btn.dataset.id === state.current.id) { closeWelcomeSearch(); return; } await runWithUnsavedPageTransitionGuard(async () => { await loadPage(btn.dataset.id); closeWelcomeSearch(); }); });
  els.confirmOpenPreviewBtn.addEventListener('click', () => { const id = els.confirmOpenPreviewBtn.dataset.previewId || state.current.id; if (id) window.open(viewUrl(id), '_blank'); });
  els.closeSettingsBtn.addEventListener('click', closeSettings);
  els.settingsModal.addEventListener('click', (e) => { if (e.target === els.settingsModal) closeSettings(); });
  els.closeUpdateAppBtn.addEventListener('click', closeUpdateAppModal);
  els.updateCloseBtn.addEventListener('click', closeUpdateAppModal);
  els.updateVerifyAgainBtn.addEventListener('click', () => { void checkRemoteUpdateInfo(); });
  els.updateApplyBtn.addEventListener('click', () => { void applyRemoteUpdate(); });
  els.updateBackupsBox.addEventListener('click', (e) => {
    const restoreBtn = e.target.closest('[data-update-backup-restore-key]');
    if (!restoreBtn) return;
    void restoreUpdateBackupByKey(restoreBtn.dataset.updateBackupRestoreKey || '');
  });
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
  document.addEventListener('click', (e) => { if (!els.moreMenu.contains(e.target) && !els.moreBtn.contains(e.target)) { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); } if (!els.welcomeSearchResults.contains(e.target) && !els.welcomeSearchInput.contains(e.target)) closeWelcomeSearch(); closeContextMenus(); });
  els.closeHistoryBtn.addEventListener('click', closeHistoryModal);
  els.historyModal.addEventListener('click', (e) => { if (e.target === els.historyModal) closeHistoryModal(); });
  els.historyList.addEventListener('click', async (e) => { const btn = e.target.closest('.restore-version'); if (!btn) return; await restoreVersion(btn.dataset.key, btn.dataset.source || 'manual'); });
  els.confirmCancelBtn.addEventListener('click', () => closeConfirm(false));
  els.confirmOkBtn.addEventListener('click', () => closeConfirm(true));
  els.confirmModal.addEventListener('click', (e) => { if (e.target === els.confirmModal) closeConfirm(false); });
  els.unsavedTransitionSaveBtn.addEventListener('click', () => closeUnsavedTransitionModal('save-open'));
  els.unsavedTransitionKeepDraftBtn.addEventListener('click', () => closeUnsavedTransitionModal('keep-draft'));
  els.unsavedTransitionDiscardBtn.addEventListener('click', () => closeUnsavedTransitionModal('discard'));
  els.unsavedTransitionCancelBtn.addEventListener('click', () => closeUnsavedTransitionModal('cancel'));
  els.unsavedTransitionModal.addEventListener('click', (e) => { if (e.target === els.unsavedTransitionModal) closeUnsavedTransitionModal('cancel'); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!els.unsavedTransitionModal.classList.contains('hidden')) { closeUnsavedTransitionModal('cancel'); return; } if (!els.draftRecoveryModal.classList.contains('hidden')) { keepCurrentVersionFromDraft(); return; } if (state.previewFocus) exitPreviewFocus(); els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); closeSearchModal(); closeSettings(); closeUpdateAppModal(); closeWelcomeSearch(); closeContextMenus(); closeCreateProjectModal(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (state.isAdmin && !state.blank) savePage('save'); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearchModal(); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      void flushDraftAutosaveNow();
      return;
    }
    if (state.sidebar.open) loadSidebarPages({ force: true, reset: false });
  });
  window.addEventListener('beforeunload', () => { stopSidebarAutoRefresh(); clearPreviewDebounce(); revokeLocalPreviewObjectUrl(); void flushDraftAutosaveNow(); });
}
