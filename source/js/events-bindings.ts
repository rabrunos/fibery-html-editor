function bindEvents(): void {
  els.titleInput.addEventListener('input', () => { updateCurrentFromInputs(); markDirty(true); scheduleLocalPreviewRefresh(); });
  els.descriptionInput.addEventListener('input', () => { updateCurrentFromInputs(); markDirty(true); scheduleLocalPreviewRefresh(); });
  els.saveBtn.addEventListener('click', () => { void requestSavePage('save'); });
  els.refreshBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); refreshPreview(); });
  els.newPageBtn.addEventListener('click', () => { void runWithUnsavedPageTransitionGuard(async () => { await newPage(); }); });
  els.welcomeNewPageBtn.addEventListener('click', () => { void runWithUnsavedPageTransitionGuard(async () => { await newPage(); }); });
  els.searchPagesBtn.addEventListener('click', openSearchModal);
  els.historyBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); openHistoryModal(); });
  els.deleteBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); deleteCurrentPage(); });
  els.openViewMenuBtn.addEventListener('click', () => { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); if (state.current.id) { recordPreviewUsage({ source: 'open-view-menu', pageId: state.current.id }); window.open(viewUrl(state.current.id), '_blank'); } });
  els.moreBtn.addEventListener('click', (e: MouseEvent) => { e.stopPropagation(); closeContextMenus(); const opening = els.moreMenu.classList.contains('hidden'); els.moreMenu.classList.toggle('hidden', !opening); els.moreBtn.classList.toggle('menu-open', opening); });
  els.sidebarSettingsBtn.addEventListener('click', openSettings);
  els.quickBothBtn.addEventListener('click', () => setPanelMode('both'));
  els.quickEditorBtn.addEventListener('click', () => setPanelMode('editor'));
  els.quickPreviewBtn.addEventListener('click', () => setPanelMode('preview'));
  els.logToggleBtn.addEventListener('click', toggleLog);
  els.copyHtmlBtn.addEventListener('click', (e: MouseEvent) => copyText(getCodeValue(), e.currentTarget as HTMLElement, t('copiedCode')));
  els.editorPanelMenuBtn.addEventListener('click', openEditorPanelMenu);
  els.previewPanelMenuBtn.addEventListener('click', openPreviewPanelMenu);
  els.previewFocusBtn.addEventListener('click', enterPreviewFocus);
  els.previewFocusExitBtn.addEventListener('click', exitPreviewFocus);
  els.clearLogBtn.addEventListener('click', () => { els.logBox.innerHTML = ''; clearApiUsageStats(); });
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
  els.refreshSidebarBtn.addEventListener('click', () => loadSidebarPages({ force: true, reset: false, source: 'sidebar-manual' }));
  els.sidebarLoadMoreBtn.addEventListener('click', () => loadSidebarPages({ force: true, append: true, source: 'sidebar-load-more' }));
  els.newProjectBtn.addEventListener('click', () => openCreateProjectModal(''));
  els.sidebarProjectsList.addEventListener('click', async (e: MouseEvent) => {
    const target = e.target as Element | null;
    const pageMenu = target?.closest<HTMLElement>('.page-menu');
    if (pageMenu) { e.preventDefault(); e.stopPropagation(); openPageContextMenu(e, pageMenu.dataset.pageId || '', pageMenu.dataset.pageTitle || '', pageMenu.dataset.projectId || ''); return; }
    const projectMenu = target?.closest<HTMLElement>('.project-menu');
    if (projectMenu) { e.preventDefault(); e.stopPropagation(); openProjectContextMenu(e, projectMenu.dataset.projectId || '', projectMenu.dataset.projectName || ''); return; }
    const btn = target?.closest<HTMLElement>('.page-open');
    if (btn) {
      if (!state.blank && btn.dataset.id === state.current.id) return;
      await runWithUnsavedPageTransitionGuard(async () => {
        await loadPage(btn.dataset.id || '');
      });
      return;
    }
    const toggleRow = target?.closest<HTMLElement>('[data-project-toggle-row]');
    if (toggleRow) { e.preventDefault(); e.stopPropagation(); await toggleProject(toggleRow.dataset.projectId || ''); }
  });
  els.sidebarProjectsList.addEventListener('keydown', async (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as Element | null;
    if (target?.closest('button')) return;
    const toggleRow = target?.closest<HTMLElement>('[data-project-toggle-row]');
    if (!toggleRow) return;
    e.preventDefault();
    await toggleProject(toggleRow.dataset.projectId || '');
  });
  els.sidebarPagesList.addEventListener('click', async (e: MouseEvent) => { const target = e.target as Element | null; const menu = target?.closest<HTMLElement>('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId || '', menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = target?.closest<HTMLElement>('.page-open'); if (!btn) return; if (!state.blank && btn.dataset.id === state.current.id) return; await runWithUnsavedPageTransitionGuard(async () => { await loadPage(btn.dataset.id || ''); }); });
  els.globalSearchInput.addEventListener('input', () => { clearTimeout(state.search.debounce ?? undefined); state.search.query = els.globalSearchInput.value.trim(); state.search.debounce = window.setTimeout(loadSearchResults, 480); });
  els.globalSearchResults.addEventListener('click', async (e: MouseEvent) => { const target = e.target as Element | null; const previewLink = target?.closest('a[href*="/view"]'); if (previewLink) { const row = target?.closest('[data-page-row-id]') as HTMLElement | null; recordPreviewUsage({ source: 'search-global-link', pageId: row?.dataset.pageRowId || '' }); return; } const menu = target?.closest<HTMLElement>('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId || '', menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = target?.closest<HTMLElement>('.page-open'); if (!btn) return; if (!state.blank && btn.dataset.id === state.current.id) { closeSearchModal(); return; } await runWithUnsavedPageTransitionGuard(async () => { await loadPage(btn.dataset.id || ''); closeSearchModal(); }); });
  els.closeSearchBtn.addEventListener('click', closeSearchModal);
  els.searchModal.addEventListener('click', (e: MouseEvent) => { if (e.target === els.searchModal) closeSearchModal(); });
  els.welcomeSearchInput.addEventListener('focus', openWelcomeSearch);
  els.welcomeSearchInput.addEventListener('input', () => { clearTimeout(state.welcomeSearch.debounce ?? undefined); state.welcomeSearch.query = els.welcomeSearchInput.value.trim(); state.welcomeSearch.debounce = window.setTimeout(loadWelcomeSearchResults, 480); openWelcomeSearch(); });
  els.welcomeSearchResults.addEventListener('click', async (e: MouseEvent) => { const target = e.target as Element | null; const previewLink = target?.closest('a[href*="/view"]'); if (previewLink) { const row = target?.closest('[data-page-row-id]') as HTMLElement | null; recordPreviewUsage({ source: 'welcome-search-link', pageId: row?.dataset.pageRowId || '' }); return; } const menu = target?.closest<HTMLElement>('.page-menu'); if (menu) { openPageContextMenu(e, menu.dataset.pageId || '', menu.dataset.pageTitle || '', menu.dataset.projectId || ''); return; } const btn = target?.closest<HTMLElement>('.page-open'); if (!btn) return; if (!state.blank && btn.dataset.id === state.current.id) { closeWelcomeSearch(); return; } await runWithUnsavedPageTransitionGuard(async () => { await loadPage(btn.dataset.id || ''); closeWelcomeSearch(); }); });
  els.confirmOpenPreviewBtn.addEventListener('click', () => { const id = els.confirmOpenPreviewBtn.dataset.previewId || state.current.id; if (id) { recordPreviewUsage({ source: 'confirm-open-preview', pageId: id }); window.open(viewUrl(id), '_blank'); } });
  els.closeSettingsBtn.addEventListener('click', closeSettings);
  els.settingsModal.addEventListener('click', (e: MouseEvent) => { if (e.target === els.settingsModal) closeSettings(); });
  els.closeUpdateAppBtn.addEventListener('click', closeUpdateAppModal);
  els.updateCloseBtn.addEventListener('click', closeUpdateAppModal);
  els.updateVerifyAgainBtn.addEventListener('click', () => { void checkRemoteUpdateInfo(); });
  if (!els.updateApplyBtn) log('[update] updateApplyBtn missing during event binding; modal delegation remains active');
  if (els.updateBackupsBox) els.updateBackupsBox.addEventListener('click', (e: MouseEvent) => {
    const restoreBtn = (e.target as Element | null)?.closest<HTMLElement>('[data-update-backup-restore-key]');
    if (!restoreBtn) return;
    void restoreUpdateBackupByKey(restoreBtn.dataset.updateBackupRestoreKey || '');
  });
  els.updateToastLaterBtn.addEventListener('click', hideUpdateAvailableToast);
  els.updateToastOpenBtn.addEventListener('click', () => { hideUpdateAvailableToast(); openUpdateAppModal(); });
  if (els.settingsCheckUpdateBtn) els.settingsCheckUpdateBtn.addEventListener('click', () => { void checkRemoteUpdateInfo(); });
  if (els.settingsAboutVersionBtn) els.settingsAboutVersionBtn.addEventListener('click', () => { closeSettings(); openUpdateAppModal(); });
  if (els.settingsOpenUpdateBtn) els.settingsOpenUpdateBtn.addEventListener('click', () => { closeSettings(); openUpdateAppModal(); });
  if (els.updateCheckOnStartupToggle) els.updateCheckOnStartupToggle.addEventListener('change', () => { localStorage.setItem(LS.updateCheckOnStartup, els.updateCheckOnStartupToggle.checked ? '1' : '0'); });
  els.updateAppModal.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as Element | null;
    const applyBtn = target?.closest<HTMLElement>('#updateApplyBtn');
    if (applyBtn) { e.preventDefault(); e.stopPropagation(); void applyRemoteUpdate(); return; }
    if (e.target === els.updateAppModal) closeUpdateAppModal();
  });
  els.langSelect.addEventListener('change', () => { localStorage.setItem(LS.lang, els.langSelect.value); applyI18n(); if (state.blank) showBlankPage(); else renderCurrent(); });
  els.openLastToggle.addEventListener('change', () => localStorage.setItem(LS.openLast, els.openLastToggle.checked ? '1' : '0'));
  els.versionLimitSelect.addEventListener('change', async () => { localStorage.setItem(LS.versionLimit, els.versionLimitSelect.value); if (state.current.id) await enforceHistoryLimit(state.current.id); });
  els.pageContextMenu.addEventListener('click', async (e: MouseEvent) => {
    e.stopPropagation();
    const actionBtn = (e.target as Element | null)?.closest<HTMLElement>('[data-action]');
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const pageId = state.context.pageId;
    if (action === 'move-to-project') { openMoveProjectMenu(actionBtn); return; }
    closeContextMenus();
    if (action === 'rename-page') startInlineRenameTitle(pageId);
    if (action === 'open-preview' && pageId) { recordPreviewUsage({ source: 'page-context-open-preview', pageId }); window.open(viewUrl(pageId), '_blank'); }
    if (action === 'copy-page-link' && pageId) copyText(viewUrl(pageId), actionBtn, t('copiedPageLink'));
    if (action === 'pin-page') await togglePinPage(pageId);
    if (action === 'archive-page') await toggleArchivePage(pageId);
    if (action === 'remove-from-project' && state.context.projectId) await removePageFromProject(state.context.projectId, pageId);
    if (action === 'delete-page') await deletePageFromList(pageId, state.context.pageTitle || '');
  });
  els.moveProjectMenu.addEventListener('click', async (e: MouseEvent) => {
    e.stopPropagation();
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-project-action]');
    if (!btn) return;
    const action = btn.dataset.projectAction;
    const pageId = state.context.pageId;
    closeContextMenus();
    if (action === 'new-project') openCreateProjectModal(pageId);
    if (action === 'move') await movePageToProject(pageId, btn.dataset.projectId || '');
  });
  els.projectContextMenu.addEventListener('click', async (e: MouseEvent) => {
    e.stopPropagation();
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const projectId = state.context.projectId;
    closeContextMenus();
    if (action === 'add-current-to-project') await addCurrentPageToProject(projectId);
    if (action === 'rename-project') startInlineRenameProject(projectId);
    if (action === 'delete-project') await deleteProject(projectId, projectName(projectId));
  });
  els.editorPanelMenu.addEventListener('click', async (e: MouseEvent) => {
    e.stopPropagation();
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-panel-action]');
    if (!btn) return;
    const action = btn.dataset.panelAction;
    closeContextMenus();
    if (action === 'paste-replace') await pasteReplaceCode(btn);
    if (action === 'import-html') importHtmlFile(els.editorPanelMenuBtn || btn);
    if (action === 'select-all-code') selectAllCode(btn);
  });
  els.previewPanelMenu.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-panel-action]');
    if (!btn) return;
    const action = btn.dataset.panelAction;
    closeContextMenus();
    if (action === 'copy-preview-link') copyText(state.current.id ? viewUrl(state.current.id) : '', btn, t('copiedPreviewLink'));
    if (action === 'open-preview' && state.current.id) { recordPreviewUsage({ source: 'preview-panel-open-preview', pageId: state.current.id }); window.open(viewUrl(state.current.id), '_blank'); }
    if (action === 'refresh-preview') refreshPreview();
  });
  window.addEventListener('message', handleLocalPreviewMessage);
  els.createProjectNameInput.addEventListener('input', () => { els.confirmCreateProjectBtn.disabled = !els.createProjectNameInput.value.trim(); });
  els.createProjectNameInput.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter' && els.createProjectNameInput.value.trim()) createProject(); if (e.key === 'Escape') closeCreateProjectModal(); });
  els.confirmCreateProjectBtn.addEventListener('click', () => createProject());
  els.cancelCreateProjectBtn.addEventListener('click', closeCreateProjectModal);
  els.closeCreateProjectBtn.addEventListener('click', closeCreateProjectModal);
  els.createProjectModal.addEventListener('click', (e: MouseEvent) => { if (e.target === els.createProjectModal) closeCreateProjectModal(); });
  els.restoreDraftBtn.addEventListener('click', () => restoreDraftFromModal());
  els.keepCurrentVersionBtn.addEventListener('click', () => keepCurrentVersionFromDraft());
  els.discardDraftBtn.addEventListener('click', () => discardDraftFromModal());
  if (els.externalSyncDismissBtn) els.externalSyncDismissBtn.addEventListener('click', () => dismissExternalSyncNotice());
  if (els.externalSyncCheckNowBtn) els.externalSyncCheckNowBtn.addEventListener('click', () => { void handleExternalSyncCheckNowAction(); });
  els.closeDraftRecoveryBtn.addEventListener('click', () => keepCurrentVersionFromDraft());
  els.draftRecoveryModal.addEventListener('click', (e: MouseEvent) => { if (e.target === els.draftRecoveryModal) keepCurrentVersionFromDraft(); });
  els.reopenRecoveryBtn.addEventListener('click', () => openRecoveryFromButton());
  if (els.conflictCompareOpenBtn) els.conflictCompareOpenBtn.addEventListener('click', () => openConflictCompareModal());
  if (els.conflictKeepLocalBtn) els.conflictKeepLocalBtn.addEventListener('click', () => keepLocalEditsFromConflict());
  if (els.conflictLoadRemoteBtn) els.conflictLoadRemoteBtn.addEventListener('click', () => { void loadFiberyVersionFromConflict(); });
  document.addEventListener('click', (e: MouseEvent) => { if (!els.moreMenu.contains(e.target as Node | null) && !els.moreBtn.contains(e.target as Node | null)) { els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); } if (!els.welcomeSearchResults.contains(e.target as Node | null) && !els.welcomeSearchInput.contains(e.target as Node | null)) closeWelcomeSearch(); closeContextMenus(); });
  els.closeHistoryBtn.addEventListener('click', closeHistoryModal);
  els.historyModal.addEventListener('click', (e: MouseEvent) => { if (e.target === els.historyModal) closeHistoryModal(); });
  els.historyList.addEventListener('click', async (e: MouseEvent) => { const btn = (e.target as Element | null)?.closest<HTMLElement>('.restore-version'); if (!btn) return; await restoreVersion(btn.dataset.key || ''); });
  els.confirmCancelBtn.addEventListener('click', () => closeConfirm(false));
  els.confirmOkBtn.addEventListener('click', () => closeConfirm(true));
  els.confirmModal.addEventListener('click', (e: MouseEvent) => { if (e.target === els.confirmModal) closeConfirm(false); });
  els.unsavedTransitionSaveBtn.addEventListener('click', () => closeUnsavedTransitionModal('save-open'));
  els.unsavedTransitionKeepDraftBtn.addEventListener('click', () => closeUnsavedTransitionModal('keep-draft'));
  els.unsavedTransitionDiscardBtn.addEventListener('click', () => closeUnsavedTransitionModal('discard'));
  els.unsavedTransitionCancelBtn.addEventListener('click', () => closeUnsavedTransitionModal('cancel'));
  els.unsavedTransitionModal.addEventListener('click', (e: MouseEvent) => { if (e.target === els.unsavedTransitionModal) closeUnsavedTransitionModal('cancel'); });
  window.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Escape') { if (!els.unsavedTransitionModal.classList.contains('hidden')) { closeUnsavedTransitionModal('cancel'); return; } if (!els.draftRecoveryModal.classList.contains('hidden')) { keepCurrentVersionFromDraft(); return; } if (els.conflictCompareModal && !els.conflictCompareModal.classList.contains('hidden')) { return; } if (state.previewFocus) exitPreviewFocus(); els.moreMenu.classList.add('hidden'); els.moreBtn.classList.remove('menu-open'); closeSearchModal(); closeSettings(); closeUpdateAppModal(); closeWelcomeSearch(); closeContextMenus(); closeCreateProjectModal(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (state.isAdmin && !state.blank) { void requestSavePage('save'); } } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearchModal(); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      void flushDraftAutosaveNow();
      if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
      return;
    }
    if (state.sidebar.open) refreshSidebarFromLocalCache();
    if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
  });
  window.addEventListener('pagehide', () => {
    stopSidebarAutoRefresh();
    clearPreviewDebounce();
    revokeLocalPreviewObjectUrl();
    if (typeof stopExternalSyncPolling === 'function') stopExternalSyncPolling();
    // Synchronous localStorage write so F5/reload does not lose unsaved edits
    if (typeof writeEmergencyDraft === 'function') writeEmergencyDraft();
  });
  syncBeforeUnloadWarningState();
  renderApiUsageSummary();
  if (typeof syncExternalSyncPollingState === 'function') syncExternalSyncPollingState();
}
