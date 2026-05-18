function localPreviewProbeScript({ requestId, cssHref, baseHref, enableTailwindBrowser }) {
  const payload = JSON.stringify({ source: LOCAL_PREVIEW_MESSAGE_SOURCE, requestId: String(requestId || ''), cssHref: String(cssHref || ''), baseHref: String(baseHref || ''), enableTailwindBrowser: !!enableTailwindBrowser });
  return `<script>(function(){var base=${payload};function send(type,extra){try{parent.postMessage(Object.assign({},base,{type:type,at:Date.now()},extra||{}),'*');}catch(_){}}window.addEventListener('DOMContentLoaded',function(){var link=document.querySelector('link[data-local-preview-tailwind=\"stylesheet\"]');if(link){var done=false;function finish(type){if(done)return;done=true;send(type,{resolvedHref:String(link.href||'')});}link.addEventListener('load',function(){finish('css-load');},{once:true});link.addEventListener('error',function(){finish('css-error');},{once:true});window.setTimeout(function(){finish('css-timeout');},4000);}else if(base.enableTailwindBrowser){send('css-missing');}var browser=document.querySelector('script[data-local-preview-tailwind=\"browser\"]');if(browser){browser.addEventListener('load',function(){send('tailwind-browser-load');},{once:true});browser.addEventListener('error',function(){send('tailwind-browser-error');},{once:true});}});})();<\/script>`;
}
function buildLocalPreviewDocument(userHtml, options = {}) {
  const html = String(userHtml || '');
  const baseHref = String(options.baseHref || '');
  const enableTailwindBrowser = !!options.enableTailwindBrowser;
  const injectionParts = ['<meta charset="UTF-8" />'];
  if (baseHref) injectionParts.push(`<base href="${escapeHtmlAttr(baseHref)}" data-local-preview="base" />`);
  if (enableTailwindBrowser) {
    injectionParts.push('<link rel="stylesheet" href="tailwind.css" data-local-preview-tailwind="stylesheet" />');
    // Preview-only: runtime Tailwind for unsaved iframe content. Never saved to Fibery.
    injectionParts.push('<script src="https://cdn.tailwindcss.com" data-local-preview-tailwind="browser"><\/script>');
  }
  injectionParts.push(localPreviewProbeScript({
    requestId: options.requestId,
    cssHref: enableTailwindBrowser ? 'tailwind.css' : '',
    baseHref,
    enableTailwindBrowser
  }));
  const headInjection = injectionParts.join('\n');
  if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>\n${headInjection}\n`);
  if (/<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1>\n<head>\n${headInjection}\n</head>\n`);
  if (/<body[\s>]/i.test(html)) return `<!doctype html>\n<html>\n<head>\n${headInjection}\n</head>\n${html}\n</html>`;
  return `<!doctype html>\n<html>\n<head>\n${headInjection}\n</head>\n<body>\n${html}\n</body>\n</html>`;
}
