const UPDATE_CHANGELOG_RESOURCE_KEY = 'update/changelog';

async function getCachedUpdateChangelog(): Promise<string | null> {
  try {
    const record = await getResourceRecord(UPDATE_CHANGELOG_RESOURCE_KEY);
    if (!record || record.status !== 'cached' || !record.content) return null;
    return record.content;
  } catch (_) {
    return null;
  }
}

async function cacheUpdateChangelogFromRemote(content: string): Promise<void> {
  const now = Date.now();
  const record = normalizeResourceRecord(
    { key: UPDATE_CHANGELOG_RESOURCE_KEY, kind: 'data', url: UPDATE_REMOTE.changelogUrl, encoding: 'utf-8', required: false },
    { status: 'cached', content, bytes: content.length, cachedAt: now, downloadedAt: now, appVersion: APP_VERSION }
  );
  await putResourceRecord(record);
}

async function loadUpdateChangelogWithCache(): Promise<string | null> {
  return getCachedUpdateChangelog();
}

async function refreshUpdateChangelogResource(options: { automatic?: boolean; source?: string } = {}): Promise<string | null> {
  try {
    const raw = await fetchRemoteText(UPDATE_REMOTE.changelogUrl, { operation: 'updateChangelog', source: options.source || 'update-app', automatic: !!options.automatic });
    const text = String(raw || '').trim();
    if (!text) return '';
    await cacheUpdateChangelogFromRemote(text);
    return text;
  } catch (err) {
    log(`[changelog] remote fetch failed: ${(err as Error).message || String(err)}`);
    return null;
  }
}
