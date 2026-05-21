type HistoryKindFilter = 'all' | 'manual' | 'autosave';

async function saveHistory(action = 'save'): Promise<void> {
  if (!state.current.id || !state.db) return;
  const now = Date.now();
  const record: HistoryRecord = {
    key: `manual:${state.current.id}:${now}:${Math.random().toString(36).slice(2, 8)}`,
    kind: 'manual' as ManualHistoryKind,
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

function getHistory(pageId: PageId, kind: HistoryKindFilter = 'all'): Promise<HistoryRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = state.db!.transaction('versions', 'readonly');
    const idx = tx.objectStore('versions').index('pageId');
    const req = idx.getAll(pageId);
    req.onsuccess = () => {
      const rows = ((req.result || []) as HistoryRecord[])
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      if (kind === 'manual') return resolve(rows.filter((row) => (row.kind || 'manual') === 'manual'));
      if (kind === 'autosave') return resolve([]);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

function deleteVersion(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = state.db!.transaction('versions', 'readwrite');
    tx.objectStore('versions').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function enforceHistoryLimit(pageId: PageId): Promise<void> {
  const limit = getManualHistoryLimit();
  if (!limit) return;
  const rows = await getHistory(pageId, 'manual');
  const excess = rows.slice(limit);
  for (const row of excess) await deleteVersion(row.key);
}
