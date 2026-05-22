const TEMPLATE_RESOURCE_KEY = 'templates/app-modals';
const TEMPLATE_RESOURCE_HOST_ID = 'templateResourcesHost';

function getTemplateResourceKeys(): string[] {
  return [TEMPLATE_RESOURCE_KEY];
}

function validateTemplateHtmlSafety(html: string): boolean {
  if (/<script/i.test(html)) return false;
  if (/\bon\w+\s*=/i.test(html)) return false;
  return true;
}

function mountTemplateHtml(key: string, html: string): void {
  const host = document.getElementById(TEMPLATE_RESOURCE_HOST_ID);
  if (!host) return;
  if (host.dataset.loadedKey === key) return;
  host.innerHTML = html;
  host.dataset.loadedKey = key;
}

function injectCachedTemplate(key: string, html: string): void {
  mountTemplateHtml(key, html);
}

async function applyCachedTemplateResource(key: string): Promise<boolean> {
  try {
    const content = await getResourceContent(key);
    if (!content) return false;
    if (!validateTemplateHtmlSafety(content)) {
      log(`[templates] rejected unsafe HTML for key: ${key}`);
      return false;
    }
    mountTemplateHtml(key, content);
    return true;
  } catch (_) {
    return false;
  }
}

async function ensureCachedTemplateResourcesLoaded(): Promise<void> {
  for (const key of getTemplateResourceKeys()) {
    await applyCachedTemplateResource(key);
  }
}
