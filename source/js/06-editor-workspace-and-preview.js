function setCodeValue(value) { const next = value || ''; state.code.suppress = true; if (state.code.editor) { const model = state.code.editor.getModel(); if (model && model.getValue() !== next) model.setValue(next); } els.codeEditorFallback.value = next; state.code.suppress = false; updateCharCount(); }
  function setCodeReadOnly(readOnly) { if (state.code.editor) state.code.editor.updateOptions({ readOnly: !!readOnly }); els.codeEditorFallback.readOnly = !!readOnly; }
  function setupCodeEditor() { return new Promise((resolve) => { const fallback = () => { state.code.fallback = true; els.codeEditor.classList.add('hidden'); els.codeEditorFallback.classList.remove('hidden'); els.codeEditorFallback.addEventListener('input', () => { updateCurrentFromInputs(); updateCharCount(); markDirty(true); scheduleLocalPreviewRefresh(); }); log('Monaco not available. Using textarea fallback.'); resolve(false); }; if (!window.require) return fallback(); try { window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } }); window.require(['vs/editor/editor.main'], () => { try { state.code.editor = monaco.editor.create(els.codeEditor, { value: '', language: 'html', theme: 'vs', automaticLayout: true, minimap: { enabled: true }, fontSize: 13, lineHeight: 20, tabSize: 2, wordWrap: 'on', scrollBeyondLastLine: false, renderWhitespace: 'selection', bracketPairColorization: { enabled: true } }); state.code.editor.onDidChangeModelContent(() => { if (state.code.suppress) return; updateCurrentFromInputs(); updateCharCount(); markDirty(true); scheduleLocalPreviewRefresh(); }); resolve(true); } catch (_) { fallback(); } }, fallback); } catch (_) { fallback(); } }); }

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
    renderUpdateAppPanel();
  }
  function log(message) { const time = new Date().toLocaleTimeString(state.lang === 'pt-BR' ? 'pt-BR' : 'en-US'); const line = document.createElement('div'); line.textContent = `[${time}] ${message}`; els.logBox.prepend(line); }
  function currentSnapshotFromState() {
    return {
      title: String(state.current.title || ''),
      description: String(state.current.description || ''),
      html: String(state.current.html || '')
    };
  }
  function currentBaselineSnapshot() {
    return {
      title: String(state.currentBaseline.title || ''),
      description: String(state.currentBaseline.description || ''),
      html: String(state.currentBaseline.html || '')
    };
  }
  function setCurrentBaseline() {
    state.currentBaseline = {
      id: state.current.id || '',
      title: String(state.current.title || ''),
      description: String(state.current.description || ''),
      html: String(state.current.html || '')
    };
  }
  function draftKeyForPage(pageId = '') { return pageId ? `page:${pageId}` : `unsaved:${state.drafts.unsavedId}`; }
  function draftSnapshotFromRecord(record) {
    return {
      title: String(record?.title || ''),
      description: String(record?.description || ''),
      html: String(record?.html || '')
    };
  }
  function snapshotSignature(snapshot) {
    const raw = `${String(snapshot?.title || '')}\u001f${String(snapshot?.description || '')}\u001f${String(snapshot?.html || '')}`;
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `${raw.length}:${(hash >>> 0).toString(16)}`;
  }
  function sameSnapshot(a, b) {
    return String(a?.title || '') === String(b?.title || '')
      && String(a?.description || '') === String(b?.description || '')
      && String(a?.html || '') === String(b?.html || '');
  }
  function syncDirtyWithBaseline() {
    markDirty(!sameSnapshot(currentSnapshotFromState(), currentBaselineSnapshot()));
  }
  function hasAnyDraftContent(snapshot) {
    return !!String(snapshot.title || '').trim() || !!String(snapshot.description || '').trim() || !!String(snapshot.html || '').trim();
  }
  function isDefaultUnsavedSnapshot(snapshot) {
    const title = String(snapshot.title || '').trim();
    const description = String(snapshot.description || '').trim();
    const html = String(snapshot.html || '').trim();
    const defaultTitle = title === '' || title === 'Untitled Page';
    return defaultTitle && !description && !html;
  }
  function shouldPersistDraftSnapshot(snapshot, pageId = '') {
    if (!snapshot) return false;
    if (pageId) {
      const baseline = currentBaselineSnapshot();
      if (sameSnapshot(snapshot, baseline)) return false;
      return hasAnyDraftContent(snapshot);
    }
    return !isDefaultUnsavedSnapshot(snapshot);
  }
  function clearDraftAutosaveTimer() {
    if (!state.drafts.autosaveTimer) return;
    window.clearTimeout(state.drafts.autosaveTimer);
    state.drafts.autosaveTimer = null;
  }
  function loadDismissedRecoveryMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LS.dismissedRecovery) || '{}');
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
    return {};
  }
  function persistDismissedRecoveryMap() {
    try { localStorage.setItem(LS.dismissedRecovery, JSON.stringify(state.drafts.dismissedMap || {})); } catch (_) {}
  }
  function setDismissedRecovery(key, signature) {
    if (!key || !signature) return;
    state.drafts.dismissedMap[key] = signature;
    persistDismissedRecoveryMap();
  }
  function clearDismissedRecovery(key) {
    if (!key || state.drafts.dismissedMap[key] === undefined) return;
    delete state.drafts.dismissedMap[key];
    persistDismissedRecoveryMap();
  }
  function updateRecoveryReopenButton() {
    const candidate = state.drafts.reopenCandidate;
    if (!candidate || !candidate.key || !state.drafts.byKey[candidate.key]) {
      els.reopenRecoveryBtn.classList.add('hidden');
      return;
    }
    const currentKey = draftKeyForPage(state.current.id || '');
    if (state.blank && !String(candidate.key || '').startsWith('unsaved:')) {
      els.reopenRecoveryBtn.classList.add('hidden');
      return;
    }
    if (!state.blank && candidate.key !== currentKey) {
      els.reopenRecoveryBtn.classList.add('hidden');
      return;
    }
    els.reopenRecoveryBtn.textContent = t('reopenRecoveryComparison');
    els.reopenRecoveryBtn.classList.remove('hidden');
  }
  async function deleteDraftByKey(key) {
    if (!key) return;
    delete state.drafts.byKey[key];
    delete state.drafts.lastAutosaveAtByKey[key];
    if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
    clearDismissedRecovery(key);
    updateRecoveryReopenButton();
    if (state.db) {
      try { await txDelete('drafts', key); } catch (_) {}
    }
  }
  function getAutosaveLimit() {
    const raw = Number(localStorage.getItem(LS.autosaveLimit) || '10');
    if (!Number.isFinite(raw) || raw < 0) return 10;
    return raw;
  }
  function getManualHistoryLimit() {
    const raw = Number(localStorage.getItem(LS.versionLimit) || '20');
    if (!Number.isFinite(raw) || raw < 0) return 20;
    return raw;
  }
  async function saveAutosaveHistory(record) {
    if (!state.current.id || !state.db || !record) return;
    const row = {
      key: `autosave:${state.current.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      kind: 'autosave',
      pageId: state.current.id,
      title: record.title || '',
      description: record.description || '',
      html: record.html || '',
      action: 'autosave',
      signature: record.signature || snapshotSignature(record),
      createdAt: Date.now()
    };
    await txPut('versions', row);
    await enforceAutosaveHistoryLimit(state.current.id);
  }
  async function saveCurrentDraftNow(options = {}) {
    const force = !!options.force;
    if (!state.db || state.blank || !state.isAdmin) return null;
    updateCurrentFromInputs();
    const pageId = state.current.id || '';
    const key = draftKeyForPage(pageId);
    const snapshot = currentSnapshotFromState();
    if (!shouldPersistDraftSnapshot(snapshot, pageId)) {
      await deleteDraftByKey(key);
      return null;
    }
    const signature = snapshotSignature(snapshot);
    const previous = state.drafts.byKey[key];
    const previousSignature = previous?.signature || (previous ? snapshotSignature(previous) : '');
    if (previous && previousSignature === signature) return previous;

    const now = Date.now();
    const lastAutosaveAt = Number(state.drafts.lastAutosaveAtByKey[key] || 0);
    if (!force && lastAutosaveAt && (now - lastAutosaveAt) < state.drafts.autosaveIntervalMs) return null;

    const meta = pageId ? (getMetaMap()[pageId] || {}) : {};
    const record = {
      id: key,
      key,
      pageId,
      unsavedId: pageId ? '' : state.drafts.unsavedId,
      title: snapshot.title,
      description: snapshot.description,
      html: snapshot.html,
      signature,
      updatedAt: now,
      baseSavedAt: Number(meta.lastSavedAt || 0)
    };
    await txPut('drafts', record);
    state.drafts.byKey[key] = record;
    state.drafts.lastAutosaveAtByKey[key] = now;
    clearDismissedRecovery(key);
    if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
    updateRecoveryReopenButton();
    await saveAutosaveHistory(record);
    return record;
  }
  function scheduleDraftAutosave() {
    if (!state.db || state.blank || !state.isAdmin || !state.dirty) return;
    if (state.drafts.autosaveTimer) return;
    state.drafts.autosaveTimer = window.setTimeout(async () => {
      state.drafts.autosaveTimer = null;
      try { await saveCurrentDraftNow({ force: false }); } catch (err) { log(err.message || String(err)); }
      if (state.dirty && state.isAdmin && !state.blank) scheduleDraftAutosave();
    }, state.drafts.autosaveIntervalMs);
  }
  async function flushDraftAutosaveNow() {
    if (!state.dirty) return;
    clearDraftAutosaveTimer();
    await saveCurrentDraftNow({ force: true });
  }
  function draftUpdatedAtLabel(time) {
    if (!time) return '';
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(state.lang === 'pt-BR' ? 'pt-BR' : 'en-US');
  }
  function draftDiffMap(currentSnapshot, draftSnapshot) {
    return {
      title: String(currentSnapshot?.title || '') !== String(draftSnapshot?.title || ''),
      description: String(currentSnapshot?.description || '') !== String(draftSnapshot?.description || ''),
      html: String(currentSnapshot?.html || '') !== String(draftSnapshot?.html || '')
    };
  }
  function draftFieldBadge(isDifferent) {
    if (isDifferent) return `<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">${escapeHtml(t('draftDifferent'))}</span>`;
    return `<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">${escapeHtml(t('draftSame'))}</span>`;
  }
  function draftMetadataLine(text = '') {
    const value = String(text || '');
    const textClass = value ? 'text-gray-500' : 'text-transparent';
    return `<div class="mt-1 min-h-[16px] text-[11px] ${textClass}">${escapeHtml(value || ' ')}</div>`;
  }
  function draftColumnHtml(label, snapshot, diff, options = {}) {
    const subtitle = String(options.subtitle || '');
    const titleValue = String(snapshot?.title || '');
    const descriptionValue = String(snapshot?.description || '');
    return `
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div class="border-b border-gray-200 bg-gray-50 px-3 py-2">
          <div class="text-sm font-semibold text-gray-800">${escapeHtml(label)}</div>
          ${draftMetadataLine(subtitle)}
        </div>
        <div class="space-y-3 p-3">
          <div>
            <div class="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500"><span>${escapeHtml(t('draftFieldTitle'))}</span>${draftFieldBadge(!!diff.title)}</div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-800 whitespace-pre-wrap break-words">${escapeHtml(titleValue || '-')}</div>
          </div>
          <div>
            <div class="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500"><span>${escapeHtml(t('draftFieldDescription'))}</span>${draftFieldBadge(!!diff.description)}</div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-700 whitespace-pre-wrap break-words min-h-[56px]">${escapeHtml(descriptionValue || '-')}</div>
          </div>
        </div>
      </div>`;
  }
  function draftLineCount(value) {
    const text = String(value || '');
    if (!text) return [];
    return text.replace(/\r\n/g, '\n').split('\n');
  }
  function buildDraftLineDiffRows(currentHtml, draftHtml) {
    const currentLines = draftLineCount(currentHtml);
    const draftLines = draftLineCount(draftHtml);
    let i = 0;
    let j = 0;
    let leftNo = 1;
    let rightNo = 1;
    const rows = [];
    const stats = { added: 0, removed: 0, changed: 0 };

    while (i < currentLines.length || j < draftLines.length) {
      const leftLine = i < currentLines.length ? currentLines[i] : null;
      const rightLine = j < draftLines.length ? draftLines[j] : null;

      if (leftLine !== null && rightLine !== null && leftLine === rightLine) {
        rows.push({ leftNo, rightNo, leftLine, rightLine, leftType: 'same', rightType: 'same' });
        i += 1;
        j += 1;
        leftNo += 1;
        rightNo += 1;
        continue;
      }

      const draftLookahead = (leftLine !== null && j + 1 < draftLines.length) ? draftLines[j + 1] : null;
      if (leftLine !== null && draftLookahead !== null && leftLine === draftLookahead) {
        rows.push({ leftNo: '', rightNo, leftLine: '', rightLine, leftType: 'empty', rightType: 'added' });
        j += 1;
        rightNo += 1;
        stats.added += 1;
        continue;
      }

      const currentLookahead = (rightLine !== null && i + 1 < currentLines.length) ? currentLines[i + 1] : null;
      if (rightLine !== null && currentLookahead !== null && currentLookahead === rightLine) {
        rows.push({ leftNo, rightNo: '', leftLine, rightLine: '', leftType: 'removed', rightType: 'empty' });
        i += 1;
        leftNo += 1;
        stats.removed += 1;
        continue;
      }

      if (leftLine !== null && rightLine !== null) {
        rows.push({ leftNo, rightNo, leftLine, rightLine, leftType: 'changed', rightType: 'changed' });
        i += 1;
        j += 1;
        leftNo += 1;
        rightNo += 1;
        stats.changed += 1;
        continue;
      }

      if (leftLine !== null) {
        rows.push({ leftNo, rightNo: '', leftLine, rightLine: '', leftType: 'removed', rightType: 'empty' });
        i += 1;
        leftNo += 1;
        stats.removed += 1;
        continue;
      }

      rows.push({ leftNo: '', rightNo, leftLine: '', rightLine, leftType: 'empty', rightType: 'added' });
      j += 1;
      rightNo += 1;
      stats.added += 1;
    }

    return { rows, stats };
  }
  function renderDraftCodeLegend(stats = {}) {
    const added = Number(stats.added || 0);
    const removed = Number(stats.removed || 0);
    const changed = Number(stats.changed || 0);
    const parts = [];
    if (added) parts.push(`<span class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-1 font-semibold text-green-700">${escapeHtml(t('draftAdded'))}: ${added}</span>`);
    if (removed) parts.push(`<span class="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700">${escapeHtml(t('draftRemoved'))}: ${removed}</span>`);
    if (changed) parts.push(`<span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">${escapeHtml(t('draftChanged'))}: ${changed}</span>`);
    if (!parts.length) parts.push(`<span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-600">${escapeHtml(t('draftNoCodeDifferences'))}</span>`);
    els.draftCodeDiffLegend.innerHTML = parts.join('');
  }
  function draftFallbackLineHtml(lineNumber, text, type) {
    const typeClass = type === 'added'
      ? 'draft-diff-added'
      : type === 'removed'
        ? 'draft-diff-removed'
        : type === 'changed'
          ? 'draft-diff-changed'
          : type === 'empty'
            ? 'draft-diff-empty'
            : '';
    const safeNumber = lineNumber === '' ? '&nbsp;' : escapeHtml(String(lineNumber));
    const safeText = text === '' ? '&nbsp;' : escapeHtml(String(text));
    return `<div class="draft-diff-line ${typeClass}"><div class="draft-diff-line-number">${safeNumber}</div><div class="draft-diff-line-code">${safeText}</div></div>`;
  }
  function syncDraftFallbackScroll(source, target) {
    if (state.drafts.fallbackSyncing) return;
    state.drafts.fallbackSyncing = true;
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
    window.requestAnimationFrame(() => { state.drafts.fallbackSyncing = false; });
  }
  function renderDraftFallbackDiff(rows, stats) {
    els.draftCodeDiffMonaco.classList.add('hidden');
    els.draftCodeDiffFallback.classList.remove('hidden');
    const leftHtml = rows.map(row => draftFallbackLineHtml(row.leftNo, row.leftLine, row.leftType)).join('');
    const rightHtml = rows.map(row => draftFallbackLineHtml(row.rightNo, row.rightLine, row.rightType)).join('');
    els.draftFallbackCurrentPane.innerHTML = leftHtml || '<div class="p-3 text-xs text-gray-500">-</div>';
    els.draftFallbackLocalPane.innerHTML = rightHtml || '<div class="p-3 text-xs text-gray-500">-</div>';
    els.draftFallbackCurrentPane.onscroll = () => syncDraftFallbackScroll(els.draftFallbackCurrentPane, els.draftFallbackLocalPane);
    els.draftFallbackLocalPane.onscroll = () => syncDraftFallbackScroll(els.draftFallbackLocalPane, els.draftFallbackCurrentPane);
    els.draftFallbackCurrentPane.scrollTop = 0;
    els.draftFallbackLocalPane.scrollTop = 0;
    renderDraftCodeLegend(stats);
  }
  function diffRangeLineCount(start, end) {
    const safeStart = Number(start || 0);
    const safeEnd = Number(end || 0);
    if (safeStart <= 0 || safeEnd <= 0) return 0;
    return Math.max(0, safeEnd - safeStart + 1);
  }
  function monacoDiffStatsFromChanges(lineChanges = []) {
    const stats = { added: 0, removed: 0, changed: 0 };
    for (const change of lineChanges) {
      const removed = diffRangeLineCount(change.originalStartLineNumber, change.originalEndLineNumber);
      const added = diffRangeLineCount(change.modifiedStartLineNumber, change.modifiedEndLineNumber);
      if (removed && added) {
        stats.changed += Math.max(removed, added);
      } else if (removed) {
        stats.removed += removed;
      } else if (added) {
        stats.added += added;
      }
    }
    return stats;
  }
  function disposeDraftDiffEditor() {
    if (state.drafts.diffEditor) {
      state.drafts.diffEditor.dispose();
      state.drafts.diffEditor = null;
    }
    if (state.drafts.diffOriginalModel) {
      state.drafts.diffOriginalModel.dispose();
      state.drafts.diffOriginalModel = null;
    }
    if (state.drafts.diffModifiedModel) {
      state.drafts.diffModifiedModel.dispose();
      state.drafts.diffModifiedModel = null;
    }
  }
  function renderDraftCodeDiff(currentSnapshot, draftSnapshot) {
    disposeDraftDiffEditor();
    const currentHtml = String(currentSnapshot?.html || '');
    const draftHtml = String(draftSnapshot?.html || '');
    const fallback = buildDraftLineDiffRows(currentHtml, draftHtml);
    renderDraftCodeLegend(fallback.stats);
    els.draftCodeDiffMonaco.classList.add('hidden');
    els.draftCodeDiffFallback.classList.add('hidden');

    if (!(window.monaco && window.monaco.editor && els.draftCodeDiffMonaco)) {
      renderDraftFallbackDiff(fallback.rows, fallback.stats);
      return;
    }

    try {
      state.drafts.diffOriginalModel = monaco.editor.createModel(currentHtml, 'html');
      state.drafts.diffModifiedModel = monaco.editor.createModel(draftHtml, 'html');
      state.drafts.diffEditor = monaco.editor.createDiffEditor(els.draftCodeDiffMonaco, {
        automaticLayout: true,
        readOnly: true,
        originalEditable: false,
        renderIndicators: true,
        renderSideBySide: window.matchMedia('(min-width: 1024px)').matches,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        ignoreTrimWhitespace: false,
        wordWrap: 'off',
        fontSize: 12,
        lineHeight: 20
      });
      state.drafts.diffEditor.setModel({ original: state.drafts.diffOriginalModel, modified: state.drafts.diffModifiedModel });
      els.draftCodeDiffMonaco.classList.remove('hidden');

      const refreshLegend = () => {
        const editor = state.drafts.diffEditor;
        if (!editor) return;
        const changes = editor.getLineChanges() || [];
        if (!changes.length) {
          renderDraftCodeLegend(currentHtml === draftHtml ? { added: 0, removed: 0, changed: 0 } : fallback.stats);
          return;
        }
        renderDraftCodeLegend(monacoDiffStatsFromChanges(changes));
      };
      state.drafts.diffEditor.onDidUpdateDiff(refreshLegend);
      refreshLegend();
      state.drafts.diffEditor.layout();
      return;
    } catch (err) {
      log(err.message || String(err));
      disposeDraftDiffEditor();
      renderDraftFallbackDiff(fallback.rows, fallback.stats);
    }
  }
  function closeDraftRecoveryModal() {
    disposeDraftDiffEditor();
    if (els.draftCodeDiffMonaco) els.draftCodeDiffMonaco.classList.add('hidden');
    if (els.draftCodeDiffFallback) els.draftCodeDiffFallback.classList.add('hidden');
    if (els.draftFallbackCurrentPane) els.draftFallbackCurrentPane.innerHTML = '';
    if (els.draftFallbackLocalPane) els.draftFallbackLocalPane.innerHTML = '';
    els.draftRecoveryModal.classList.add('hidden');
    state.drafts.activeDraftKey = '';
    state.drafts.activeRecovery = null;
  }
  function openDraftRecoveryModal({ key, pageId, currentSnapshot, draftRecord, mode = 'draft', titleKey = 'draftRecoveryTitle', subtitle = '', rightTitleKey = 'draftLocalVersion', leftTitleKey = 'draftCurrentVersion', leftSubtitle = '', rightSubtitle = '', restoreTextKey = 'restoreDraft', showDiscard = true } = {}) {
    if (!draftRecord) return;
    const draftSnapshot = draftSnapshotFromRecord(draftRecord);
    const diff = draftDiffMap(currentSnapshot, draftSnapshot);
    const draftUpdatedLabel = draftUpdatedAtLabel(Number(draftRecord.updatedAt || draftRecord.createdAt || 0));
    const computedLeftSubtitle = leftSubtitle || (mode === 'draft' ? t('draftLoadedFromFibery') : '');
    const computedRightSubtitle = rightSubtitle || `${t('draftUpdatedAt')}: ${draftUpdatedLabel || '-'}`;
    els.draftRecoveryTitle.textContent = t(titleKey);
    els.draftRecoverySubtitle.textContent = subtitle || (pageId ? t('draftRecoverySubtitleSaved') : t('draftRecoverySubtitleUnsaved'));
    els.draftCurrentColumn.innerHTML = draftColumnHtml(t(leftTitleKey), currentSnapshot, diff, { subtitle: computedLeftSubtitle });
    els.draftLocalColumn.innerHTML = draftColumnHtml(t(rightTitleKey), draftSnapshot, diff, { subtitle: computedRightSubtitle });
    renderDraftCodeDiff(currentSnapshot, draftSnapshot);
    els.restoreDraftBtn.textContent = t(restoreTextKey);
    els.keepCurrentVersionBtn.textContent = t('keepCurrentVersion');
    els.discardDraftBtn.classList.toggle('hidden', !showDiscard);
    state.drafts.activeDraftKey = key;
    state.drafts.activeRecovery = { mode, key, pageId: pageId || '', record: draftRecord };
    els.draftRecoveryModal.classList.remove('hidden');
  }
  async function keepCurrentVersionFromDraft() {
    const recovery = state.drafts.activeRecovery;
    if (recovery?.mode === 'draft' && recovery.key) {
      const record = state.drafts.byKey[recovery.key];
      const signature = record?.signature || (record ? snapshotSignature(record) : '');
      if (signature) {
        setDismissedRecovery(recovery.key, signature);
        state.drafts.reopenCandidate = { key: recovery.key };
      }
      setStatus(t('draftKeptCurrent'));
    }
    updateRecoveryReopenButton();
    closeDraftRecoveryModal();
  }
  async function discardDraftFromModal() {
    const recovery = state.drafts.activeRecovery;
    const key = recovery?.key || state.drafts.activeDraftKey;
    await deleteDraftByKey(key);
    if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
    updateRecoveryReopenButton();
    closeDraftRecoveryModal();
    setStatus(t('draftDiscarded'));
  }
  async function restoreDraftFromModal() {
    const recovery = state.drafts.activeRecovery;
    if (!recovery) { closeDraftRecoveryModal(); return; }
    const key = recovery.key || state.drafts.activeDraftKey;
    const record = recovery.record || (key ? state.drafts.byKey[key] : null);
    if (!record) { closeDraftRecoveryModal(); return; }
    const snapshot = draftSnapshotFromRecord(record);
    state.current.title = snapshot.title;
    state.current.description = snapshot.description;
    state.current.html = snapshot.html;
    renderCurrent();
    markDirty(true);
    syncPreviewMode({ immediate: true });
    if (key) clearDismissedRecovery(key);
    if (state.drafts.reopenCandidate?.key === key) state.drafts.reopenCandidate = null;
    updateRecoveryReopenButton();
    closeDraftRecoveryModal();
    setStatus(recovery.mode === 'history-manual' || recovery.mode === 'history-autosave' ? t('restoredFromHistory') : t('draftRestored'));
  }
  async function maybePromptDraftRecoveryForCurrentPage(promptToken = state.drafts.promptToken) {
    if (!state.db || state.blank) return;
    if (promptToken !== state.drafts.promptToken) return;
    const key = draftKeyForPage(state.current.id || '');
    if (!key) return;
    const record = state.drafts.byKey[key];
    if (!record) return;
    const draftSnapshot = draftSnapshotFromRecord(record);
    if (!shouldPersistDraftSnapshot(draftSnapshot, record.pageId || '')) { await deleteDraftByKey(key); return; }
    const currentSnapshot = currentSnapshotFromState();
    if (sameSnapshot(currentSnapshot, draftSnapshot)) {
      await deleteDraftByKey(key);
      return;
    }
    const signature = record.signature || snapshotSignature(record);
    if (state.drafts.dismissedMap[key] && state.drafts.dismissedMap[key] === signature) {
      state.drafts.reopenCandidate = { key };
      updateRecoveryReopenButton();
      return;
    }
    state.drafts.reopenCandidate = null;
    updateRecoveryReopenButton();
    openDraftRecoveryModal({ key, pageId: state.current.id || '', currentSnapshot, draftRecord: record, mode: 'draft' });
  }
  async function maybePromptUnsavedDraftRecovery(promptToken = state.drafts.promptToken) {
    if (!state.db || !state.blank) return;
    if (promptToken !== state.drafts.promptToken) return;
    const key = draftKeyForPage('');
    const record = state.drafts.byKey[key];
    if (!record) return;
    const draftSnapshot = draftSnapshotFromRecord(record);
    if (!shouldPersistDraftSnapshot(draftSnapshot, '')) { await deleteDraftByKey(key); return; }
    const blankSnapshot = { title: '', description: '', html: '' };
    if (sameSnapshot(blankSnapshot, draftSnapshot)) {
      await deleteDraftByKey(key);
      return;
    }
    const signature = record.signature || snapshotSignature(record);
    if (state.drafts.dismissedMap[key] && state.drafts.dismissedMap[key] === signature) {
      state.drafts.reopenCandidate = { key };
      updateRecoveryReopenButton();
      return;
    }
    state.drafts.reopenCandidate = null;
    updateRecoveryReopenButton();
    openDraftRecoveryModal({ key, pageId: '', currentSnapshot: blankSnapshot, draftRecord: record, mode: 'draft' });
  }
  function openRecoveryFromButton() {
    const key = state.drafts.reopenCandidate?.key;
    if (!key) return;
    if (state.blank && !String(key).startsWith('unsaved:')) return;
    const record = state.drafts.byKey[key];
    if (!record) {
      state.drafts.reopenCandidate = null;
      updateRecoveryReopenButton();
      return;
    }
    const currentSnapshot = state.blank ? { title: '', description: '', html: '' } : currentSnapshotFromState();
    openDraftRecoveryModal({ key, pageId: state.current.id || '', currentSnapshot, draftRecord: record, mode: 'draft' });
  }
  async function loadDraftsCache() {
    if (!state.db) return;
    try {
      const rows = (await txGetAll('drafts')).filter(row => row?.id);
      const map = {};
      const lastMap = {};
      for (const row of rows) {
        const normalized = { ...row, signature: row.signature || snapshotSignature(row) };
        map[row.id] = normalized;
        lastMap[row.id] = Number(normalized.updatedAt || 0);
      }
      state.drafts.byKey = map;
      state.drafts.lastAutosaveAtByKey = lastMap;
    } catch (err) {
      log(err.message || String(err));
      state.drafts.byKey = {};
      state.drafts.lastAutosaveAtByKey = {};
    }
    state.drafts.dismissedMap = loadDismissedRecoveryMap();
    updateRecoveryReopenButton();
  }
  function markDirty(value = true) {
    state.dirty = !!value;
    els.dirtyBadge.classList.toggle('hidden', !state.dirty);
    if (state.dirty) scheduleDraftAutosave();
    else clearDraftAutosaveTimer();
  }
  function updateCharCount() { els.charCount.textContent = String(getCodeValue().length) + ' chars'; }
  function updateCurrentFromInputs() { state.current.title = els.titleInput.value; state.current.description = els.descriptionInput.value; state.current.html = getCodeValue(); }

  function showToastNear(target, message) {
    const rect = target.getBoundingClientRect();
    const tip = document.createElement('div');
    tip.className = 'mini-tooltip fixed z-[10000] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg pointer-events-none';
    tip.textContent = message;
    document.body.appendChild(tip);
    const top = Math.max(8, rect.top - 34);
    const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, rect.left + rect.width / 2 - tip.offsetWidth / 2));
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    window.setTimeout(() => tip.remove(), 1300);
  }
  async function copyText(text, target, okMessage) {
    try {
      await navigator.clipboard.writeText(text || '');
      showToastNear(target, okMessage);
    } catch (_) {
      showToastNear(target, t('copyFailed'));
    }
  }

  function showBlankPage() {
    clearPreviewDebounce();
    revokeLocalPreviewObjectUrl();
    state.preview.mode = 'real';
    state.preview.localStatusLabel = '';
    state.preview.activeRequestId = '';
    state.preview.lastLocalDocSignature = '';
    state.preview.lastLocalHtmlSignature = '';
    state.preview.lastLocalUsesTailwind = false;
    state.preview.lastRealUrl = '';
    state.blank = true;
    state.current = { id: '', title: '', description: '', html: '' };
    setCurrentBaseline();
    markDirty(false);
    setCodeValue('');
    els.pageHeader.classList.add('hidden');
    els.splitArea.classList.add('hidden');
    els.welcomeView.classList.remove('hidden');
    els.historyBtn.disabled = true;
    els.deleteBtn.disabled = true;
    if (els.updateAppBtn) els.updateAppBtn.classList.add('hidden');
    els.previewFrame.removeAttribute('src');
    els.previewFrame.srcdoc = '';
    setStatus(t('noPage'));
    updateSidebarActiveState();
    renderSidebarProjects();
    updateRecoveryReopenButton();
  }
  function showWorkspace() {
    state.blank = false;
    els.welcomeView.classList.add('hidden');
    els.pageHeader.classList.remove('hidden');
    els.splitArea.classList.remove('hidden');
    window.setTimeout(() => { try { state.code.editor?.layout(); } catch (_) {} }, 0);
  }
  function setPanelMode(mode, persist = true) {
    state.panelMode = ['both', 'editor', 'preview'].includes(mode) ? mode : 'both';
    document.body.classList.toggle('panel-editor-only', state.panelMode === 'editor');
    document.body.classList.toggle('panel-preview-only', state.panelMode === 'preview');
    [els.quickBothBtn, els.quickEditorBtn, els.quickPreviewBtn].forEach(btn => btn && btn.classList.remove('bg-blue-50','text-blue-700'));
    const activeBtn = state.panelMode === 'editor' ? els.quickEditorBtn : state.panelMode === 'preview' ? els.quickPreviewBtn : els.quickBothBtn;
    if (activeBtn) activeBtn.classList.add('bg-blue-50','text-blue-700');
    if (persist) localStorage.setItem(LS.panelMode, state.panelMode);
    window.setTimeout(() => { try { state.code.editor?.layout(); } catch (_) {} }, 0);
  }

  function renderCurrent() {
    showWorkspace();
    els.titleInput.value = state.current.title || '';
    els.descriptionInput.value = state.current.description || '';
    setCodeValue(state.current.html || '');
    updateCharCount();
    markDirty(false);
    els.historyBtn.disabled = !state.current.id;
    if (els.openViewMenuBtn) els.openViewMenuBtn.disabled = !state.current.id;
    els.deleteBtn.disabled = !state.current.id || !state.isAdmin;
    if (els.updateAppBtn) els.updateAppBtn.classList.toggle('hidden', !(state.appPageId && state.current.id === state.appPageId && !state.blank));
    updateSidebarActiveState();
    updateRecoveryReopenButton();
  }
  function viewUrl(id) { if (!id) return 'about:blank'; return new URL('/api/ai-answer/pages/' + encodeURIComponent(id) + '/view', window.location.origin).href; }
  function localPreviewProbeScript({ requestId, cssHref, baseHref, enableTailwindBrowser }) {
    const payload = JSON.stringify({ source: LOCAL_PREVIEW_MESSAGE_SOURCE, requestId: String(requestId || ''), cssHref: String(cssHref || ''), baseHref: String(baseHref || ''), enableTailwindBrowser: !!enableTailwindBrowser });
    return `<script>(function(){var base=${payload};function send(type,extra){try{parent.postMessage(Object.assign({},base,{type:type,at:Date.now()},extra||{}),'*');}catch(_){}}window.addEventListener('DOMContentLoaded',function(){var link=document.querySelector('link[data-local-preview-tailwind=\"stylesheet\"]');if(link){var done=false;function finish(type){if(done)return;done=true;send(type,{resolvedHref:String(link.href||'')});}link.addEventListener('load',function(){finish('css-load');},{once:true});link.addEventListener('error',function(){finish('css-error');},{once:true});window.setTimeout(function(){finish('css-timeout');},4000);}else if(base.enableTailwindBrowser){send('css-missing');}var browser=document.querySelector('script[data-local-preview-tailwind=\"browser\"]');if(browser){browser.addEventListener('load',function(){send('tailwind-browser-load');},{once:true});browser.addEventListener('error',function(){send('tailwind-browser-error');},{once:true});}});})();<\/script>`;
  }
  function buildLocalPreviewDocument(userHtml, options = {}) {
    const html = String(userHtml || '');
    const baseHref = String(options.baseHref || '');
    const enableTailwindBrowser = !!options.enableTailwindBrowser;
    const injectionParts = ['<meta charset="UTF-8" />'];
    if (baseHref) injectionParts.push(`<base href="${escapeHtmlAttr(baseHref)}" data-local-preview="base" />`);
    if (enableTailwindBrowser) {
      injectionParts.push('<link rel="stylesheet" href="tailwind.css" data-local-preview-tailwind="stylesheet" />');
      // Preview-only: runtime Tailwind for unsaved iframe content. Never saved to Fibery.
      injectionParts.push('<script src="https://cdn.tailwindcss.com" data-local-preview-tailwind="browser"><\/script>');
    }
    injectionParts.push(localPreviewProbeScript({
      requestId: options.requestId,
      cssHref: enableTailwindBrowser ? 'tailwind.css' : '',
      baseHref,
      enableTailwindBrowser
    }));
    const headInjection = injectionParts.join('\n');
    if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>\n${headInjection}\n`);
    if (/<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1>\n<head>\n${headInjection}\n</head>\n`);
    if (/<body[\s>]/i.test(html)) return `<!doctype html>\n<html>\n<head>\n${headInjection}\n</head>\n${html}\n</html>`;
    return `<!doctype html>\n<html>\n<head>\n${headInjection}\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }
  function renderLocalPreview() {
    updateCurrentFromInputs();
    const html = getCodeValue();
    const usesTailwind = htmlUsesTailwindStylesheet(html);
    const baseHref = localPreviewBaseHref();
    const renderSignature = localPreviewRenderSignature(html, baseHref, usesTailwind);
    const htmlSignature = snapshotSignature({ title: '', description: '', html });

    if (state.preview.mode === 'local' && state.preview.lastLocalDocSignature === renderSignature) {
      const statusLabel = localPreviewStatusLabel({ usesTailwind });
      els.previewStatus.textContent = statusLabel;
      state.preview.localStatusLabel = statusLabel;
      state.preview.lastLocalUsesTailwind = usesTailwind;
      setStatus(statusLabel);
      return;
    }

    const requestId = localPreviewRequestId();
    const doc = buildLocalPreviewDocument(html, { requestId, baseHref, enableTailwindBrowser: usesTailwind });
    clearPreviewDebounce();
    revokeLocalPreviewObjectUrl();
    state.preview.mode = 'local';
    state.preview.activeRequestId = requestId;
    state.preview.lastLocalDocSignature = renderSignature;
    state.preview.lastLocalHtmlSignature = htmlSignature;
    state.preview.lastLocalUsesTailwind = usesTailwind;
    const statusLabel = localPreviewStatusLabel({ usesTailwind });
    state.preview.localStatusLabel = statusLabel;
    els.previewStatus.textContent = statusLabel;
    setStatus(statusLabel);

    els.previewFrame.removeAttribute('src');
    els.previewFrame.srcdoc = doc;
  }
  function renderRealPreview({ forceReload = false } = {}) {
    clearPreviewDebounce();
    revokeLocalPreviewObjectUrl();
    state.preview.mode = 'real';
    state.preview.activeRequestId = '';
    state.preview.localStatusLabel = '';
    state.preview.lastLocalDocSignature = '';
    state.preview.lastLocalHtmlSignature = '';
    state.preview.lastLocalUsesTailwind = false;
    if (!state.current.id) {
      els.previewFrame.removeAttribute('src');
      els.previewFrame.srcdoc = '<div style="font-family:system-ui;padding:24px;color:#6b7280;">' + t('noPage') + '</div>';
      els.previewStatus.textContent = '—';
      return;
    }
    const url = viewUrl(state.current.id);
    els.previewStatus.textContent = state.current.title || state.current.id;
    els.previewFrame.removeAttribute('srcdoc');
    if (forceReload && els.previewFrame.src === url) {
      try { els.previewFrame.contentWindow.location.reload(); return; } catch (_) {}
    }
    if (els.previewFrame.src !== url || forceReload) els.previewFrame.src = url;
    state.preview.lastRealUrl = url;
  }
  function scheduleLocalPreviewRefresh() {
    if (state.blank) return;
    if (!shouldUseLocalPreview()) { renderRealPreview(); return; }
    clearPreviewDebounce();
    state.preview.debounceTimer = window.setTimeout(() => {
      state.preview.debounceTimer = null;
      if (!shouldUseLocalPreview()) { renderRealPreview(); return; }
      renderLocalPreview();
    }, state.preview.debounceMs);
  }
  function syncPreviewMode({ immediate = false, forceRealReload = false } = {}) {
    if (state.blank) return;
    if (shouldUseLocalPreview()) {
      if (immediate) { clearPreviewDebounce(); renderLocalPreview(); return; }
      scheduleLocalPreviewRefresh();
      return;
    }
    renderRealPreview({ forceReload: !!forceRealReload });
  }
  function refreshPreview() { renderRealPreview({ forceReload: true }); }

  async function loadPage(id) {
    await flushDraftAutosaveNow();
    const promptToken = ++state.drafts.promptToken;
    setStatus(t('loading'));
    const page = await API.loadPage(id);
    state.current = { id: page.id || id, title: page.title || '', description: page.description || '', html: page.html || '' };
    setCurrentBaseline();
    await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: Date.now() });
    renderCurrent();
    localStorage.setItem(LS.lastPageId, state.current.id);
    syncPreviewMode({ immediate: true });
    setStatus(t('pageLoaded'));
    log(`${t('pageLoaded')}: ${state.current.title || state.current.id}`);
    void maybePromptDraftRecoveryForCurrentPage(promptToken);
  }

  async function confirmAction({ title, message, okText = 'OK', showPreview = false, previewId = '', openPreviewId = '' } = {}) { els.confirmTitle.textContent = title || ''; els.confirmMessage.textContent = message || ''; els.confirmOkBtn.textContent = okText; const previewTargetId = previewId || state.current.id; els.confirmOpenPreviewBtn.dataset.previewId = openPreviewId || previewTargetId || ''; els.deletePreviewWrap.classList.toggle('hidden', !showPreview); if (showPreview && previewTargetId) els.deletePreviewFrame.src = viewUrl(previewTargetId); else { els.deletePreviewFrame.removeAttribute('src'); els.confirmOpenPreviewBtn.dataset.previewId = ''; } els.confirmModal.classList.remove('hidden'); return new Promise(resolve => { state.confirmResolver = resolve; }); }
  function closeConfirm(result) { els.confirmModal.classList.add('hidden'); els.deletePreviewFrame.removeAttribute('src'); els.confirmOpenPreviewBtn.dataset.previewId = ''; const resolver = state.confirmResolver; state.confirmResolver = null; if (resolver) resolver(!!result); }

  async function newPage() { const ok = await confirmAction({ title: t('createPageTitle'), message: t('createPageMessage'), okText: t('create') }); if (!ok) return; await flushDraftAutosaveNow(); state.current = { id: '', title: 'Untitled Page', description: '', html: '' }; setCurrentBaseline(); renderCurrent(); markDirty(true); syncPreviewMode({ immediate: true }); setStatus(t('pageCreated')); els.titleInput.focus(); els.titleInput.select(); }
  async function deleteCurrentPage() { if (!state.current.id) return; const ok = await confirmAction({ title: t('deleteTitle'), message: t('deleteMessage'), okText: t('deleteConfirm'), showPreview: false }); if (!ok) return; try { const oldId = state.current.id; await API.deletePage(oldId); if (localStorage.getItem(LS.lastPageId) === oldId) localStorage.removeItem(LS.lastPageId); await deletePageMeta(oldId); showBlankPage(); await loadSidebarPages({ force: true, reset: true }); setStatus(t('deleted')); log(t('deleted')); } catch (err) { alert(err.message || String(err)); log(err.message || String(err)); } }
  async function deletePageFromList(id, title) { if (!id || !state.isAdmin) return; const ok = await confirmAction({ title: t('deleteTitle'), message: `${t('deleteMessage')}

