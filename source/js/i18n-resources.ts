function parseI18nResource(content: string): Record<string, string> | null {
  try {
    const data = JSON.parse(content) as unknown;
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
    const obj = data as Record<string, unknown>;
    for (const v of Object.values(obj)) {
      if (typeof v !== 'string') return null;
    }
    return obj as Record<string, string>;
  } catch (_) {
    return null;
  }
}

function mergeI18nTranslations(lang: string, bundle: Record<string, string>): void {
  if (!I18N[lang]) I18N[lang] = {};
  Object.assign(I18N[lang], bundle);
}

async function loadCachedI18nResources(): Promise<boolean> {
  if (!state.db) return false;
  let loaded = false;
  const enContent = await getResourceContent('i18n/en');
  if (enContent) {
    const bundle = parseI18nResource(enContent);
    if (bundle) { mergeI18nTranslations('en', bundle); loaded = true; }
    else { log('[i18n] i18n/en JSON parse failed'); }
  }
  const ptContent = await getResourceContent('i18n/pt-BR');
  if (ptContent) {
    const bundle = parseI18nResource(ptContent);
    if (bundle) { mergeI18nTranslations('pt-BR', bundle); loaded = true; }
    else { log('[i18n] i18n/pt-BR JSON parse failed'); }
  }
  return loaded;
}

async function applyI18nResourceBundle(): Promise<boolean> {
  return loadCachedI18nResources();
}

async function ensureI18nResourcesLoaded(): Promise<void> {
  try {
    const loaded = await loadCachedI18nResources();
    if (!loaded) log('[i18n] no cached i18n resources available, using fallback');
  } catch (err) {
    log(`[i18n] failed to load cached i18n resources: ${(err as Error).message || String(err)}`);
  }
}
