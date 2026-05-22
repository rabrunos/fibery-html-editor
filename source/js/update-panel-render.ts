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

function updateVersionComparisonState(applicability: UpdateApplicabilityState = updateApplicabilityState()): UpdateVersionComparisonState {
  const localSemver = applicability.localParsed;
  const remoteSemver = applicability.remoteParsed;
  if (localSemver && remoteSemver) {
    return { localSemver, remoteSemver, comparable: true, localVsRemote: compareSemverSimple(localSemver, remoteSemver) };
  }
  return { localSemver, remoteSemver, comparable: false, localVsRemote: null };
}

const updatePanelRenderLogCache: Record<string, string> = {};

function logUpdatePanelRenderIssue(key: string, message: string): void {
  if (updatePanelRenderLogCache[key] === message) return;
  updatePanelRenderLogCache[key] = message;
  log(message);
}

function resolveUpdateApplyButton(): HTMLButtonElement | null {
  const direct = document.getElementById('updateApplyBtn') as HTMLButtonElement | null;
  if (direct) {
    els.updateApplyBtn = direct;
    return direct;
  }
  return els.updateApplyBtn || null;
}

function renderUpdateAppPanel(): void {
  const applicability = updateApplicabilityState();
  if (applicability.status === 'available' && !applicability.remoteVersion) {
    logUpdatePanelRenderIssue('available-without-version', `[update] status is available but remoteVersion is empty: ${updateApplicabilityDiagnosticSummary(applicability)}`);
  }
  if (applicability.status === 'latest' && applicability.isRemoteNewer) {
    logUpdatePanelRenderIssue('latest-with-newer-version', `[update] status is latest but remoteVersion is newer: ${updateApplicabilityDiagnosticSummary(applicability)}`);
  }

  const missingRefs = [
    ['updateInstalledVersionValue', els.updateInstalledVersionValue],
    ['updateAvailableVersionValue', els.updateAvailableVersionValue],
    ['updateCheckStatusText', els.updateCheckStatusText],
    ['updateChangelogBox', els.updateChangelogBox]
  ].filter(([, ref]) => !ref).map(([name]) => name);
  if (missingRefs.length > 0) {
    logUpdatePanelRenderIssue('missing-panel-refs', `[update] panel refs missing: ${missingRefs.join(', ')} (${updateApplicabilityDiagnosticSummary(applicability)})`);
  }

  if (els.updateInstalledVersionValue) els.updateInstalledVersionValue.textContent = applicability.localVersion || APP_VERSION;
  if (els.updateAvailableVersionValue) els.updateAvailableVersionValue.textContent = applicability.remoteVersion || t('updateNotChecked');
  if (els.updateCheckStatusText) els.updateCheckStatusText.textContent = updateStatusMessage();
  setUpdateVersionValueTone();
  if (els.updateVerifyAgainBtn) {
    els.updateVerifyAgainBtn.disabled = !!state.update.checking || !!state.update.applying || !!state.update.rollbacking;
    els.updateVerifyAgainBtn.textContent = state.update.checking ? t('updateChecking') : t('updateCheckAgain');
  }
  const updateApplyBtn = resolveUpdateApplyButton();
  if (updateApplyBtn) {
    updateApplyBtn.classList.toggle('hidden', !applicability.canShowApply);
    const disableReason = applicability.disabledReasonKey ? t(applicability.disabledReasonKey) : '';
    updateApplyBtn.disabled = !applicability.canApplyNow;
    updateApplyBtn.textContent = state.update.applying ? t('updateApplying') : t('updateApply');
    updateApplyBtn.title = disableReason || t('updateApply');
    updateApplyBtn.setAttribute('aria-disabled', updateApplyBtn.disabled ? 'true' : 'false');
    if (applicability.canShowApply && updateApplyBtn.classList.contains('hidden')) {
      logUpdatePanelRenderIssue('apply-hidden-mismatch', `[update] apply button still has hidden class despite applicable state: ${updateApplicabilityDiagnosticSummary(applicability)}`);
    }
  } else {
    logUpdatePanelRenderIssue('missing-apply-btn', `[update] updateApplyBtn missing from DOM: ${updateApplicabilityDiagnosticSummary(applicability)}`);
  }
  syncUpdateAvailableToast(applicability);
  renderSettingsUpdateSection(applicability);
  const comparison = updateVersionComparisonState(applicability);
  if (els.updateChangelogBox) {
    if (state.update.changelogLoading) {
      renderUpdateChangelog(els.updateChangelogBox, t('updateChangelogLoading'), comparison);
    } else if (state.update.remoteChangelog) {
      renderUpdateChangelog(els.updateChangelogBox, state.update.remoteChangelog, comparison);
    } else {
      renderUpdateChangelog(els.updateChangelogBox, t('updateChangelogUnavailable'), comparison);
    }
  }
}

function openUpdateAppModal(): void {
  if (!els.updateAppModal) return;
  els.updateAppModal.classList.remove('hidden');
  renderUpdateAppPanel();
  logUpdateApplicabilityDiagnostic('modal-open', updateApplicabilityState(), { force: true });
  void checkRemoteUpdateInfo();
}

function closeUpdateAppModal(): void {
  if (!els.updateAppModal) return;
  els.updateAppModal.classList.add('hidden');
}
