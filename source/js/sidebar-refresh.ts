function startSidebarAutoRefresh(): void {
  stopSidebarAutoRefresh();
  if (!state.sidebar.open || !state.sidebar.autoRefreshEnabled) return;
  const intervalMs = Math.max(10000, Number(state.sidebar.autoRefreshIntervalMs || 60000));
  state.sidebar.refreshTimer = window.setTimeout(async () => {
    state.sidebar.refreshTimer = null;
    if (state.sidebar.open && !document.hidden) {
      await loadSidebarPages({ remote: true, reset: false, automatic: true, source: 'sidebar-auto', bypassRemoteTtl: true });
    }
    startSidebarAutoRefresh();
  }, intervalMs);
}
function stopSidebarAutoRefresh(): void {
  if (state.sidebar.refreshTimer !== null) {
    window.clearTimeout(state.sidebar.refreshTimer);
    state.sidebar.refreshTimer = null;
  }
}

function shouldRefreshSidebarOnOpen(now: number = Date.now()): boolean {
  if (!state.sidebar.open || document.hidden || state.sidebar.loading) return false;
  const cooldownMs = Math.max(10000, Number(state.sidebar.openRemoteCooldownMs || 10000));
  const lastOpenRemoteLoadAt = Number(state.sidebar.lastOpenRemoteLoadAt || 0);
  const lastRemoteLoadAt = Number(state.sidebar.lastRemoteLoadAt || 0);
  const lastRemoteAttemptAt = Math.max(lastOpenRemoteLoadAt, lastRemoteLoadAt);
  return !lastRemoteAttemptAt || (now - lastRemoteAttemptAt) >= cooldownMs;
}

async function refreshSidebarFromRemoteOnOpen(): Promise<void> {
  if (!shouldRefreshSidebarOnOpen()) return;
  state.sidebar.lastOpenRemoteLoadAt = Date.now();
  await loadSidebarPages({ remote: true, reset: false, automatic: true, source: 'sidebar-open', bypassRemoteTtl: true });
}

function setSidebarOpen(open: boolean, persist = true): void {
  state.sidebar.open = !!open;
  if (els.sidebarScroll) els.sidebarScroll.classList.remove('hidden');
  els.sidebar.style.width = state.sidebar.open ? '288px' : '56px';
  els.sidebar.classList.toggle('sidebar-collapsed', !state.sidebar.open);
  document.querySelectorAll('.sidebar-label').forEach(el => el.classList.toggle('hidden', !state.sidebar.open));
  els.sidebarCloseIcon.classList.toggle('hidden', !state.sidebar.open);
  els.sidebarOpenIcon.classList.toggle('hidden', state.sidebar.open);
  if (persist) localStorage.setItem(LS.sidebarOpen, state.sidebar.open ? '1' : '0');
  if (state.sidebar.open) {
    refreshSidebarFromLocalCache({ reset: !state.sidebar.pages.length });
    void refreshSidebarFromRemoteOnOpen();
    startSidebarAutoRefresh();
  } else {
    stopSidebarAutoRefresh();
  }
}
