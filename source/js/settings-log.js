function openSettings() { els.settingsModal.classList.remove('hidden'); els.moreMenu.classList.add('hidden'); }
function closeSettings() { els.settingsModal.classList.add('hidden'); }
function toggleLog() {
  els.logPanel.classList.toggle('hidden');
  if (els.logMenuText) els.logMenuText.textContent = els.logPanel.classList.contains('hidden') ? t('showLog') : t('hideLog');
}
function setAdminMode(isAdmin) { state.isAdmin = isAdmin; els.saveBtn.disabled = !isAdmin; els.newPageBtn.disabled = !isAdmin; if (els.welcomeNewPageBtn) els.welcomeNewPageBtn.disabled = !isAdmin; els.deleteBtn.disabled = !isAdmin || !state.current.id; if (!isAdmin) { setCodeReadOnly(true); els.titleInput.readOnly = true; els.descriptionInput.readOnly = true; setStatus(t('readOnly')); } renderUpdateAppPanel(); }
function applyI18n() {
  state.lang = preferredLang();
  document.documentElement.lang = state.lang === 'pt-BR' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
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
  renderUpdateAppPanel();
}
