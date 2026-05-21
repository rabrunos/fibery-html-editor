type ProjectItemsByProject = Record<string, ProjectItemRecord[]>;

function rebuildProjectMaps(): void {
  const pageToProject: Record<string, string> = {};
  const itemsByProject: ProjectItemsByProject = {};
  for (const item of state.projects.items || []) {
    if (!item?.projectId || !item?.pageId) continue;
    pageToProject[item.pageId] = item.projectId;
    if (!itemsByProject[item.projectId]) itemsByProject[item.projectId] = [];
    itemsByProject[item.projectId].push(item);
  }
  for (const items of Object.values(itemsByProject)) {
    items.sort((a, b) => {
      const ma = getMetaMap()[a.pageId] || {};
      const mb = getMetaMap()[b.pageId] || {};
      const pinDiff = Number(mb.pinnedAt || 0) - Number(ma.pinnedAt || 0);
      if (pinDiff) return pinDiff;
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    });
  }
  state.projects.pageToProject = pageToProject;
  state.projects.itemsByProject = itemsByProject;
}

function projectName(projectId: string): string {
  return (state.projects.rows || []).find((project) => project.id === projectId)?.name || t('untitledProject');
}

async function createProject(nameOverride = ''): Promise<ProjectRecord | null> {
  const name = String(nameOverride || els.createProjectNameInput.value || '').trim();
  if (!name) return null;
  const now = Date.now();
  const project: ProjectRecord = { id: 'project-' + now + '-' + Math.random().toString(36).slice(2, 8), name, createdAt: now, updatedAt: now, sortOrder: now, collapsed: false };
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

async function toggleProject(projectId: string): Promise<void> {
  const project = (state.projects.rows || []).find((row) => row.id === projectId);
  if (!project) return;
  project.collapsed = !project.collapsed;
  project.updatedAt = Date.now();
  await txPut('projects', project);
  renderSidebarProjects();
}

async function addCurrentPageToProject(projectId: string): Promise<void> {
  if (!state.current.id || state.blank) {
    alert(t('currentPageRequired'));
    return;
  }
  const existingProjectId = state.projects.pageToProject[state.current.id];
  if (existingProjectId === projectId) {
    setStatus(t('pageAlreadyInProject'));
    return;
  }
  if (existingProjectId) {
    const oldKey = existingProjectId + ':' + state.current.id;
    state.projects.items = state.projects.items.filter((item) => item.key !== oldKey);
    await txDelete('projectItems', oldKey);
  }
  const now = Date.now();
  const item: ProjectItemRecord = { key: projectId + ':' + state.current.id, projectId, pageId: state.current.id, addedAt: now, sortOrder: now };
  state.projects.items.push(item);
  await txPut('projectItems', item);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  setStatus(t('addedToProject'));
}

async function removePageFromProject(projectId: string, pageId: PageId): Promise<void> {
  const key = projectId + ':' + pageId;
  state.projects.items = state.projects.items.filter((item) => item.key !== key);
  await txDelete('projectItems', key);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  setStatus(t('removedFromProject'));
}

async function movePageToProject(pageId: PageId | '', projectId: string): Promise<void> {
  if (!pageId || !projectId) return;
  const existingProjectId = state.projects.pageToProject[pageId];
  if (existingProjectId === projectId) {
    setStatus(t('pageAlreadyInProject'));
    return;
  }
  if (existingProjectId) {
    const oldKey = existingProjectId + ':' + pageId;
    state.projects.items = state.projects.items.filter((item) => item.key !== oldKey);
    await txDelete('projectItems', oldKey);
  }
  const now = Date.now();
  const item: ProjectItemRecord = { key: projectId + ':' + pageId, projectId, pageId, addedAt: now, sortOrder: now };
  state.projects.items.push(item);
  await txPut('projectItems', item);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
  setStatus(t('pageMovedToProject'));
}

async function renameProject(projectId: string, nextName: string): Promise<void> {
  const name = String(nextName || '').trim();
  if (!name) {
    setStatus(t('renameEmptyIgnored'));
    return;
  }
  const project = (state.projects.rows || []).find((row) => row.id === projectId);
  if (!project) return;
  project.name = name;
  project.updatedAt = Date.now();
  await txPut('projects', project);
  renderSidebarProjects();
  setStatus(t('projectRenamed'));
}

async function deleteProject(projectId: string, projectNameText?: string): Promise<void> {
  const ok = await confirmAction({ title: t('deleteProjectTitle'), message: `${t('deleteProjectMessage')}\n\n${projectNameText || ''}`, okText: t('deleteProject'), showPreview: false });
  if (!ok) return;
  const itemsToDelete = (state.projects.items || []).filter((item) => item.projectId === projectId);
  state.projects.rows = state.projects.rows.filter((project) => project.id !== projectId);
  state.projects.items = state.projects.items.filter((item) => item.projectId !== projectId);
  await txDelete('projects', projectId);
  for (const item of itemsToDelete) await txDelete('projectItems', item.key);
  rebuildProjectMaps();
  renderSidebarProjects();
  refreshSidebarFromLocalCache();
}

async function loadProjectsCache(): Promise<void> {
  if (!state.db) return;
  try {
    state.projects.rows = (await txGetAll<ProjectRecord>('projects')).filter((project) => project?.id);
    state.projects.items = (await txGetAll<ProjectItemRecord>('projectItems')).filter((item) => item?.projectId && item?.pageId);
    rebuildProjectMaps();
  } catch (err) {
    const message = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: unknown }).message : undefined;
    log(String(message || err));
  }
}
