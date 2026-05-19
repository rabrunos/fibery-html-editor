function startSidebarAutoRefresh() {
  stopSidebarAutoRefresh();
  if (!state.sidebar.open || !state.sidebar.autoRefreshEnabled) return;
  const intervalMs = Math.max(600000, Number(state.sidebar.autoRefreshIntervalMs || 600000));
  state.sidebar.refreshTimer = window.setTimeout(async () => {
    state.sidebar.refreshTimer = null;
    if (state.sidebar.open && !document.hidden && !state.dirty && !hasRealUnsavedChangesForCurrentPage({ syncFromInputs: false })) {
      await loadSidebarPages({ force: true, reset: false, automatic: true, source: 'sidebar-auto' });
    }
    startSidebarAutoRefresh();
  }, intervalMs);
}
function stopSidebarAutoRefresh() { if (state.sidebar.refreshTimer) { window.clearTimeout(state.sidebar.refreshTimer); state.sidebar.refreshTimer = null; } }
function setSidebarOpen(open, persist = true) {
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
    startSidebarAutoRefresh();
  } else {
    stopSidebarAutoRefresh();
  }
}
