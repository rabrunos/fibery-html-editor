let updateBackupsLoadToken = 0;

function isSafeUpdateBackupRecord(record: UpdateBackupListRecord = {}): boolean {
  const kind = String(record.kind || '').trim();
  const source = String(record.source || '').trim();
  const action = String(record.action || '').trim();
  return kind === 'update-backup' || source === 'update-backup' || action === 'update-backup';
}

function getUpdateBackupTargetPageId(): string {
  return String(state.appPageId || state.current.id || '');
}

function extractVersionFromUpdateBackupHtml(record: UpdateBackupListRecord = {}): string {
  const source = String(record.html || '');
  const metaVersion = extractRemoteVersionFromHtml(source);
  const metaSemver = parseSemverSimple(metaVersion);
  if (metaSemver) return metaSemver.raw;
  const appVersion = parseAppVersionFromHtmlSource(source);
  const appSemver = parseSemverSimple(appVersion);
  return appSemver ? appSemver.raw : '';
}

function formatUpdateBackupVersionLabel(record: UpdateBackupListRecord = {}): string {
  const fromVersion = String(record.fromVersion || '').trim();
  const toVersion = String(record.toVersion || '').trim();
  if (fromVersion && toVersion) return `${fromVersion} -> ${toVersion}`;
  const htmlVersion = extractVersionFromUpdateBackupHtml(record);
  if (fromVersion) return `${t('updateBackupOfVersion')} ${fromVersion}`;
  if (htmlVersion) return `${t('updateBackupOfVersion')} ${htmlVersion}`;
  return t('updateBackupVersionUnknown');
}

function formatUpdateBackupCreatedAt(createdAt: unknown): string {
  const value = Number(createdAt || 0);
  if (!Number.isFinite(value) || value <= 0) return t('updateBackupDateUnknown');
  return new Date(value).toLocaleString(state.lang === 'pt-BR' ? 'pt-BR' : 'en-US');
}

async function getUpdateBackupRecordByKey(key: string = ''): Promise<UpdateBackupListRecord | null> {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) return null;
  const cached = (state.update.backups || []).find((row) => String(row.key || '') === normalizedKey);
  if (cached) return cached;
  const pageId = getUpdateBackupTargetPageId();
  if (!state.db || !pageId) return null;
  const rows = await getHistory(pageId, 'all') as unknown as UpdateBackupListRecord[];
  return rows.find((row) => String(row.key || '') === normalizedKey && isSafeUpdateBackupRecord(row)) || null;
}

async function loadUpdateBackupList(): Promise<void> {
  const pageId = getUpdateBackupTargetPageId();
  const loadToken = ++updateBackupsLoadToken;
  state.update.backupsLoading = true;
  renderUpdateAppPanel();
  try {
    if (!state.db || !pageId) {
      state.update.backups = [];
      return;
    }
    const rows = await getHistory(pageId, 'all') as unknown as UpdateBackupListRecord[];
    if (loadToken !== updateBackupsLoadToken) return;
    state.update.backups = rows
      .filter((row) => isSafeUpdateBackupRecord(row) && String(row.pageId || '') === pageId)
      .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  } catch (err) {
    state.update.backups = [];
    log(`${t('updateBackupsLoadFailed')}: ${String((err as { message?: unknown })?.message || err || '')}`);
  } finally {
    if (loadToken !== updateBackupsLoadToken) return;
    state.update.backupsLoading = false;
    renderUpdateAppPanel();
  }
}

function renderUpdateBackupList(): void {
  if (!els.updateBackupsBox) return;
  els.updateBackupsBox.textContent = '';
  if (state.update.backupsLoading) {
    const loading = document.createElement('div');
    loading.className = 'text-xs text-gray-500';
    loading.textContent = t('updateBackupsLoading');
    els.updateBackupsBox.appendChild(loading);
    return;
  }
  const backups = Array.isArray(state.update.backups) ? state.update.backups : [];
  if (!backups.length) {
    const empty = document.createElement('div');
    empty.className = 'text-xs text-gray-500';
    empty.textContent = t('updateBackupsEmpty');
    els.updateBackupsBox.appendChild(empty);
    return;
  }

  const restoreDisabledReason = getRollbackDisabledReasonText();
  for (const backup of backups) {
    const row = document.createElement('div');
    row.className = 'update-backup-item rounded-lg border border-gray-200 bg-white p-3';

    const top = document.createElement('div');
    top.className = 'flex items-start justify-between gap-3';

    const info = document.createElement('div');
    info.className = 'min-w-0 flex-1';

    const version = document.createElement('div');
    version.className = 'truncate text-sm font-semibold text-gray-900';
    version.textContent = formatUpdateBackupVersionLabel(backup);
    info.appendChild(version);

    const created = document.createElement('div');
    created.className = 'mt-1 text-xs text-gray-500';
    created.textContent = `${t('updateBackupDateLabel')}: ${formatUpdateBackupCreatedAt(backup.createdAt)}`;
    info.appendChild(created);

    if (String(backup.title || '').trim()) {
      const title = document.createElement('div');
      title.className = 'mt-1 truncate text-xs text-gray-500';
      title.textContent = `${t('title')}: ${String(backup.title || '').trim()}`;
      info.appendChild(title);
    }

    const badge = document.createElement('span');
    badge.className = 'update-backup-badge inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800';
    badge.textContent = t('updateBackupLocalBadge');

    top.appendChild(info);
    top.appendChild(badge);
    row.appendChild(top);

    const actions = document.createElement('div');
    actions.className = 'mt-3 flex items-center justify-end';
    const restoreButton = document.createElement('button');
    restoreButton.type = 'button';
    restoreButton.dataset.updateBackupRestoreKey = String(backup.key || '');
    restoreButton.className = 'h-8 rounded border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';
    restoreButton.textContent = t('updateBackupRestore');
    restoreButton.disabled = !!restoreDisabledReason;
    restoreButton.title = restoreDisabledReason || t('updateBackupRestore');
    actions.appendChild(restoreButton);
    row.appendChild(actions);

    els.updateBackupsBox.appendChild(row);
  }
}
