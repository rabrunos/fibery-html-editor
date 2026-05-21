type PageContentCacheSnapshotInput = Partial<PageSnapshot & FiberyPage & PageContentCacheRecord>;

interface PageContentCacheOptions {
  pageId?: PageId;
  cachedAt?: number;
  verifiedAt?: number;
  source?: string;
  signature?: ContentSignature;
}

function normalizePageContentCacheRecord(
  snapshot: PageContentCacheSnapshotInput = {},
  options: PageContentCacheOptions = {}
): PageContentCacheRecord {
  const pageId = String(options.pageId ?? snapshot.pageId ?? snapshot.id ?? '').trim();
  if (!pageId) throw new Error('page-content-cache-page-id-required');

  const title = String(snapshot.title || '');
  const description = String(snapshot.description || '');
  const html = String(snapshot.html || '');
  const now = Date.now();
  const cachedAtRaw = options.cachedAt !== undefined ? Number(options.cachedAt) : now;
  const verifiedAtRaw = options.verifiedAt !== undefined ? Number(options.verifiedAt) : cachedAtRaw;
  const cachedAt = Number.isFinite(cachedAtRaw) && cachedAtRaw > 0 ? cachedAtRaw : now;
  const verifiedAt = Number.isFinite(verifiedAtRaw) && verifiedAtRaw > 0 ? verifiedAtRaw : cachedAt;
  const source = String(options.source || 'fibery-load');
  const signature = String(options.signature || snapshotSignature({ title, description, html }));

  return { pageId, title, description, html, signature, cachedAt, verifiedAt, source };
}

async function savePageContentCache(
  snapshot: PageContentCacheSnapshotInput = {},
  options: PageContentCacheOptions = {}
): Promise<PageContentCacheRecord> {
  if (!state.db) throw new Error('page-content-cache-db-unavailable');
  const record = normalizePageContentCacheRecord(snapshot, options);
  await txPut('pageContentCache', record);
  return record;
}

function getPageContentCache(pageId: PageId | '' = ''): Promise<PageContentCacheRecord | null> {
  const normalizedPageId = String(pageId || '').trim();
  if (!normalizedPageId || !state.db) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const tx = state.db!.transaction('pageContentCache', 'readonly');
    const req = tx.objectStore('pageContentCache').get(normalizedPageId);
    req.onsuccess = () => resolve((req.result || null) as PageContentCacheRecord | null);
    req.onerror = () => reject(req.error);
  });
}

async function deletePageContentCache(pageId: PageId | '' = ''): Promise<boolean> {
  const normalizedPageId = String(pageId || '').trim();
  if (!normalizedPageId || !state.db) return false;
  await txDelete('pageContentCache', normalizedPageId);
  return true;
}

async function savePageContentCacheSafe(
  snapshot: PageContentCacheSnapshotInput = {},
  options: PageContentCacheOptions = {}
): Promise<PageContentCacheRecord | null> {
  try {
    return await savePageContentCache(snapshot, options);
  } catch (err) {
    const source = String(options.source || 'unknown');
    const pageId = String(options.pageId ?? snapshot.pageId ?? snapshot.id ?? '').trim() || '-';
    const message = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: unknown }).message : undefined;
    log(`Last Saved Cache update failed (${source}/${pageId}): ${String(message || err || '')}`);
    return null;
  }
}

async function deletePageContentCacheSafe(pageId: PageId | '' = '', options: PageContentCacheOptions = {}): Promise<boolean> {
  try {
    return await deletePageContentCache(pageId);
  } catch (err) {
    const source = String(options.source || 'unknown');
    const normalizedPageId = String(pageId || '').trim() || '-';
    const message = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: unknown }).message : undefined;
    log(`Last Saved Cache delete failed (${source}/${normalizedPageId}): ${String(message || err || '')}`);
    return false;
  }
}
