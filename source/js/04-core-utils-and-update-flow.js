function preferredLang() { const saved = localStorage.getItem(LS.lang) || 'auto'; if (saved !== 'auto') return saved; return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'; }
  function t(key) { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key; }
  function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function escapeHtmlAttr(v) { return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function getCodeValue() { return state.code.editor ? state.code.editor.getValue() : els.codeEditorFallback.value; }
  function setStatus(text) { els.statusText.textContent = text; }
  function parseSemverSimple(version = '') {
    const match = String(version || '').trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return null;
    return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), raw: `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}` };
  }
  function compareSemverSimple(a, b) {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }
  function extractRemoteVersionFromHtml(html = '') {
    const source = String(html || '');
    const match = source.match(/<meta\b[^>]*name=["']fibery-html-editor-version["'][^>]*content=["']([^"']+)["'][^>]*>/i)
      || source.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']fibery-html-editor-version["'][^>]*>/i);
    return String(match?.[1] || '').trim();
  }
  async function fetchRemoteText(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
  function updateStatusMessage() {
    if (state.update.status === 'checking') return t('updateChecking');
    if (state.update.status === 'applying') return t('updateApplying');
    if (state.update.status === 'latest') return t('updateStatusLatest');
    if (state.update.status === 'available') return t('updateStatusAvailable');
    if (state.update.status === 'local-newer') return t('updateStatusLocalNewer');
    if (state.update.status === 'invalid') return t('updateStatusInvalid');
    if (state.update.status === 'error') return t('updateStatusError');
    return t('updateNotChecked');
  }
  function isCurrentAppPageForUpdate() {
    if (state.blank) return false;
    if (!state.current.id || !state.appPageId) return false;
    return state.current.id === state.appPageId;
  }
  function canShowApplyUpdateButton() {
    return state.update.status === 'available';
  }
  function canApplyUpdateNow() {
    return canShowApplyUpdateButton() && !state.update.checking && !state.update.applying && state.isAdmin && isCurrentAppPageForUpdate();
  }
  function parseAppVersionFromHtmlSource(html = '') {
    const source = String(html || '');
    const match = source.match(/\b(?:const|let|var)\s+APP_VERSION\s*=\s*["']([^"']+)["']/);
    return String(match?.[1] || '').trim();
  }
  function validateRemoteUpdateHtml(remoteHtml = '') {
    const source = String(remoteHtml || '');
    if (!source.trim()) return { ok: false, reason: 'empty' };
    if (source.trim().length < 300) return { ok: false, reason: 'too-short' };
    if (/^404:\s*Not Found/i.test(source.trim())) return { ok: false, reason: 'not-found' };
    if (!/<html[\s>]/i.test(source) && !/<!doctype html/i.test(source)) return { ok: false, reason: 'not-html' };
    if (!/fibery-html-editor/i.test(source)) return { ok: false, reason: 'not-editor' };

    const metaVersion = extractRemoteVersionFromHtml(source);
    if (!metaVersion) return { ok: false, reason: 'missing-meta-version' };
    const metaSemver = parseSemverSimple(metaVersion);
    if (!metaSemver) return { ok: false, reason: 'invalid-meta-version', metaVersion };

    const appVersionLiteral = parseAppVersionFromHtmlSource(source);
    if (!appVersionLiteral) return { ok: false, reason: 'missing-app-version' };
    if (appVersionLiteral !== metaSemver.raw) return { ok: false, reason: 'version-mismatch', metaVersion: metaSemver.raw, appVersionLiteral };

    if (!/window\.FIBERY_HTML_EDITOR_VERSION\s*=\s*APP_VERSION/.test(source)) return { ok: false, reason: 'missing-window-version-assign', metaVersion: metaSemver.raw };
    if (!/document\.documentElement\.dataset\.appVersion\s*=\s*APP_VERSION/.test(source)) return { ok: false, reason: 'missing-dataset-version-assign', metaVersion: metaSemver.raw };

    const localSemver = parseSemverSimple(APP_VERSION);
    if (!localSemver) return { ok: false, reason: 'invalid-local-version' };
    const cmp = compareSemverSimple(localSemver, metaSemver);
    if (cmp >= 0) return { ok: false, reason: 'remote-not-newer', metaVersion: metaSemver.raw };
    return { ok: true, remoteVersion: metaSemver.raw, localVersion: localSemver.raw };
  }
  function updateValidationReasonText(reason = '') {
    if (reason === 'remote-not-newer') return t('updateRemoteVersionNotNewer');
    return t('updateRemoteHtmlInvalid');
  }
  async function createUpdateBackupRecord({ pageId, fromVersion, toVersion, title, description, html }) {
    if (!state.db) throw new Error('db-unavailable');
    const createdAt = Date.now();
    const snapshot = {
      title: String(title || ''),
      description: String(description || ''),
      html: String(html || '')
    };
    const record = {
      key: `update-backup:${pageId}:${createdAt}:${Math.random().toString(36).slice(2, 8)}`,
      kind: 'update-backup',
      source: 'update-backup',
      action: 'update-backup',
      pageId: String(pageId || ''),
      fromVersion: String(fromVersion || ''),
      toVersion: String(toVersion || ''),
      title: snapshot.title,
      description: snapshot.description,
      html: snapshot.html,
      signature: snapshotSignature(snapshot),
      createdAt
    };
    await txPut('versions', record);
    return record;
  }
  async function applyRemoteUpdate() {
    if (state.update.applying) return;
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
      const remoteHtml = await fetchRemoteText(UPDATE_REMOTE.indexHtmlUrl);
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

      setStatus(t('updateSaving'));
      const saved = await API.savePage({
        id: state.current.id,
        title: state.current.title,
        description: state.current.description,
        html: remoteHtml
      });

      state.current = {
        id: saved.id || saved.data?.id || state.current.id,
        title: saved.title || saved.data?.title || state.current.title,
        description: saved.description || saved.data?.description || state.current.description,
        html: saved.html || saved.data?.html || remoteHtml
      };
      localStorage.setItem(LS.lastPageId, state.current.id);
      const now = Date.now();
      await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: now, lastSavedAt: now });
      await clearAutosaveHistoryBySignature(state.current.id, snapshotSignature(state.current));
      await saveHistory('update-app');
      setCurrentBaseline();
      renderCurrent();
      syncPreviewMode({ immediate: true, forceRealReload: true });
      if (state.sidebar.open) await loadSidebarPages({ force: true, reset: true });

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
  function setUpdateVersionValueTone() {
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
  function updateVersionComparisonState() {
    const localSemver = parseSemverSimple(APP_VERSION);
    const remoteSemver = parseSemverSimple(state.update.remoteVersion || '');
    const comparable = !!localSemver && !!remoteSemver;
    return {
      localSemver,
      remoteSemver,
      comparable,
      localVsRemote: comparable ? compareSemverSimple(localSemver, remoteSemver) : null
    };
  }
  function parseUpdateChangelogVersionHeading(line = '') {
    const match = String(line || '').trim().match(/^##\s+\[(\d+\.\d+\.\d+)\]\s*-\s*(.+)$/);
    if (!match) return null;
    const semver = parseSemverSimple(match[1]);
    if (!semver) return null;
    return { version: semver.raw, date: String(match[2] || '').trim() };
  }
  function appendUpdateChangelogBadge(parent, text, toneClass) {
    if (!parent || !text) return;
    const badge = document.createElement('span');
    badge.className = `update-changelog-badge ${toneClass || ''}`.trim();
    badge.textContent = text;
    parent.appendChild(badge);
  }
  function renderUpdateVersionHeading(container, headingLine, comparison) {
    const heading = parseUpdateChangelogVersionHeading(headingLine);
    if (!heading) return false;
    const headingSemver = parseSemverSimple(heading.version);
    const isInstalled = !!comparison.localSemver && heading.version === comparison.localSemver.raw;
    const isLatest = !!comparison.remoteSemver && heading.version === comparison.remoteSemver.raw;
    const isNewerThanInstalled = !!comparison.localSemver && !!headingSemver && compareSemverSimple(headingSemver, comparison.localSemver) > 0;
    const isInstalledOutdated = isInstalled && comparison.localVsRemote !== null && comparison.localVsRemote < 0;
    const isInstalledCurrent = isInstalled && comparison.localVsRemote !== null && comparison.localVsRemote === 0;

    const wrapper = document.createElement('div');
    wrapper.className = 'update-changelog-version-heading';
    if (isInstalledOutdated) wrapper.classList.add('installed-outdated');
    else if (isInstalledCurrent) wrapper.classList.add('installed-current');
    else if (isLatest) wrapper.classList.add('latest');
    else if (isNewerThanInstalled) wrapper.classList.add('newer-than-installed');

    const labelWrap = document.createElement('div');
    const versionText = document.createElement('div');
    versionText.className = 'text-sm font-semibold text-gray-900';
    versionText.textContent = heading.version;
    labelWrap.appendChild(versionText);
    if (heading.date) {
      const dateText = document.createElement('div');
      dateText.className = 'text-[11px] text-gray-500';
      dateText.textContent = `${t('updateVersionDate')}: ${heading.date}`;
      labelWrap.appendChild(dateText);
    }
    wrapper.appendChild(labelWrap);

    const badges = document.createElement('div');
    badges.className = 'update-changelog-version-badges';
    if (isInstalled) appendUpdateChangelogBadge(badges, t('updateVersionBadgeInstalled'), 'badge-installed');
    if (isLatest) appendUpdateChangelogBadge(badges, t('updateVersionBadgeLatest'), 'badge-latest');
    if (isInstalledCurrent) appendUpdateChangelogBadge(badges, t('updateVersionBadgeCurrent'), 'badge-current');
    if (isInstalledOutdated) appendUpdateChangelogBadge(badges, t('updateVersionBadgeOutdated'), 'badge-outdated');
    if (isNewerThanInstalled && !isInstalled) appendUpdateChangelogBadge(badges, t('updateVersionBadgeNewer'), 'badge-newer');
    if (badges.childNodes.length) wrapper.appendChild(badges);

    container.appendChild(wrapper);
    return true;
  }
  function appendUpdateChangelogText(container, text) {
    const value = String(text || '').trim();
    if (!value) return;
    const p = document.createElement('p');
    p.className = 'update-changelog-paragraph';
    p.textContent = value;
    container.appendChild(p);
  }
  function renderUpdateChangelog(container, rawChangelog, comparison) {
    container.textContent = '';
    const source = String(rawChangelog || '').replace(/\r\n/g, '\n');
    if (!source.trim()) {
      appendUpdateChangelogText(container, t('updateChangelogUnavailable'));
      return;
    }
    const lines = source.split('\n');
    let paragraphBuffer = [];
    let list = null;

    const flushParagraph = () => {
      if (!paragraphBuffer.length) return;
      appendUpdateChangelogText(container, paragraphBuffer.join(' '));
      paragraphBuffer = [];
    };
    const flushList = () => { list = null; };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
        continue;
      }

      if (parseUpdateChangelogVersionHeading(line)) {
        flushParagraph();
        flushList();
        renderUpdateVersionHeading(container, line, comparison);
        continue;
      }

      const sectionHeading = trimmed.match(/^###\s+(.+)$/);
      if (sectionHeading) {
        flushParagraph();
        flushList();
        const heading = document.createElement('h4');
        heading.className = 'update-changelog-section-title';
        heading.textContent = sectionHeading[1].trim();
        container.appendChild(heading);
        continue;
      }

      const genericHeading = trimmed.match(/^##\s+(.+)$/);
      if (genericHeading) {
        flushParagraph();
        flushList();
        const heading = document.createElement('h3');
        heading.className = 'update-changelog-section-title';
        heading.textContent = genericHeading[1].trim();
        container.appendChild(heading);
        continue;
      }

      const listItem = trimmed.match(/^[-*]\s+(.+)$/);
      if (listItem) {
        flushParagraph();
        if (!list) {
          list = document.createElement('ul');
          list.className = 'update-changelog-list';
          container.appendChild(list);
        }
        const item = document.createElement('li');
        item.className = 'update-changelog-list-item';
        item.textContent = listItem[1].trim();
        list.appendChild(item);
        continue;
      }

      paragraphBuffer.push(trimmed);
    }
    flushParagraph();
  }
  function renderUpdateAppPanel() {
    if (!els.updateInstalledVersionValue || !els.updateAvailableVersionValue || !els.updateCheckStatusText || !els.updateChangelogBox) return;
    els.updateInstalledVersionValue.textContent = APP_VERSION;
    els.updateAvailableVersionValue.textContent = state.update.remoteVersion || t('updateNotChecked');
    els.updateCheckStatusText.textContent = updateStatusMessage();
    setUpdateVersionValueTone();
    if (els.updateVerifyAgainBtn) {
      els.updateVerifyAgainBtn.disabled = !!state.update.checking || !!state.update.applying;
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
    const comparison = updateVersionComparisonState();
    if (state.update.changelogLoading) {
      renderUpdateChangelog(els.updateChangelogBox, t('updateChangelogLoading'), comparison);
    } else if (state.update.remoteChangelog) {
      renderUpdateChangelog(els.updateChangelogBox, state.update.remoteChangelog, comparison);
    } else {
      renderUpdateChangelog(els.updateChangelogBox, t('updateChangelogUnavailable'), comparison);
    }
  }
  async function checkRemoteUpdateInfo() {
    if (state.update.checking || state.update.applying) return;
    state.update.checking = true;
    state.update.status = 'checking';
    state.update.remoteVersion = '';
    state.update.changelogLoading = true;
    renderUpdateAppPanel();
    const [indexResult, changelogResult] = await Promise.allSettled([
      fetchRemoteText(UPDATE_REMOTE.indexHtmlUrl),
      fetchRemoteText(UPDATE_REMOTE.changelogUrl)
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
  function openUpdateAppModal() {
    if (!els.updateAppModal) return;
    els.updateAppModal.classList.remove('hidden');
    renderUpdateAppPanel();
    void checkRemoteUpdateInfo();
  }
  function closeUpdateAppModal() {
    if (!els.updateAppModal) return;
    els.updateAppModal.classList.add('hidden');
  }
  function revokeLocalPreviewObjectUrl() {
    const current = state.preview?.localObjectUrl;
    if (!current) return;
    try { URL.revokeObjectURL(current); } catch (_) {}
    state.preview.localObjectUrl = '';
  }
  function clearPreviewDebounce() {
    if (!state.preview.debounceTimer) return;
    window.clearTimeout(state.preview.debounceTimer);
    state.preview.debounceTimer = null;
  }
  function localPreviewBaseHref() {
    try { return new URL('.', window.location.href).href; } catch (_) {}
    try { return window.location.origin + '/'; } catch (_) {}
    return '';
  }
  function localPreviewStatusLabel({ usesTailwind = false } = {}) { return usesTailwind ? t('localPreviewStatusTailwind') : t('localPreviewStatus'); }
  function htmlUsesTailwindStylesheet(html = '') {
    return /<link\b[^>]*href\s*=\s*["'](?:\.\/|\/)?tailwind\.css["'][^>]*>/i.test(String(html || ''));
  }
  function shouldUseLocalPreview() { if (state.blank) return false; if (!state.current.id) return true; return !sameSnapshot(currentSnapshotFromState(), currentBaselineSnapshot()); }
  function localPreviewRenderSignature(html, baseHref, usesTailwind) {
    return snapshotSignature({
      title: String(baseHref || ''),
      description: usesTailwind ? '1' : '0',
      html: String(html || '')
    });
  }
  function localPreviewRequestId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
  function handleLocalPreviewMessage(event) {
    const data = event?.data;
    if (!data || data.source !== LOCAL_PREVIEW_MESSAGE_SOURCE) return;
    if (event.source !== els.previewFrame.contentWindow) return;
    if (state.preview.mode !== 'local') return;
    if (!data.requestId || data.requestId !== state.preview.activeRequestId) return;

    if (data.type === 'css-load') {
      log(`${t('localPreviewPocCssLoaded')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
    } else if (data.type === 'css-error') {
      log(`${t('localPreviewPocCssFailed')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
    } else if (data.type === 'css-timeout') {
      log(`${t('localPreviewPocCssTimeout')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
    } else if (data.type === 'css-missing') {
      log(`${t('localPreviewPocCssMissing')}: ${String(data.resolvedHref || data.cssHref || '-')}`);
    } else if (data.type === 'tailwind-browser-load') {
      log(t('localPreviewTailwindBrowserLoaded'));
    } else if (data.type === 'tailwind-browser-error') {
      log(t('localPreviewTailwindBrowserFailed'));
    }
  }
