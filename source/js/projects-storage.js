function rebuildProjectMaps() {
  const pageToProject = {};
  const itemsByProject = {};
  for (const item of state.projects.items || []) {
    if (!item?.projectId || !item?.pageId) continue;
    pageToProject[item.pageId] = item.projectId;
    if (!itemsByProject[item.projectId]) itemsByProject[item.projectId] = [];
    itemsByProject[item.projectId].push(item);
  }
  for (const items of Object.values(itemsByProject)) items.sort((a, b) => { const ma = getMetaMap()[a.pageId] || {}; const mb = getMetaMap()[b.pageId] || {}; const pinDiff = Number(mb.pinnedAt || 0) - Number(ma.pinnedAt || 0); if (pinDiff) return pinDiff; return Number(a.sortOrder || 0) - Number(b.sortOrder || 0); });
  state.projects.pageToProject = pageToProject;
  state.projects.itemsByProject = itemsByProject;
}
function projectName(projectId) { return (state.projects.rows || []).find(p => p.id === projectId)?.name || t('untitledProject'); }
async function createProject(nameOverride = '') {
  const name = String(nameOverride || els.createProjectNameInput.value || '').trim();
  if (!name) return null;
  const now = Date.now();
  const project = { id: 'project-' + now + '-' + Math.random().toString(36).slice(2, 8), name, createdAt: now, updatedAt: now, sortOrder: now, collapsed: false };
  state.projects.rows.unshift(project);
  await txPut('projects', project);
  rebuildProjectMaps();
  renderSidebarProjects();
  setStatus(t('projectCreated'));
  const targetPageId = state.context.createProjectTargetPageId;
  closeCreateProjectModal();
  if (targetPageId) await movePageToProject(targetPageId, project.id);
  return project;
}
async function toggleProject(projectId) {
  const project = (state.projects.rows || []).find(p => p.id === projectId);
  if (!project) return;
  project.collapsed = !project.collapsed;
  project.updatedAt = Date.now();
  await txPut('projects', project);
  renderSidebarProjects();
}
async function addCurrentPageToProject(projectId) {
  if (!state.current.id || state.blank) { alert(t('currentPageRequired')); return; }
  const existingProjectId = state.projects.pageToProject[state.current.id];
  if (existingProjectId === projectId) { setStatus(t('pageAlreadyInProject')); return; }
  if (existingProjectId) {
    const oldKey = existingProjectId + ':' + state.current.id;
    state.projects.items = state.projects.items.filter(item => item.key !== oldKey);
    await txDelete('projectItems', oldKey);
  }
  const now = Date.now();
  const item = { key: projectId + ':' + state.current.id, projectId, pageId: state.current.id, addedAt: now, sortOrder: now };
  state.projects.items.push(item);
  await txPut('projectItems', item);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  setStatus(t('addedToProject'));
}
async function removePageFromProject(projectId, pageId) {
  const key = projectId + ':' + pageId;
  state.projects.items = state.projects.items.filter(item => item.key !== key);
  await txDelete('projectItems', key);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  setStatus(t('removedFromProject'));
}
async function movePageToProject(pageId, projectId) {
  if (!pageId || !projectId) return;
  const existingProjectId = state.projects.pageToProject[pageId];
  if (existingProjectId === projectId) { setStatus(t('pageAlreadyInProject')); return; }
  if (existingProjectId) {
    const oldKey = existingProjectId + ':' + pageId;
    state.projects.items = state.projects.items.filter(item => item.key !== oldKey);
    await txDelete('projectItems', oldKey);
  }
  const now = Date.now();
  const item = { key: projectId + ':' + pageId, projectId, pageId, addedAt: now, sortOrder: now };
  state.projects.items.push(item);
  await txPut('projectItems', item);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  setStatus(t('pageMovedToProject'));
}
async function renameProject(projectId, nextName) {
  const name = String(nextName || '').trim();
  if (!name) { setStatus(t('renameEmptyIgnored')); return; }
  const project = (state.projects.rows || []).find(p => p.id === projectId);
  if (!project) return;
  project.name = name;
  project.updatedAt = Date.now();
  await txPut('projects', project);
  renderSidebarProjects();
  setStatus(t('projectRenamed'));
}
async function deleteProject(projectId, projectName) {
  const ok = await confirmAction({ title: t('deleteProjectTitle'), message: `${t('deleteProjectMessage')}\n\n${projectName || ''}`, okText: t('deleteProject'), showPreview: false });
  if (!ok) return;
  const itemsToDelete = (state.projects.items || []).filter(item => item.projectId === projectId);
  state.projects.rows = state.projects.rows.filter(project => project.id !== projectId);
  state.projects.items = state.projects.items.filter(item => item.projectId !== projectId);
  await txDelete('projects', projectId);
  for (const item of itemsToDelete) await txDelete('projectItems', item.key);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
}
async function loadProjectsCache() {
  if (!state.db) return;
  try {
    state.projects.rows = (await txGetAll('projects')).filter(project => project?.id);
    state.projects.items = (await txGetAll('projectItems')).filter(item => item?.projectId && item?.pageId);
    rebuildProjectMaps();
  } catch (err) { log(err.message || String(err)); }
}
