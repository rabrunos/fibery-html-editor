function diagnosticYesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

function sanitizeDiagnosticText(value: unknown, maxLength = 500): string {
  let text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '-';
  text = text
    .replace(/https?:\/\/\S+/gi, '[url-redacted]')
    .replace(/\/api\/ai-answer\/pages\/[^/\s?#]+/gi, '/api/ai-answer/pages/[redacted]')
    .replace(/\b(?:authorization|bearer|token|cookie|session)\s*[:=]\s*\S+/gi, '[secret-redacted]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id-redacted]');
  if (text.length > maxLength) return `${text.slice(0, maxLength - 1)}…`;
  return text;
}

function recentDiagnosticLogLines(limit = 30): string[] {
  if (!els.logBox) return [];
  return Array.from(els.logBox.children)
    .slice(0, limit)
    .map(node => sanitizeDiagnosticText(node.textContent || '', 320))
    .filter(line => line && line !== '-');
}

function resourcesDiagnosticSummary(): string[] {
  const resources = state.resources;
  const statuses = (resources.statuses || [])
    .slice(0, 12)
    .map(status => `${sanitizeDiagnosticText(status.key, 80)}=${sanitizeDiagnosticText(status.status, 40)}`);
  return [
    `Resources ready: ${diagnosticYesNo(!!resources.ready)}`,
    `Resources loading: ${diagnosticYesNo(!!resources.loading)}`,
    `Resources downloading: ${diagnosticYesNo(!!resources.downloading)}`,
    `Resources missing count: ${(resources.requiredMissing || []).length}`,
    `Resources statuses: ${statuses.length ? statuses.join(', ') : '-'}`,
    `Resources error: ${sanitizeDiagnosticText(resources.errorMessage || '', 240)}`
  ];
}

function buildDiagnosticReport(): string {
  const logs = recentDiagnosticLogLines(30);
  const lines = [
    'Fibery HTML Editor diagnostic report',
    `Generated at: ${new Date().toLocaleString()}`,
    `Version: ${APP_VERSION}`,
    `Language: ${sanitizeDiagnosticText(state.lang, 40)}`,
    `Navigator language: ${sanitizeDiagnosticText(navigator.language || '', 40)}`,
    `User agent: ${sanitizeDiagnosticText(navigator.userAgent || '', 240)}`,
    `Viewport: ${window.innerWidth}x${window.innerHeight}`,
    `Screen: ${window.screen?.width || 0}x${window.screen?.height || 0} @${window.devicePixelRatio || 1}`,
    `Admin mode: ${diagnosticYesNo(!!state.isAdmin)}`,
    `Panel mode: ${sanitizeDiagnosticText(state.panelMode, 40)}`,
    `Sidebar open: ${diagnosticYesNo(!!state.sidebar.open)}`,
    `Preview mode: ${sanitizeDiagnosticText(state.preview.mode, 40)}`,
    `Preview paused: ${diagnosticYesNo(!!state.preview.paused)}`,
    ...resourcesDiagnosticSummary(),
    `Update status: ${sanitizeDiagnosticText(state.update.status, 80)}`,
    `Update checking: ${diagnosticYesNo(!!state.update.checking)}`,
    `Update applying: ${diagnosticYesNo(!!state.update.applying)}`,
    `Update rollbacking: ${diagnosticYesNo(!!state.update.rollbacking)}`,
    `Update remote version: ${sanitizeDiagnosticText(state.update.remoteVersion || '', 40)}`,
    '',
    `Recent log lines (${logs.length}, newest first):`,
    ...(logs.length ? logs.map(line => `- ${line}`) : ['- none'])
  ];
  return `${lines.join('\n')}\n`;
}

async function copyDiagnosticReport(trigger?: HTMLElement): Promise<void> {
  const target = trigger || els.copyDiagnosticBtn || els.logPanel;
  await copyText(buildDiagnosticReport(), target, t('diagnosticCopied'));
}

function openSettings(): void { els.settingsModal.classList.remove('hidden'); els.moreMenu.classList.add('hidden'); }
function closeSettings(): void { els.settingsModal.classList.add('hidden'); }
function toggleLog(): void {
  els.logPanel.classList.toggle('hidden');
  if (els.logMenuText) els.logMenuText.textContent = els.logPanel.classList.contains('hidden') ? t('showLog') : t('hideLog');
  renderApiUsageSummary();
}
function setAdminMode(isAdmin: boolean): void { state.isAdmin = isAdmin; els.newPageBtn.disabled = !isAdmin; if (els.welcomeNewPageBtn) els.welcomeNewPageBtn.disabled = !isAdmin; els.deleteBtn.disabled = !isAdmin || !state.current.id; if (!isAdmin) { setCodeReadOnly(true); els.titleInput.readOnly = true; els.descriptionInput.readOnly = true; setStatus(t('readOnly')); } syncSaveAvailabilityState(); syncCachedOpenCheckNowButtonLabel(); renderUpdateAppPanel(); }
function applyI18n(): void {
  state.lang = preferredLang();
  document.documentElement.lang = state.lang === 'pt-BR' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => { (el as HTMLElement).textContent = t((el as HTMLElement).dataset.i18n || ''); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { (el as HTMLElement).title = t((el as HTMLElement).dataset.i18nTitle || ''); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { (el as HTMLInputElement).placeholder = t((el as HTMLInputElement).dataset.i18nPlaceholder || ''); });
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
  if (typeof renderExternalSyncNotice === 'function') renderExternalSyncNotice();
  syncSaveAvailabilityState();
  syncCachedOpenCheckNowButtonLabel();
  renderApiUsageSummary();
  renderUpdateAppPanel();
  if (typeof renderSettingsUpdateSection === 'function') renderSettingsUpdateSection();
}
