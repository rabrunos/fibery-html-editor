function setUpdateVersionValueTone(): void {
  if (!els.updateInstalledVersionValue || !els.updateAvailableVersionValue) return;
  const neutral = ['text-gray-900'];
  const positive = ['text-green-700'];
  const alert = ['text-red-700'];
  const info = ['text-blue-700'];
  const all = [...neutral, ...positive, ...alert, ...info];
  els.updateInstalledVersionValue.classList.remove(...all);
  els.updateAvailableVersionValue.classList.remove(...all);
  els.updateInstalledVersionValue.classList.add('text-gray-900');
  els.updateAvailableVersionValue.classList.add('text-gray-900');

  if (state.update.status === 'latest') {
    els.updateInstalledVersionValue.classList.replace('text-gray-900', 'text-green-700');
    els.updateAvailableVersionValue.classList.replace('text-gray-900', 'text-green-700');
    return;
  }
  if (state.update.status === 'available') {
    els.updateInstalledVersionValue.classList.replace('text-gray-900', 'text-red-700');
    els.updateAvailableVersionValue.classList.replace('text-gray-900', 'text-green-700');
    return;
  }
  if (state.update.status === 'local-newer') {
    els.updateInstalledVersionValue.classList.replace('text-gray-900', 'text-blue-700');
    return;
  }
}

function updateVersionComparisonState(): UpdateVersionComparisonState {
  const localSemver = parseSemverSimple(APP_VERSION);
  const remoteSemver = parseSemverSimple(state.update.remoteVersion || '');
  if (localSemver && remoteSemver) {
    return { localSemver, remoteSemver, comparable: true, localVsRemote: compareSemverSimple(localSemver, remoteSemver) };
  }
  return { localSemver, remoteSemver, comparable: false, localVsRemote: null };
}

function renderUpdateAppPanel(): void {
  if (!els.updateInstalledVersionValue || !els.updateAvailableVersionValue || !els.updateCheckStatusText || !els.updateChangelogBox) return;
  els.updateInstalledVersionValue.textContent = APP_VERSION;
  els.updateAvailableVersionValue.textContent = state.update.remoteVersion || t('updateNotChecked');
  els.updateCheckStatusText.textContent = updateStatusMessage();
  setUpdateVersionValueTone();
  if (els.updateVerifyAgainBtn) {
    els.updateVerifyAgainBtn.disabled = !!state.update.checking || !!state.update.applying || !!state.update.rollbacking;
    els.updateVerifyAgainBtn.textContent = state.update.checking ? t('updateChecking') : t('updateCheckAgain');
  }
  if (els.updateApplyBtn) {
    const showApply = canShowApplyUpdateButton();
    els.updateApplyBtn.classList.toggle('hidden', !showApply);
    const disableReason = !showApply
      ? ''
      : state.update.checking
        ? t('updateApplyUnavailableWhileChecking')
        : state.update.applying
          ? t('updateApplying')
          : state.update.rollbacking
            ? t('updateRollbackRestoring')
          : !state.isAdmin
            ? t('updateAdminRequired')
            : !isCurrentAppPageForUpdate()
              ? t('updateAppPageRequired')
              : '';
    const disabled = !!disableReason || !canApplyUpdateNow();
    els.updateApplyBtn.disabled = disabled;
    els.updateApplyBtn.textContent = state.update.applying ? t('updateApplying') : t('updateApply');
    els.updateApplyBtn.title = disableReason || t('updateApply');
  }
  renderUpdateBackupList();
  const comparison = updateVersionComparisonState();
  if (state.update.changelogLoading) {
    renderUpdateChangelog(els.updateChangelogBox, t('updateChangelogLoading'), comparison);
  } else if (state.update.remoteChangelog) {
    renderUpdateChangelog(els.updateChangelogBox, state.update.remoteChangelog, comparison);
  } else {
    renderUpdateChangelog(els.updateChangelogBox, t('updateChangelogUnavailable'), comparison);
  }
}

function openUpdateAppModal(): void {
  if (!els.updateAppModal) return;
  els.updateAppModal.classList.remove('hidden');
  renderUpdateAppPanel();
  void loadUpdateBackupList();
  void checkRemoteUpdateInfo();
}

function closeUpdateAppModal(): void {
  if (!els.updateAppModal) return;
  els.updateAppModal.classList.add('hidden');
}
