const RESOURCE_KINDS_VALID = new Set<ResourceKind>(['script', 'style', 'font', 'image', 'data', 'other']);

function resourceManifestUrl(): string {
  return `https://raw.githubusercontent.com/rabrunos/fibery-html-editor/main/support/${APP_VERSION}/resources-manifest.json`;
}

function validateResourceEntryShape(entry: unknown): entry is ResourceManifestEntry {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  return typeof e['key'] === 'string' && e['key'].length > 0
    && typeof e['url'] === 'string' && e['url'].length > 0
    && typeof e['kind'] === 'string' && RESOURCE_KINDS_VALID.has(e['kind'] as ResourceKind);
}

function validateResourceManifestShape(data: unknown): data is ResourceManifest {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d['version'] !== 'string' || !Array.isArray(d['resources'])) return false;
  return (d['resources'] as unknown[]).every(validateResourceEntryShape);
}

async function sha256Hex(text: string): Promise<string> {
  if (!crypto?.subtle) throw new Error('[resources] Web Crypto not available');
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateResourceContentHash(content: string, entry: ResourceManifestEntry): Promise<ResourceValidationResult> {
  if (!entry.sha256) return { valid: true };
  try {
    const computed = await sha256Hex(content);
    if (computed !== entry.sha256) return { valid: false, reason: `sha256 mismatch (key: ${entry.key})` };
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: (err as Error).message || String(err) };
  }
}

async function fetchResourceContent(entry: ResourceManifestEntry): Promise<string> {
  return fetchRemoteText(entry.url, { source: 'resources-download', operation: 'resourceFetch' });
}

async function downloadResourceEntry(entry: ResourceManifestEntry): Promise<ResourceRecord> {
  const now = Date.now();
  try {
    const content = await fetchResourceContent(entry);
    const validation = await validateResourceContentHash(content, entry);
    if (!validation.valid) {
      const record = normalizeResourceRecord(entry, { status: 'failed', cachedAt: now, downloadedAt: now, appVersion: APP_VERSION, errorMessage: validation.reason });
      await putResourceRecord(record);
      return record;
    }
    const record = normalizeResourceRecord(entry, { status: 'cached', content, bytes: content.length, cachedAt: now, downloadedAt: now, verifiedAt: now, appVersion: APP_VERSION });
    await putResourceRecord(record);
    return record;
  } catch (err) {
    const errorMessage = (err as Error).message || String(err);
    const record = normalizeResourceRecord(entry, { status: 'failed', cachedAt: now, downloadedAt: now, appVersion: APP_VERSION, errorMessage });
    await putResourceRecord(record);
    return record;
  }
}

async function fetchResourceManifest(): Promise<ResourceManifest | null> {
  try {
    const text = await fetchRemoteText(resourceManifestUrl(), { source: 'resources-boot' });
    const data = JSON.parse(text) as unknown;
    if (!validateResourceManifestShape(data)) {
      log('[resources] manifest has invalid shape');
      return null;
    }
    return data;
  } catch (err) {
    log(`[resources] failed to fetch manifest: ${(err as Error).message || String(err)}`);
    return null;
  }
}

async function getRequiredResourceStatuses(manifest: ResourceManifest): Promise<RequiredResourceStatus[]> {
  const statuses: RequiredResourceStatus[] = [];
  for (const entry of manifest.resources.filter(e => e.required)) {
    const record = await getResourceRecord(entry.key);
    const compatible = isResourceRecordCompatible(record, entry);
    statuses.push({
      key: entry.key,
      status: compatible ? 'cached' : (record?.status === 'failed' ? 'failed' : record ? 'stale' : 'missing'),
      errorMessage: record?.errorMessage
    });
  }
  return statuses;
}

async function downloadRequiredResources(manifest: ResourceManifest): Promise<RequiredResourceStatus[]> {
  const statuses: RequiredResourceStatus[] = [];
  for (const entry of manifest.resources.filter(e => e.required)) {
    const record = await downloadResourceEntry(entry);
    statuses.push({ key: record.key, status: record.status, errorMessage: record.errorMessage });
  }
  state.resources.lastDownloadedAt = Date.now();
  return statuses;
}

async function ensureRequiredResources(): Promise<void> {
  state.resources.loading = true;
  try {
    const manifest = await fetchResourceManifest();
    state.resources.lastCheckedAt = Date.now();
    if (!manifest) { state.resources.ready = true; return; }
    state.resources.manifest = manifest;
    if (!manifest.resources.length) { state.resources.ready = true; return; }
    const statuses = await getRequiredResourceStatuses(manifest);
    state.resources.statuses = statuses;
    const missing = statuses.filter(s => s.status !== 'cached').map(s => s.key);
    state.resources.requiredMissing = missing;
    if (missing.length > 0) {
      showResourceBootOverlay();
    } else {
      state.resources.ready = true;
    }
  } catch (err) {
    state.resources.errorMessage = (err as Error).message || String(err);
    log(`[resources] ensureRequiredResources failed: ${state.resources.errorMessage}`);
    state.resources.ready = true;
  } finally {
    state.resources.loading = false;
  }
}

async function retryRequiredResourcesDownload(): Promise<void> {
  if (!state.resources.manifest) return;
  state.resources.downloading = true;
  state.resources.errorMessage = '';
  renderResourceBootOverlay();
  try {
    const statuses = await downloadRequiredResources(state.resources.manifest);
    state.resources.statuses = statuses;
    const missing = statuses.filter(s => s.status !== 'cached').map(s => s.key);
    state.resources.requiredMissing = missing;
    const failedKeys = statuses.filter(s => s.status === 'failed').map(s => s.key);
    if (failedKeys.length > 0) {
      state.resources.errorMessage = `Download failed for: ${failedKeys.join(', ')}`;
    }
    if (missing.length === 0) {
      state.resources.ready = true;
      hideResourceBootOverlay();
    }
  } catch (err) {
    state.resources.errorMessage = (err as Error).message || String(err);
    log(`[resources] retry download failed: ${state.resources.errorMessage}`);
  } finally {
    state.resources.downloading = false;
    renderResourceBootOverlay();
  }
}

function checkRequiredResources(): Promise<void> {
  return ensureRequiredResources();
}
