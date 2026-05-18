async function saveHistory(action = 'save') {
  if (!state.current.id || !state.db) return;
  const now = Date.now();
  const record = {
    key: `manual:${state.current.id}:${now}:${Math.random().toString(36).slice(2, 8)}`,
    kind: 'manual',
    pageId: state.current.id,
    title: state.current.title,
    description: state.current.description,
    html: state.current.html,
    signature: snapshotSignature(state.current),
    action,
    createdAt: now
  };
  await txPut('versions', record);
  await enforceHistoryLimit(state.current.id);
}
function getHistory(pageId, kind = 'all') {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction('versions', 'readonly');
    const idx = tx.objectStore('versions').index('pageId');
    const req = idx.getAll(pageId);
    req.onsuccess = () => {
      const rows = (req.result || []).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      if (kind === 'manual') return resolve(rows.filter(row => (row.kind || 'manual') === 'manual'));
      if (kind === 'autosave') return resolve(rows.filter(row => row.kind === 'autosave'));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}
function deleteVersion(key) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction('versions', 'readwrite');
    tx.objectStore('versions').delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function enforceHistoryLimit(pageId) {
  const limit = getManualHistoryLimit();
  if (!limit) return;
  const rows = await getHistory(pageId, 'manual');
  const excess = rows.slice(limit);
  for (const row of excess) await deleteVersion(row.key);
}
async function enforceAutosaveHistoryLimit(pageId) {
  const limit = getAutosaveLimit();
  if (!limit) return;
  const rows = await getHistory(pageId, 'autosave');
  const excess = rows.slice(limit);
  for (const row of excess) await deleteVersion(row.key);
}
async function clearAutosaveHistoryBySignature(pageId, signature) {
  if (!pageId || !signature) return;
  const rows = await getHistory(pageId, 'autosave');
  for (const row of rows) {
    if (String(row.signature || '') === String(signature)) await deleteVersion(row.key);
  }
}
