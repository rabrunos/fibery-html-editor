function positionFloatingMenu(menu: HTMLElement, x: number, y: number): void {
  menu.classList.remove('hidden');
  const rect = menu.getBoundingClientRect();
  const left = Math.min(Math.max(8, x), window.innerWidth - rect.width - 8);
  const top = Math.min(Math.max(8, y), window.innerHeight - rect.height - 8);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}
function closeContextMenus(): void {
  els.pageContextMenu.classList.add('hidden');
  els.moveProjectMenu.classList.add('hidden');
  els.projectContextMenu.classList.add('hidden');
  els.editorPanelMenu.classList.add('hidden');
  els.previewPanelMenu.classList.add('hidden');
  document.querySelectorAll('.menu-open').forEach(btn => btn.classList.remove('menu-open'));
}
function shouldToggleFloatingMenu(menu: HTMLElement | null, trigger: Element | EventTarget | null): boolean {
  const triggerEl = trigger as Element | null;
  const sameTriggerOpen = !!triggerEl?.classList?.contains('menu-open') && menu !== null && !menu.classList.contains('hidden');
  closeContextMenus();
  if (sameTriggerOpen) return false;
  triggerEl?.classList?.add('menu-open');
  return true;
}
