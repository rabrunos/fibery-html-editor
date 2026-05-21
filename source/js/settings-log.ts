function openSettings(): void { els.settingsModal.classList.remove('hidden'); els.moreMenu.classList.add('hidden'); }
function closeSettings(): void { els.settingsModal.classList.add('hidden'); }
function toggleLog(): void {
  els.logPanel.classList.toggle('hidden');
  if (els.logMenuText) els.logMenuText.textContent = els.logPanel.classList.contains('hidden') ? t('showLog') : t('hideLog');
  renderApiUsageSummary();
}
function setAdminMode(isAdmin: boolean): void { state.isAdmin = isAdmin; els.newPageBtn.disabled = !isAdmin; if (els.welcomeNewPageBtn) els.welcomeNewPageBtn.disabled = !isAdmin; els.deleteBtn.disabled = !isAdmin || !state.current.id; if (!isAdmin) { setCodeReadOnly(true); els.titleInput.readOnly = true; els.descriptionInput.readOnly = true; setStatus(t('readOnly')); } syncSaveAvailabilityState(); syncCachedOpenCheckNowButtonLabel(); renderUpdateAppPanel(); }
function applyI18n(): void {
  state.lang = preferredLang();
  document.documentElement.lang = state.lang === 'pt-BR' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => { (el as HTMLElement).textContent = t((el as HTMLElement).dataset.i18n || ''); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { (el as HTMLElement).title = t((el as HTMLElement).dataset.i18nTitle || ''); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { (el as HTMLInputElement).placeholder = t((el as HTMLInputElement).dataset.i18nPlaceholder || ''); });
  els.globalSearchInput.placeholder = t('searchPages');
  els.welcomeSearchInput.placeholder = t('welcomeSearch');
  els.titleInput.placeholder = t('title');
  els.descriptionInput.placeholder = t('description');
  els.codeEditorFallback.placeholder = '<!-- ' + t('selectOrCreate') + ' -->';
  els.logMenuText.textContent = els.logPanel.classList.contains('hidden') ? t('showLog') : t('hideLog');
  if (!state.dirty && !state.current.id) setStatus(t('noPage'));
  renderSidebarProjects();
  renderSidebarPages();
  updateRecoveryReopenButton();
  if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
  syncSaveAvailabilityState();
  syncCachedOpenCheckNowButtonLabel();
  renderApiUsageSummary();
  renderUpdateAppPanel();
}
