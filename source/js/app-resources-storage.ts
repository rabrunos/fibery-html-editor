function putResourceRecord(record: ResourceRecord): Promise<void> {
  return txPut('appResources', record);
}

function getResourceRecord(key: string): Promise<ResourceRecord | null> {
  return new Promise((resolve, reject) => {
    const tx = state.db!.transaction('appResources', 'readonly');
    const req = tx.objectStore('appResources').get(key);
    req.onsuccess = () => resolve((req.result as ResourceRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
}

function getAllResourceRecords(): Promise<ResourceRecord[]> {
  return txGetAll<ResourceRecord>('appResources');
}

function deleteResourceRecord(key: string): Promise<void> {
  return txDelete('appResources', key);
}

function getResourceContent(key: string): Promise<string | null> {
  return getResourceRecord(key).then(r => r?.content ?? null);
}

function isResourceRecordCompatible(record: ResourceRecord | null, entry: ResourceManifestEntry): boolean {
  if (!record || record.status !== 'cached') return false;
  if (entry.sha256 && record.sha256 !== entry.sha256) return false;
  if (entry.version && record.version !== entry.version) return false;
  return true;
}

function normalizeResourceRecord(entry: ResourceManifestEntry, partial: Partial<ResourceRecord> = {}): ResourceRecord {
  return { ...entry, status: 'missing', cachedAt: Date.now(), ...partial };
}
