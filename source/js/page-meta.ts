type PageMetaMap = Record<string, PageMetaRecord>;
type PageMetaPatch = Partial<PageMetaRecord>;
type PageMetaTimeValue = string | number | null | undefined;
type PageMetaPageLike = Partial<FiberyPage> & {
  id: PageId;
  updatedAt?: PageMetaTimeValue;
  modifiedAt?: PageMetaTimeValue;
  modificationDate?: PageMetaTimeValue;
  createdAt?: PageMetaTimeValue;
  creationDate?: PageMetaTimeValue;
};

function getMetaMap(): PageMetaMap {
  return state.pageMeta || {};
}

function setMetaMap(map?: PageMetaMap | null): void {
  state.pageMeta = map || {};
  try {
    localStorage.setItem(LS.pageMeta, JSON.stringify(state.pageMeta));
  } catch (_) {}
}

async function savePageMetaRecord(record?: PageMetaRecord | null): Promise<void> {
  if (!state.db || !record?.id) return;
  await txPut('pageMeta', record);
}

function touchPageMeta(id: PageId | '', data: PageMetaPatch = {}): PageMetaRecord | null {
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
  } as PageMetaRecord;
  map[id] = record;
  setMetaMap(map);
  if (state.db) {
    savePageMetaRecord(record).catch((err: unknown) => {
      const message = typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: unknown }).message : undefined;
      log(String(message || err));
    });
  }
  return record;
}

async function savePageMeta(id: PageId | '', data: PageMetaPatch = {}): Promise<PageMetaRecord | null> {
  const record = touchPageMeta(id, data);
  if (record && state.db) await savePageMetaRecord(record);
  return record;
}

async function deletePageMeta(id: PageId | ''): Promise<void> {
  if (!id) return;
  const map = getMetaMap();
  delete map[id];
  setMetaMap(map);
  if (state.db) await txDelete('pageMeta', id);
  await deleteDraftByKey(draftKeyForPage(id));
  const linked = (state.projects.items || []).filter((item) => item.pageId === id);
  for (const item of linked) {
    if (state.db) await txDelete('projectItems', item.key);
  }
  state.projects.items = (state.projects.items || []).filter((item) => item.pageId !== id);
  rebuildProjectMaps();
}

function pageTime(page: PageMetaPageLike): number {
  const meta = getMetaMap()[page.id] || {};
  const raw = page.updatedAt
    || page.modifiedAt
    || page.modificationDate
    || page.createdAt
    || page.creationDate
    || meta.lastSavedAt
    || meta.lastOpenedAt
    || 0;
  const time = typeof raw === 'number' ? raw : Date.parse(raw as string);
  return Number.isFinite(time) ? time : 0;
}

function groupLabel(time: number): string {
  if (!time) return t('allPages');
  const now = new Date();
  const d = new Date(time);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 86400000;
  if (time >= startToday) return t('today');
  if (time >= startYesterday) return t('yesterday');
  const diff = startToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (diff <= 7 * 86400000) return t('last7');
  if (diff <= 30 * 86400000) return t('last30');
  return t('older');
}

function groupedPages<TPage extends PageMetaPageLike>(pages: TPage[]): Array<[string, TPage[]]> {
  const rows = [...pages].sort((a, b) => pageTime(b) - pageTime(a));
  const groups = new Map<string, TPage[]>();
  for (const page of rows) {
    const label = groupLabel(pageTime(page));
    const group = groups.get(label);
    if (group) group.push(page);
    else groups.set(label, [page]);
  }
  return Array.from(groups.entries());
}

async function loadPageMetaCache(): Promise<void> {
  if (!state.db) return;
  const map: PageMetaMap = {};
  try {
    for (const row of await txGetAll<PageMetaRecord>('pageMeta')) {
      if (row?.id) map[row.id] = row;
    }
  } catch (_) {}
  try {
    const local = JSON.parse(localStorage.getItem(LS.pageMeta) || '{}') || {};
    for (const [id, meta] of Object.entries(local)) {
      if (!map[id] && meta && typeof meta === 'object') {
        const metaRecord = meta as Partial<PageMetaRecord>;
        const record = Object.assign({ id }, meta as Record<string, unknown>, { id: metaRecord.id || id }) as PageMetaRecord;
        map[id] = record;
        await txPut('pageMeta', record);
      }
    }
  } catch (_) {}
  setMetaMap(map);
}
