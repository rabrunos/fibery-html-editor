let _resourceBootEventsInit = false;

function initResourceBootEvents(): void {
  if (_resourceBootEventsInit) return;
  _resourceBootEventsInit = true;
  const btn = document.getElementById('resourceBootRetryBtn');
  if (btn) btn.addEventListener('click', () => { void retryRequiredResourcesDownload(); });
}

function showResourceBootOverlay(): void {
  initResourceBootEvents();
  const overlay = document.getElementById('resourceBootOverlay');
  if (overlay) overlay.classList.remove('hidden');
  renderResourceBootOverlay();
}

function hideResourceBootOverlay(): void {
  const overlay = document.getElementById('resourceBootOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function renderResourceBootOverlay(): void {
  const titleEl = document.getElementById('resourceBootTitle');
  const msgEl = document.getElementById('resourceBootMessage');
  const retryBtn = document.getElementById('resourceBootRetryBtn') as HTMLButtonElement | null;
  const errorEl = document.getElementById('resourceBootError');
  if (!titleEl || !msgEl || !retryBtn || !errorEl) return;

  const { downloading, errorMessage, requiredMissing } = state.resources;

  if (downloading) {
    titleEl.textContent = 'Downloading resources…';
    msgEl.textContent = `Downloading ${requiredMissing.length} required resource(s)…`;
    retryBtn.disabled = true;
  } else if (requiredMissing.length > 0) {
    titleEl.textContent = 'Required resources missing';
    msgEl.textContent = `${requiredMissing.length} required resource(s) need to be downloaded.`;
    retryBtn.disabled = false;
  } else {
    titleEl.textContent = 'Resources ready';
    msgEl.textContent = '';
    retryBtn.disabled = true;
  }

  if (errorMessage) {
    errorEl.classList.remove('hidden');
    errorEl.textContent = errorMessage;
  } else {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
  }
}
