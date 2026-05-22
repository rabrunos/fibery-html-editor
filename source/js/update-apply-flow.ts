function updateApplyErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message || error || '');
  }
  return String(error || '');
}

function updateTargetAppPageId(): string {
  return String(state.appPageId || '').trim();
}

function canResolveAppPageForUpdate(): boolean {
  return !!updateTargetAppPageId();
}

function isCurrentAppPageForUpdate(): boolean {
  if (state.blank) return false;
  const targetPageId = updateTargetAppPageId();
  if (!state.current.id || !targetPageId) return false;
  return state.current.id === targetPageId;
}

const updateApplicabilityLogCache: Record<string, string> = {};

function updateApplicabilityState(): UpdateApplicabilityState {
  const localVersion = String(APP_VERSION || '').trim();
  const remoteVersion = String(state.update.remoteVersion || '').trim();
  const localParsed = parseSemverSimple(localVersion);
  const remoteParsed = parseSemverSimple(remoteVersion);
  const status = String(state.update.status || 'idle');
  const comparison = localParsed && remoteParsed ? compareSemverSimple(localParsed, remoteParsed) : null;
  const isRemoteNewer = comparison !== null && comparison < 0;
  const statusClaimsAvailable = status === 'available';
  const canShowApply = isRemoteNewer || statusClaimsAvailable;
  let disabledReasonKey = '';

  if (canShowApply) {
    if (state.update.checking) disabledReasonKey = 'updateApplyUnavailableWhileChecking';
    else if (state.update.applying) disabledReasonKey = 'updateApplying';
    else if (state.update.rollbacking) disabledReasonKey = 'updateRollbackRestoring';
    else if (!localParsed || !remoteParsed) disabledReasonKey = 'updateStatusInvalid';
    else if (!isRemoteNewer) disabledReasonKey = 'updateRemoteVersionNotNewer';
    else if (!state.isAdmin) disabledReasonKey = 'updateAdminRequired';
    else if (!canResolveAppPageForUpdate()) disabledReasonKey = 'updateAppPageUnavailable';
  }

  return {
    localVersion,
    remoteVersion,
    localParsed,
    remoteParsed,
    isRemoteNewer,
    canShowApply,
    canApplyNow: canShowApply && isRemoteNewer && !disabledReasonKey,
    disabledReasonKey,
    status
  };
}

function updateApplicabilityDiagnosticSummary(applicability: UpdateApplicabilityState = updateApplicabilityState()): string {
  return [
    `local=${applicability.localVersion || '-'}`,
    `remote=${applicability.remoteVersion || '-'}`,
    `localParsed=${applicability.localParsed?.raw || '-'}`,
    `remoteParsed=${applicability.remoteParsed?.raw || '-'}`,
    `status=${applicability.status || '-'}`,
    `isRemoteNewer=${String(applicability.isRemoteNewer)}`,
    `canShowApply=${String(applicability.canShowApply)}`,
    `canApplyNow=${String(applicability.canApplyNow)}`,
    `reason=${applicability.disabledReasonKey || '-'}`,
    `isAdmin=${String(!!state.isAdmin)}`,
    `appPageId=${updateTargetAppPageId() || '-'}`
  ].join(' ');
}

function logUpdateApplicabilityDiagnostic(context = 'state', applicability: UpdateApplicabilityState = updateApplicabilityState(), options: { force?: boolean } = {}): void {
  const summary = updateApplicabilityDiagnosticSummary(applicability);
  const key = String(context || 'state');
  if (!options.force && updateApplicabilityLogCache[key] === summary) return;
  updateApplicabilityLogCache[key] = summary;
  log(`[update] ${key}: ${summary}`);
}

function hasApplicableRemoteUpdate(): boolean {
  return updateApplicabilityState().isRemoteNewer;
}

function canShowApplyUpdateButton(): boolean {
  return updateApplicabilityState().canShowApply;
}

function canApplyUpdateNow(): boolean {
  return updateApplicabilityState().canApplyNow;
}

function normalizeUpdateTargetPage(pageId: string, page: Partial<FiberyPage> | null | undefined): FiberyPage {
  return {
    id: String(page?.id || pageId || ''),
    title: String(page?.title || ''),
    description: String(page?.description || ''),
    html: String(page?.html || '')
  };
}

async function preserveLocalDraftBeforeReloadIfNeeded(): Promise<void> {
  if (state.blank || !state.current.id || !state.dirty || !state.isAdmin) return;
  try {
    await saveCurrentDraftNow({ force: true });
    log(t('updateReloadDraftPreservedLog'));
  } catch (err) {
    log(`${t('updateReloadDraftPreservedLog')}: ${updateApplyErrorMessage(err)}`);
  }
}

async function confirmReloadAfterUpdate(): Promise<void> {
  await preserveLocalDraftBeforeReloadIfNeeded();
  const shouldReload = await confirmAction({
    title: t('updateReloadConfirmTitle'),
    message: t('updateReloadConfirmMessage'),
    okText: t('updateReloadConfirmButton'),
    showPreview: false
  });
  if (shouldReload) {
    window.location.reload();
    return;
  }
  setStatus(t('updateAppliedReloadLater'));
}

async function offerOpenAppPageFallback(reasonKey: string): Promise<void> {
  const targetPageId = updateTargetAppPageId();
  if (!targetPageId) return;
  if (!state.blank && state.current.id === targetPageId) return;
  const shouldOpen = await confirmAction({
    title: t('updateOpenAppPageFallbackTitle'),
    message: `${t(reasonKey)}\n\n${t('updateOpenAppPageFallbackPrompt')}`,
    okText: t('updateOpenAppPageFallbackButton'),
    showPreview: false
  });
  if (!shouldOpen) return;
  await runWithUnsavedPageTransitionGuard(async () => {
    await loadPage(targetPageId);
  });
}

