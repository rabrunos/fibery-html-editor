function styleResourceElementId(key: string): string {
  return `fibery-html-editor-resource-css-${key.replace(/\//g, '-')}`;
}

function injectCachedStyle(key: string, css: string): void {
  const id = styleResourceElementId(key);
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

async function applyCachedStyleResource(key: string): Promise<boolean> {
  try {
    const content = await getResourceContent(key);
    if (!content) return false;
    injectCachedStyle(key, content);
    return true;
  } catch (_) {
    return false;
  }
}

async function ensureCachedStyleResourcesLoaded(): Promise<void> {
  await applyCachedStyleResource('css/app-noncritical');
}
