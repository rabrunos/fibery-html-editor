function positionFloatingMenu(menu, x, y) {
  menu.classList.remove('hidden');
  const rect = menu.getBoundingClientRect();
  const left = Math.min(Math.max(8, x), window.innerWidth - rect.width - 8);
  const top = Math.min(Math.max(8, y), window.innerHeight - rect.height - 8);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}
function closeContextMenus() {
  els.pageContextMenu.classList.add('hidden');
  els.moveProjectMenu.classList.add('hidden');
  els.projectContextMenu.classList.add('hidden');
  els.editorPanelMenu.classList.add('hidden');
  els.previewPanelMenu.classList.add('hidden');
  document.querySelectorAll('.menu-open').forEach(btn => btn.classList.remove('menu-open'));
}
function shouldToggleFloatingMenu(menu, trigger) {
  const sameTriggerOpen = !!trigger?.classList?.contains('menu-open') && menu && !menu.classList.contains('hidden');
  closeContextMenus();
  if (sameTriggerOpen) return false;
  trigger?.classList?.add('menu-open');
  return true;
}
