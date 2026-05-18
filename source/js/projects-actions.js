function openCreateProjectModal(targetPageId = '') {
  state.context.createProjectTargetPageId = targetPageId || '';
  els.createProjectNameInput.value = '';
  els.confirmCreateProjectBtn.disabled = true;
  els.createProjectModal.classList.remove('hidden');
  setTimeout(() => els.createProjectNameInput.focus(), 0);
  closeContextMenus();
}
function closeCreateProjectModal() {
  els.createProjectModal.classList.add('hidden');
  state.context.createProjectTargetPageId = '';
}
