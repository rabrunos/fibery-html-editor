function preferredLang(): string {
  const saved = localStorage.getItem(LS.lang) || 'auto';
  if (saved !== 'auto') return saved;
  return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
}
function t(key: string): string { return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key; }
function escapeHtml(v: unknown): string { return String(v ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'} as Record<string, string>)[ch]); }
function escapeHtmlAttr(v: unknown): string { return String(v ?? '').replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'} as Record<string, string>)[ch]); }
function getCodeValue(): string { return state.code.editor ? (state.code.editor as MonacoSingleEditorInstance).getValue() : els.codeEditorFallback.value; }
function setStatus(text: string): void { els.statusText.textContent = text; }
function log(message: string): void {
  const time = new Date().toLocaleTimeString(state.lang === 'pt-BR' ? 'pt-BR' : 'en-US');
  const line = document.createElement('div');
  line.textContent = `[${time}] ${message}`;
  els.logBox.prepend(line);
}
function showToastNear(target: Element, message: string): void {
  const rect = target.getBoundingClientRect();
  const tip = document.createElement('div');
  tip.className = 'mini-tooltip fixed z-[10000] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg pointer-events-none';
  tip.textContent = message;
  document.body.appendChild(tip);
  const top = Math.max(8, rect.top - 34);
  const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, rect.left + rect.width / 2 - tip.offsetWidth / 2));
  tip.style.top = top + 'px';
  tip.style.left = left + 'px';
  window.setTimeout(() => tip.remove(), 1300);
}
async function copyText(text: string, target: Element, okMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text || '');
    showToastNear(target, okMessage);
  } catch (_) {
    showToastNear(target, t('copyFailed'));
  }
}