async function applyRemoteUpdate(): Promise<void> {
  if (state.update.applying) return;
  const applicability = updateApplicabilityState();
  if (!applicability.canApplyNow) {
    const reasonKey = applicability.disabledReasonKey || 'updateRemoteVersionNotNewer';
    setStatus(t(reasonKey));
    logUpdateApplicabilityDiagnostic('apply-blocked', applicability, { force: true });
    return;
  }
  const targetPageId = updateTargetAppPageId();
  if (!targetPageId) { setStatus(t('updateAppPageUnavailable')); log(t('updateAppPageUnavailable')); return; }
  const applyingCurrentPage = !state.blank && String(state.current.id || '') === targetPageId;

  state.update.applying = true;
  const previousStatus: typeof state.update.status = state.update.status;
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
      message: `${t('updateApplyConfirmMessage')}\n\n${t('updateInstalledVersion')}: ${validation.localVersion}\n${t('updateAvailableVersion')}: ${validation.remoteVersion}\n${t('updateApplyTargetPageNotice')}`,
      okText: t('updateApplyConfirmButton'),
      showPreview: false
    });
    if (!ok) { setStatus(t('updateApplyCanceled')); return; }

    setStatus(t('updateBackupCreating'));
    let targetBeforeUpdate: FiberyPage;
    try {
      const loadedTarget = await API.loadPage(targetPageId, { source: 'update-apply-load-target' });
      targetBeforeUpdate = normalizeUpdateTargetPage(targetPageId, loadedTarget);
    } catch (targetLoadErr) {
      const targetLoadMsg = updateApplyErrorMessage(targetLoadErr);
      setStatus(t('updateApplyTargetLoadFailed'));
      log(`${t('updateApplyTargetLoadFailed')}: ${targetLoadMsg}`);
      await offerOpenAppPageFallback('updateOpenAppPageReasonLoadFailed');
      return;
    }

    let backupRecord: UpdateBackupRecord | null = null;
    try {
      backupRecord = await createUpdateBackupRecord({
        pageId: targetPageId,
        fromVersion: validation.localVersion,
        toVersion: validation.remoteVersion,
        title: targetBeforeUpdate.title,
        description: targetBeforeUpdate.description,
        html: targetBeforeUpdate.html
      });
    } catch (backupErr) {
      const backupMsg = updateApplyErrorMessage(backupErr);
      setStatus(t('updateBackupFailed'));
      log(`${t('updateBackupFailed')}: ${backupMsg}`);
      return;
    }
    log(`${t('updateBackupCreated')}: ${backupRecord.fromVersion} -> ${backupRecord.toVersion}`);
    await loadUpdateBackupList();

    setStatus(t('updateSaving'));
    let saved: FiberySaveResult;
    try {
      saved = await API.savePage({
        id: targetPageId,
        title: targetBeforeUpdate.title,
        description: targetBeforeUpdate.description,
        html: remoteHtml
      }, { source: 'update-apply' });
    } catch (saveErr) {
      const saveMsg = updateApplyErrorMessage(saveErr);
      setStatus(t('updateApplyFailed'));
      log(`${t('updateApplyFailed')}: ${saveMsg}`);
      await offerOpenAppPageFallback('updateOpenAppPageReasonSaveFailed');
      state.update.status = previousStatus;
      return;
    }

    const updatedTargetPage = normalizeUpdateTargetPage(targetPageId, {
      id: saved.id || saved.data?.id || targetPageId,
      title: saved.title || saved.data?.title || targetBeforeUpdate.title,
      description: saved.description || saved.data?.description || targetBeforeUpdate.description,
      html: saved.html || saved.data?.html || remoteHtml
    });
    const now = Date.now();
    await savePageContentCacheSafe(updatedTargetPage, {
      pageId: targetPageId,
      source: 'update-apply-target-save',
      cachedAt: now,
      verifiedAt: now
    });
    cachePagesForSidebar([updatedTargetPage]);
    await savePageMeta(targetPageId, {
      title: updatedTargetPage.title,
      description: updatedTargetPage.description,
      lastSavedAt: now
    });
    clearSearchCaches();

    if (applyingCurrentPage) {
      state.current = { ...updatedTargetPage };
      localStorage.setItem(LS.lastPageId, state.current.id);
      await savePageMeta(state.current.id, {
        title: state.current.title,
        description: state.current.description,
        lastOpenedAt: now,
        lastSavedAt: now
      });
      await saveHistory('update-app');
      setCurrentBaseline();
      markCurrentPageRemoteVerified({ openedFromCache: false, remoteStatus: 'verified' });
      renderCurrent();
      syncPreviewMode({ immediate: true, forceRealReload: true });
    } else {
      log(`${t('updateAppliedToAppPageLog')}: ${updatedTargetPage.id}`);
      setStatus(t('updateAppliedOtherPage'));
    }
    refreshSidebarFromLocalCache({ reset: true });

    state.update.remoteVersion = validation.remoteVersion;
    state.update.status = 'latest';
    if (applyingCurrentPage) setStatus(`${t('updateApplied')} ${t('updateAppliedReloadHint')}`);
    log(`${t('updateApplied')}: ${validation.localVersion} -> ${validation.remoteVersion}`);
    renderUpdateAppPanel();
    void checkRemoteUpdateInfo();
    await confirmReloadAfterUpdate();
  } catch (err) {
    const msg = updateApplyErrorMessage(err);
    setStatus(t('updateApplyFailed'));
    log(`${t('updateApplyFailed')}: ${msg}`);
    state.update.status = previousStatus;
  } finally {
    state.update.applying = false;
    if (state.update.status === 'applying') state.update.status = previousStatus;
    renderUpdateAppPanel();
  }
}
