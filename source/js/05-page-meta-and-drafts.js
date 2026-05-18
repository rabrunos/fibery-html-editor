function getMetaMap() { return state.pageMeta || {}; }
  function setMetaMap(map) { state.pageMeta = map || {}; try { localStorage.setItem(LS.pageMeta, JSON.stringify(state.pageMeta)); } catch (_) {} }
  async function savePageMetaRecord(record) { if (!state.db || !record?.id) return; await txPut('pageMeta', record); }
  function touchPageMeta(id, data = {}) {
    if (!id) return null;
    const map = getMetaMap();
    const previous = map[id] || {};
    const record = {
      ...previous,
      ...data,
      id,
      title: data.title ?? previous.title ?? '',
      description: data.description ?? previous.description ?? '',
      lastOpenedAt: data.lastOpenedAt !== undefined ? data.lastOpenedAt : (previous.lastOpenedAt || 0),
      lastSavedAt: data.lastSavedAt !== undefined ? data.lastSavedAt : (previous.lastSavedAt || 0),
      updatedLocalAt: Date.now()
    };
    map[id] = record;
    setMetaMap(map);
    if (state.db) savePageMetaRecord(record).catch(err => log(err.message || String(err)));
    return record;
  }
  async function savePageMeta(id, data = {}) { const record = touchPageMeta(id, data); if (record && state.db) await savePageMetaRecord(record); return record; }
  async function deletePageMeta(id) { if (!id) return; const map = getMetaMap(); delete map[id]; setMetaMap(map); if (state.db) await txDelete('pageMeta', id); await deleteDraftByKey(draftKeyForPage(id)); const linked = (state.projects.items || []).filter(item => item.pageId === id); for (const item of linked) { if (state.db) await txDelete('projectItems', item.key); } state.projects.items = (state.projects.items || []).filter(item => item.pageId !== id); rebuildProjectMaps(); }
  function pageTime(page) { const meta = getMetaMap()[page.id] || {}; const raw = page.updatedAt || page.modifiedAt || page.modificationDate || page.createdAt || page.creationDate || meta.lastSavedAt || meta.lastOpenedAt || 0; const time = typeof raw === 'number' ? raw : Date.parse(raw); return Number.isFinite(time) ? time : 0; }
  function groupLabel(time) { if (!time) return t('allPages'); const now = new Date(); const d = new Date(time); const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); const startYesterday = startToday - 86400000; if (time >= startToday) return t('today'); if (time >= startYesterday) return t('yesterday'); const diff = startToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); if (diff <= 7 * 86400000) return t('last7'); if (diff <= 30 * 86400000) return t('last30'); return t('older'); }
  function groupedPages(pages) { const rows = [...pages].sort((a,b) => pageTime(b) - pageTime(a)); const groups = new Map(); for (const page of rows) { const label = groupLabel(pageTime(page)); if (!groups.has(label)) groups.set(label, []); groups.get(label).push(page); } return Array.from(groups.entries()); }
