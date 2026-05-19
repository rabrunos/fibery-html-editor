function getRollbackDisabledReasonText() {
  if (state.update.checking) return t('updateRollbackBusyChecking');
  if (state.update.applying) return t('updateRollbackBusyApplying');
  if (state.update.rollbacking) return t('updateRollbackRestoring');
  if (!state.isAdmin) return t('updateRollbackAdminRequired');
  if (!isCurrentAppPageForUpdate()) return t('updateRollbackAppPageRequired');
  return '';
}

function validateUpdateBackupForRollback(record = {}) {
  if (!isSafeUpdateBackupRecord(record)) return { ok: false, reason: 'invalid-origin' };
  const expectedPageId = getUpdateBackupTargetPageId();
  if (!expectedPageId || String(record.pageId || '') !== expectedPageId) return { ok: false, reason: 'page-mismatch' };

  const source = String(record.html || '');
  if (!source.trim()) return { ok: false, reason: 'empty' };
  if (source.trim().length < 300) return { ok: false, reason: 'too-short' };
  if (!/<html[\s>]/i.test(source) && !/<!doctype html/i.test(source)) return { ok: false, reason: 'not-html' };
  if (!/fibery-html-editor/i.test(source)) return { ok: false, reason: 'not-editor' };

  const metaVersion = extractRemoteVersionFromHtml(source);
  if (!metaVersion) return { ok: false, reason: 'missing-meta-version' };
  const metaSemver = parseSemverSimple(metaVersion);
  if (!metaSemver) return { ok: false, reason: 'invalid-meta-version' };

  const appVersionLiteral = parseAppVersionFromHtmlSource(source);
  if (!appVersionLiteral) return { ok: false, reason: 'missing-app-version' };
  if (appVersionLiteral !== metaSemver.raw) return { ok: false, reason: 'version-mismatch' };

  if (!/window\.FIBERY_HTML_EDITOR_VERSION\s*=\s*APP_VERSION/.test(source)) return { ok: false, reason: 'missing-window-version-assign' };
  if (!/document\.documentElement\.dataset\.appVersion\s*=\s*APP_VERSION/.test(source)) return { ok: false, reason: 'missing-dataset-version-assign' };

  return { ok: true, backupVersion: metaSemver.raw, backupHtml: source };
}

function updateRollbackValidationReasonText() {
  return t('updateRollbackBackupInvalid');
}

function getInstalledAppVersionFromCurrentState() {
  const sources = [
    String(state.currentBaseline?.html || ''),
    String(state.current?.html || '')
  ];
  for (const source of sources) {
    if (!source.trim()) continue;
    const metaVersion = extractRemoteVersionFromHtml(source);
    const metaSemver = parseSemverSimple(metaVersion);
    if (metaSemver) return metaSemver.raw;
    const appVersion = parseAppVersionFromHtmlSource(source);
    const appSemver = parseSemverSimple(appVersion);
    if (appSemver) return appSemver.raw;
  }
  const runtimeSemver = parseSemverSimple(APP_VERSION);
  return runtimeSemver ? runtimeSemver.raw : APP_VERSION;
}

async function restoreUpdateBackupByKey(key = '') {
  const rollbackKey = String(key || '').trim();
  if (!rollbackKey) return;

  const disableReason = getRollbackDisabledReasonText();
  if (disableReason) {
    setStatus(disableReason);
    log(disableReason);
    return;
  }

  let record = null;
  try {
    record = await getUpdateBackupRecordByKey(rollbackKey);
  } catch (err) {
    setStatus(t('updateRollbackFailed'));
    log(`${t('updateRollbackFailed')}: ${String(err?.message || err || '')}`);
    return;
  }
  if (!record) {
    setStatus(t('updateRollbackBackupMissing'));
    log(t('updateRollbackBackupMissing'));
    await loadUpdateBackupList();
    return;
  }

  setStatus(t('updateRollbackValidating'));
  const validation = validateUpdateBackupForRollback(record);
  if (!validation.ok) {
    const reasonText = updateRollbackValidationReasonText(validation.reason);
    setStatus(reasonText);
    log(`${reasonText}: ${String(validation.reason || 'unknown')}`);
    return;
  }

  const installedVersion = getInstalledAppVersionFromCurrentState();
  const ok = await confirmAction({
    title: t('updateRollbackConfirmTitle'),
    message: `${t('updateRollbackConfirmMessage')}\n\n${t('updateInstalledVersion')}: ${installedVersion}\n${t('updateBackupOfVersion')}: ${validation.backupVersion}`,
    okText: t('updateRollbackConfirmButton'),
    showPreview: false
  });
  if (!ok) {
    setStatus(t('updateRollbackCanceled'));
    log(t('updateRollbackCanceled'));
    return;
  }

  state.update.rollbacking = true;
  renderUpdateAppPanel();
  try {
    updateCurrentFromInputs();

    setStatus(t('updateRollbackCreatingCurrentBackup'));
    const baselineSnapshot = currentBaselineSnapshot();
    try {
      await createUpdateBackupRecord({
        pageId: state.current.id,
        fromVersion: installedVersion,
        toVersion: validation.backupVersion,
        title: baselineSnapshot.title || state.current.title,
        description: baselineSnapshot.description || state.current.description,
        html: baselineSnapshot.html || state.current.html
      });
    } catch (backupErr) {
      const backupMessage = String(backupErr?.message || backupErr || '');
      setStatus(t('updateRollbackCurrentBackupFailed'));
      log(`${t('updateRollbackCurrentBackupFailed')}: ${backupMessage}`);
      return;
    }

    setStatus(t('updateRollbackRestoring'));
    const saved = await API.savePage({
      id: state.current.id,
      title: state.current.title,
      description: state.current.description,
      html: validation.backupHtml
    });

    state.current = {
      id: saved.id || saved.data?.id || state.current.id,
      title: saved.title || saved.data?.title || state.current.title,
      description: saved.description || saved.data?.description || state.current.description,
      html: saved.html || saved.data?.html || validation.backupHtml
    };

    localStorage.setItem(LS.lastPageId, state.current.id);
    const now = Date.now();
    await savePageMeta(state.current.id, {
      title: state.current.title,
      description: state.current.description,
      lastOpenedAt: now,
      lastSavedAt: now
    });
    await clearAutosaveHistoryBySignature(state.current.id, snapshotSignature(state.current));
    await saveHistory('update-rollback');
    setCurrentBaseline();
    renderCurrent();
    syncPreviewMode({ immediate: true, forceRealReload: true });
    if (state.sidebar.open) await loadSidebarPages({ force: true, reset: true });

    await loadUpdateBackupList();
    setStatus(`${t('updateRollbackRestored')} ${t('updateRollbackReloadHint')}`);
    log(`${t('updateRollbackRestored')}: ${installedVersion} -> ${validation.backupVersion}`);
    void checkRemoteUpdateInfo();
  } catch (err) {
    const message = String(err?.message || err || '');
    setStatus(t('updateRollbackFailed'));
    log(`${t('updateRollbackFailed')}: ${message}`);
  } finally {
    state.update.rollbacking = false;
    renderUpdateAppPanel();
  }
}
