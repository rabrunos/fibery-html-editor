function startSidebarAutoRefresh() { stopSidebarAutoRefresh(); if (!state.sidebar.open) return; state.sidebar.refreshTimer = window.setInterval(() => { if (state.sidebar.open && !document.hidden) loadSidebarPages({ force: true, reset: false }); }, 60000); }
function stopSidebarAutoRefresh() { if (state.sidebar.refreshTimer) { window.clearInterval(state.sidebar.refreshTimer); state.sidebar.refreshTimer = null; } }
function setSidebarOpen(open, persist = true) {
  state.sidebar.open = !!open;
  if (els.sidebarScroll) els.sidebarScroll.classList.remove('hidden');
  els.sidebar.style.width = state.sidebar.open ? '288px' : '56px';
  els.sidebar.classList.toggle('sidebar-collapsed', !state.sidebar.open);
  document.querySelectorAll('.sidebar-label').forEach(el => el.classList.toggle('hidden', !state.sidebar.open));
  els.sidebarCloseIcon.classList.toggle('hidden', !state.sidebar.open);
  els.sidebarOpenIcon.classList.toggle('hidden', state.sidebar.open);
  if (persist) localStorage.setItem(LS.sidebarOpen, state.sidebar.open ? '1' : '0');
  if (state.sidebar.open) { loadSidebarPages({ force: true, reset: !state.sidebar.pages.length }); startSidebarAutoRefresh(); } else { stopSidebarAutoRefresh(); }
}
