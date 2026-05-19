function extractRemoteVersionFromHtml(html = '') {
  const source = String(html || '');
  const match = source.match(/<meta\b[^>]*name=["']fibery-html-editor-version["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || source.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']fibery-html-editor-version["'][^>]*>/i);
  return String(match?.[1] || '').trim();
}
async function fetchRemoteText(url, options = {}) {
  return withApiUsage({ kind: 'github-remote', operation: options.operation || 'fetchRemoteText', source: options.source || 'update-app', automatic: !!options.automatic }, async () => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  });
}
function updateStatusMessage() {
  if (state.update.rollbacking) return t('updateRollbackRestoring');
  if (state.update.status === 'checking') return t('updateChecking');
  if (state.update.status === 'applying') return t('updateApplying');
  if (state.update.status === 'latest') return t('updateStatusLatest');
  if (state.update.status === 'available') return t('updateStatusAvailable');
  if (state.update.status === 'local-newer') return t('updateStatusLocalNewer');
  if (state.update.status === 'invalid') return t('updateStatusInvalid');
  if (state.update.status === 'error') return t('updateStatusError');
  return t('updateNotChecked');
}
async function checkRemoteUpdateInfo() {
  if (state.update.checking || state.update.applying || state.update.rollbacking) return;
  state.update.checking = true;
  state.update.status = 'checking';
  state.update.remoteVersion = '';
  state.update.changelogLoading = true;
  renderUpdateAppPanel();
  const [indexResult, changelogResult] = await Promise.allSettled([
    fetchRemoteText(UPDATE_REMOTE.indexHtmlUrl, { operation: 'updateIndex', source: 'update-app' }),
    fetchRemoteText(UPDATE_REMOTE.changelogUrl, { operation: 'updateChangelog', source: 'update-app' })
  ]);
  if (indexResult.status === 'fulfilled') {
    const remoteVersionRaw = extractRemoteVersionFromHtml(indexResult.value);
    const localSemver = parseSemverSimple(APP_VERSION);
    const remoteSemver = parseSemverSimple(remoteVersionRaw);
    if (!remoteVersionRaw) {
      state.update.status = 'error';
      log(t('updateRemoteVersionNotFound'));
    } else if (!localSemver || !remoteSemver) {
      state.update.status = 'invalid';
      state.update.remoteVersion = remoteVersionRaw;
    } else {
      state.update.remoteVersion = remoteSemver.raw;
      const cmp = compareSemverSimple(localSemver, remoteSemver);
      state.update.status = cmp === 0 ? 'latest' : (cmp < 0 ? 'available' : 'local-newer');
    }
  } else {
    state.update.status = 'error';
    log(`${t('updateCheckErrorLog')}: ${String(indexResult.reason?.message || indexResult.reason || '')}`);
  }
  if (changelogResult.status === 'fulfilled') {
    const remoteChangelog = String(changelogResult.value || '').trim();
    state.update.remoteChangelog = remoteChangelog || t('updateChangelogEmpty');
  } else {
    state.update.remoteChangelog = '';
    log(`${t('updateChangelogErrorLog')}: ${String(changelogResult.reason?.message || changelogResult.reason || '')}`);
  }
  state.update.changelogLoading = false;
  state.update.checking = false;
  renderUpdateAppPanel();
}
