function isCurrentAppPageForUpdate() {
  if (state.blank) return false;
  if (!state.current.id || !state.appPageId) return false;
  return state.current.id === state.appPageId;
}
function canShowApplyUpdateButton() {
  return state.update.status === 'available';
}
function canApplyUpdateNow() {
  return canShowApplyUpdateButton() && !state.update.checking && !state.update.applying && !state.update.rollbacking && state.isAdmin && isCurrentAppPageForUpdate();
}
async function applyRemoteUpdate() {
  if (state.update.applying) return;
  if (state.update.rollbacking) { setStatus(t('updateRollbackRestoring')); return; }
  if (state.update.checking) { setStatus(t('updateApplyUnavailableWhileChecking')); return; }
  if (!state.isAdmin) { setStatus(t('updateAdminRequired')); log(t('updateAdminRequired')); return; }
  if (!isCurrentAppPageForUpdate()) { setStatus(t('updateAppPageRequired')); log(t('updateAppPageRequired')); return; }
  if (state.update.status !== 'available') { setStatus(t('updateRemoteVersionNotNewer')); return; }

  state.update.applying = true;
  const previousStatus = state.update.status;
  state.update.status = 'applying';
  renderUpdateAppPanel();

  try {
    setStatus(t('updateDownloading'));
    const remoteHtml = await fetchRemoteText(UPDATE_REMOTE.indexHtmlUrl, { operation: 'updateDownload', source: 'update-apply' });
    setStatus(t('updateValidating'));
    const validation = validateRemoteUpdateHtml(remoteHtml);
    if (!validation.ok) {
      const reasonText = updateValidationReasonText(validation.reason);
      log(`${reasonText}: ${String(validation.reason || 'unknown')}`);
      setStatus(reasonText);
      return;
    }

    const ok = await confirmAction({
      title: t('updateApplyConfirmTitle'),
      message: `${t('updateApplyConfirmMessage')}\n\n${t('updateInstalledVersion')}: ${validation.localVersion}\n${t('updateAvailableVersion')}: ${validation.remoteVersion}`,
      okText: t('updateApplyConfirmButton'),
      showPreview: false
    });
    if (!ok) { setStatus(t('updateApplyCanceled')); return; }

    updateCurrentFromInputs();
    setStatus(t('updateBackupCreating'));
    let backupRecord = null;
    try {
      backupRecord = await createUpdateBackupRecord({
        pageId: state.current.id,
        fromVersion: validation.localVersion,
        toVersion: validation.remoteVersion,
        title: state.current.title,
        description: state.current.description,
        html: state.current.html
      });
    } catch (backupErr) {
      const backupMsg = String(backupErr?.message || backupErr || '');
      setStatus(t('updateBackupFailed'));
      log(`${t('updateBackupFailed')}: ${backupMsg}`);
      return;
    }
    log(`${t('updateBackupCreated')}: ${backupRecord.fromVersion} -> ${backupRecord.toVersion}`);
    await loadUpdateBackupList();

    setStatus(t('updateSaving'));
    const saved = await API.savePage({
      id: state.current.id,
      title: state.current.title,
      description: state.current.description,
      html: remoteHtml
    }, { source: 'update-apply' });

    state.current = {
      id: saved.id || saved.data?.id || state.current.id,
      title: saved.title || saved.data?.title || state.current.title,
      description: saved.description || saved.data?.description || state.current.description,
      html: saved.html || saved.data?.html || remoteHtml
    };
    cachePagesForSidebar([state.current]);
    clearSearchCaches();
    localStorage.setItem(LS.lastPageId, state.current.id);
    const now = Date.now();
    await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: now, lastSavedAt: now });
    await clearAutosaveHistoryBySignature(state.current.id, snapshotSignature(state.current));
    await saveHistory('update-app');
    setCurrentBaseline();
    renderCurrent();
    syncPreviewMode({ immediate: true, forceRealReload: true });
    refreshSidebarFromLocalCache({ reset: true });

    state.update.remoteVersion = validation.remoteVersion;
    state.update.status = 'latest';
    setStatus(`${t('updateApplied')} ${t('updateAppliedReloadHint')}`);
    log(`${t('updateApplied')}: ${validation.localVersion} -> ${validation.remoteVersion}`);
    renderUpdateAppPanel();
    void checkRemoteUpdateInfo();
  } catch (err) {
    const msg = String(err?.message || err || '');
    setStatus(t('updateApplyFailed'));
    log(`${t('updateApplyFailed')}: ${msg}`);
    state.update.status = previousStatus;
  } finally {
    state.update.applying = false;
    if (state.update.status === 'applying') state.update.status = previousStatus;
    renderUpdateAppPanel();
  }
}