${title || id}`, okText: t('deleteConfirm'), showPreview: true, previewId: id, openPreviewId: id }); if (!ok) return; try { await API.deletePage(id); if (localStorage.getItem(LS.lastPageId) === id) localStorage.removeItem(LS.lastPageId); await deletePageMeta(id); if (state.current.id === id) showBlankPage(); await loadSidebarPages({ force: true, reset: true }); if (!els.searchModal.classList.contains('hidden')) await loadSearchResults(); if (!els.welcomeSearchResults.classList.contains('hidden')) await loadWelcomeSearchResults(); setStatus(t('deleted')); log(`${t('deleted')}: ${title || id}`); } catch (err) { alert(err.message || String(err)); log(err.message || String(err)); } }

  async function savePage(action = 'save') {
    if (state.saving) return;
    const beforeSavePageId = state.current.id || '';
    await flushDraftAutosaveNow();
    updateCurrentFromInputs();
    if (!state.current.title.trim()) { alert(t('validationTitle')); els.titleInput.focus(); return; }
    state.saving = true;
    els.saveBtn.disabled = true;
    setStatus(t('saving'));
    try {
      const saved = await API.savePage(state.current);
      state.current = { id: saved.id || saved.data?.id || state.current.id, title: saved.title || saved.data?.title || state.current.title, description: saved.description || saved.data?.description || state.current.description, html: saved.html || saved.data?.html || state.current.html };
      localStorage.setItem(LS.lastPageId, state.current.id);
      const now = Date.now();
      await savePageMeta(state.current.id, { title: state.current.title, description: state.current.description, lastOpenedAt: now, lastSavedAt: now });
      const oldDraftKey = draftKeyForPage(beforeSavePageId);
      const savedDraftKey = draftKeyForPage(state.current.id || '');
      await deleteDraftByKey(oldDraftKey);
      if (savedDraftKey !== oldDraftKey) await deleteDraftByKey(savedDraftKey);
      await clearAutosaveHistoryBySignature(state.current.id, snapshotSignature(state.current));
      await saveHistory(action);
      setCurrentBaseline();
      renderCurrent();
      syncPreviewMode({ immediate: true, forceRealReload: true });
      if (state.sidebar.open) await loadSidebarPages({ force: true, reset: true });
      setStatus(t('saved'));
      log(`${t('saved')}: ${state.current.title || state.current.id}`);
    } catch (err) {
      setStatus('Error');
      log(err.message || String(err));
      alert(err.message || String(err));
    } finally {
      state.saving = false;
      els.saveBtn.disabled = !state.isAdmin;
    }
  }
