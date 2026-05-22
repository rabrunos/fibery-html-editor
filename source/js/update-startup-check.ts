function maybeCheckUpdateOnStartup(): void {
  if (localStorage.getItem(LS.updateCheckOnStartup) === '0') return;
  void checkRemoteUpdateInfo({ automatic: true, source: 'update-startup' });
}

function syncUpdateAvailableToast(): void {
  if (!els.updateAvailableToast) return;
  const show = hasApplicableRemoteUpdate();
  els.updateAvailableToast.classList.toggle('hidden', !show);
  if (show && els.updateAvailableToastVersion) {
    els.updateAvailableToastVersion.textContent = state.update.remoteVersion || '';
  }
}

function hideUpdateAvailableToast(): void {
  if (els.updateAvailableToast) els.updateAvailableToast.classList.add('hidden');
}

function renderSettingsUpdateSection(): void {
  if (els.updateCheckOnStartupToggle) {
    els.updateCheckOnStartupToggle.checked = localStorage.getItem(LS.updateCheckOnStartup) !== '0';
  }
  if (els.settingsUpdateStatus) {
    els.settingsUpdateStatus.textContent = updateStatusMessage();
  }
  if (els.settingsOpenUpdateBtn) {
    els.settingsOpenUpdateBtn.classList.toggle('hidden', !hasApplicableRemoteUpdate());
  }
  if (els.settingsCheckUpdateBtn) {
    els.settingsCheckUpdateBtn.disabled = !!state.update.checking;
    els.settingsCheckUpdateBtn.textContent = state.update.checking ? t('updateChecking') : t('updateCheckAgain');
  }
}
