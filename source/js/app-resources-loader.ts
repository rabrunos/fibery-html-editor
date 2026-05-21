function resourceManifestUrl(): string {
  return `https://raw.githubusercontent.com/rabrunos/fibery-html-editor/main/support/${APP_VERSION}/resources-manifest.json`;
}

function validateResourceManifestShape(data: unknown): data is ResourceManifest {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return typeof d['version'] === 'string' && Array.isArray(d['resources']);
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

async function checkRequiredResources(): Promise<void> {
  state.resources.loading = true;
  try {
    const manifest = await fetchResourceManifest();
    if (!manifest) { state.resources.loading = false; return; }
    state.resources.manifest = manifest;
    if (!manifest.resources.length) {
      state.resources.ready = true;
      state.resources.loading = false;
      return;
    }
    const missing: string[] = [];
    for (const entry of manifest.resources.filter(r => r.required)) {
      const record = await getResourceRecord(entry.key);
      if (!record || record.status !== 'cached') missing.push(entry.key);
    }
    state.resources.requiredMissing = missing;
    state.resources.ready = true;
  } catch (err) {
    state.resources.errorMessage = (err as Error).message || String(err);
    log(`[resources] boot check failed: ${state.resources.errorMessage}`);
  } finally {
    state.resources.loading = false;
  }
}
