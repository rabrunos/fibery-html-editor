function startInlineRenameTitle(pageId: string): void {
  closeContextMenus();
  const target = document.querySelector<HTMLElement>(`[data-page-title-id="${CSS.escape(pageId)}"]`);
  if (!target) return;
  const oldValue = target.textContent!.trim();
  target.innerHTML = `<input class="inline-rename-input" value="${escapeHtml(oldValue)}" />`;
  const input = target.querySelector<HTMLInputElement>('input');
  let done = false;
  const commit = async (): Promise<void> => {
    if (done) return;
    done = true;
    const value = input!.value.trim();
    if (!value || value === oldValue) { target.textContent = oldValue; return; }
    try { await renamePage(pageId, value); } catch (err) { alert((err as Error).message || String(err)); target.textContent = oldValue; }
  };
  const cancel = (): void => { done = true; target.textContent = oldValue; };
  input!.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); input!.blur(); } if (e.key === 'Escape') { e.preventDefault(); cancel(); } });
  input!.addEventListener('blur', commit);
  input!.focus(); input!.select();
}
function startInlineRenameProject(projectId: string): void {
  closeContextMenus();
  const target = document.querySelector<HTMLElement>(`[data-project-title-id="${CSS.escape(projectId)}"]`);
  if (!target) return;
  const oldValue = target.textContent!.trim();
  target.innerHTML = `<input class="inline-rename-input" value="${escapeHtml(oldValue)}" />`;
  const input = target.querySelector<HTMLInputElement>('input');
  let done = false;
  const commit = async (): Promise<void> => {
    if (done) return;
    done = true;
    const value = input!.value.trim();
    if (!value || value === oldValue) { target.textContent = oldValue; return; }
    try { await renameProject(projectId, value); } catch (err) { alert((err as Error).message || String(err)); target.textContent = oldValue; }
  };
  const cancel = (): void => { done = true; target.textContent = oldValue; };
  input!.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); input!.blur(); } if (e.key === 'Escape') { e.preventDefault(); cancel(); } });
  input!.addEventListener('blur', commit);
  input!.focus(); input!.select();
}
