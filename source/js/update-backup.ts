async function createUpdateBackupRecord({
  pageId,
  fromVersion,
  toVersion,
  title,
  description,
  html
}: CreateUpdateBackupOptions): Promise<UpdateBackupRecord> {
  if (!state.db) throw new Error('db-unavailable');
  const createdAt = Date.now();
  const snapshot: PageSnapshot = {
    title: String(title || ''),
    description: String(description || ''),
    html: String(html || '')
  };
  const record: UpdateBackupRecord = {
    key: `update-backup:${pageId}:${createdAt}:${Math.random().toString(36).slice(2, 8)}`,
    kind: 'update-backup',
    source: 'update-backup',
    action: 'update-backup',
    pageId: String(pageId || ''),
    fromVersion: String(fromVersion || ''),
    toVersion: String(toVersion || ''),
    title: snapshot.title,
    description: snapshot.description,
    html: snapshot.html,
    signature: snapshotSignature(snapshot),
    createdAt
  };
  await txPut('versions', record);
  return record;
}
