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
