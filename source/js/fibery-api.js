const API = {
  async checkIsAdmin() { const r = await fetch('/api/ai-answer/pages/is-admin'); if (!r.ok) return false; const data = await r.json(); return !!data.isAdmin; },
  async loadPages({ skip = 0, limit = 21, search = '' } = {}) { const params = new URLSearchParams(); params.set('skip', String(skip)); params.set('limit', String(limit)); if (search) params.set('search', search); const r = await fetch('/api/ai-answer/pages/?' + params.toString()); if (!r.ok) throw new Error('Failed to load pages'); return r.json(); },
  async loadPage(id) { const r = await fetch('/api/ai-answer/pages/' + encodeURIComponent(id)); if (!r.ok) throw new Error('Failed to load page'); return r.json(); },
  async savePage(page) { const isUpdate = !!page.id; const r = await fetch(isUpdate ? '/api/ai-answer/pages/' + encodeURIComponent(page.id) : '/api/ai-answer/pages/', { method: isUpdate ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(page) }); if (!r.ok) { let msg = 'Failed to save page'; try { msg += ': ' + JSON.stringify(await r.json()); } catch (_) {} throw new Error(msg); } return r.json(); },
  async deletePage(id) { const r = await fetch('/api/ai-answer/pages/' + encodeURIComponent(id), { method: 'DELETE' }); if (!r.ok) throw new Error('Failed to delete page'); return { success: true }; }
};
