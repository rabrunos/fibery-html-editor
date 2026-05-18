function detectCurrentAppPageId() {
  const viewMatch = window.location.pathname.match(/\/api\/ai-answer\/pages\/([^/]+)\/view\/?$/);
  if (viewMatch) return decodeURIComponent(viewMatch[1]);
  const editorMatch = window.location.pathname.match(/\/api\/ai-answer\/pages\/editor\.html\/?$/);
  if (editorMatch) return new URLSearchParams(window.location.search).get('id') || '';
  return '';
}

const LOCAL_PREVIEW_MESSAGE_SOURCE = 'fibery-html-editor/local-preview';

const state = {
  isAdmin: false, lang: 'en', appPageId: detectCurrentAppPageId(), current: { id: '', title: '', description: '', html: '' }, currentBaseline: { id: '', title: '', description: '', html: '' }, blank: true, dirty: false, db: null, saving: false,
  code: { editor: null, suppress: false, fallback: false }, confirmResolver: null,
  update: { checking: false, applying: false, status: 'idle', remoteVersion: '', remoteChangelog: '', changelogLoading: false },
  preview: { mode: 'real', localObjectUrl: '', localStatusLabel: '', activeRequestId: '', debounceTimer: null, debounceMs: 500, lastLocalDocSignature: '', lastLocalHtmlSignature: '', lastLocalUsesTailwind: false, lastRealUrl: '' },
  sidebar: { open: true, pages: [], loading: false, refreshTimer: null, hasMore: false, limit: 20, visibleLimit: 20, pageCache: {} },
  projects: { rows: [], items: [], pageToProject: {}, itemsByProject: {} },
  search: { debounce: null, query: '', pages: [] }, welcomeSearch: { debounce: null, query: '', pages: [] }, panelMode: 'both', previewFocus: false, pageMeta: {}, context: { pageId: '', pageTitle: '', projectId: '', createProjectTargetPageId: '' },
  drafts: { byKey: {}, autosaveTimer: null, autosaveIntervalMs: 60000, unsavedId: 'local-unsaved-main', lastAutosaveAtByKey: {}, promptToken: 0, diffEditor: null, diffOriginalModel: null, diffModifiedModel: null, fallbackSyncing: false, activeDraftKey: '', activeRecovery: null, reopenCandidate: null, dismissedMap: {} }
};
