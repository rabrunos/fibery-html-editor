function detectCurrentAppPageId(): string {
  const viewMatch = window.location.pathname.match(/\/api\/ai-answer\/pages\/([^/]+)\/view\/?$/);
  if (viewMatch) return decodeURIComponent(viewMatch[1]);
  const editorMatch = window.location.pathname.match(/\/api\/ai-answer\/pages\/editor\.html\/?$/);
  if (editorMatch) return new URLSearchParams(window.location.search).get('id') || '';
  return '';
}

const LOCAL_PREVIEW_MESSAGE_SOURCE: string = 'fibery-html-editor/local-preview';

const state: AppState = {
  isAdmin: false, lang: 'en', appPageId: detectCurrentAppPageId(), current: { id: '', title: '', description: '', html: '' }, currentBaseline: { id: '', title: '', description: '', html: '' }, blank: true, dirty: false, db: null, saving: false, loadingPage: false,
  code: { editor: null, suppress: false, fallback: false }, confirmResolver: null, unsavedTransitionResolver: null, unsavedTransitionBusy: false, unsavedBeforeUnloadWarningActive: false,
  apiUsage: {
    recentCalls: [], maxRecentCalls: 100, summaryWindowMs: 300000, automaticCooldownMs: 180000, slowCallThresholdMs: 4000, slowModeMs: 300000,
    lastAutomaticFiberyCallAt: 0, slowModeUntil: 0, inFlight: {}
  },
  pageLoads: { inFlightById: {} },
  cachedPageOpen: {
    pageId: '',
    openRequestId: '',
    openedFromCache: false,
    cacheSignature: '',
    remoteStatus: 'idle',
    saveBlockedReason: '',
    remoteCandidate: null,
    lastErrorMessage: '',
    verifiedAt: 0,
    remoteVerificationTimer: null
  },
  externalSync: {
    enabled: true, automaticEnabled: false, checking: false, timer: null, intervalMs: 600000, minCooldownMs: 600000, lastCheckedAt: 0, lastErrorAt: 0, lastErrorMessage: '',
    remoteCandidate: null, remoteSignature: '', baselineSignatureAtDetection: '', localBaselineSignature: '', dismissedSignature: '', lastNotifiedSignature: '', pageId: '', status: 'idle',
    lastSkipReason: '', lastSkipLoggedAt: 0
  },
  update: { checking: false, applying: false, rollbacking: false, status: 'idle', remoteVersion: '', remoteChangelog: '', changelogLoading: false, backupsLoading: false, backups: [] },
  preview: { mode: 'real', paused: false, needsSync: false, pendingForceRealReload: false, localObjectUrl: '', localStatusLabel: '', activeRequestId: '', debounceTimer: null, debounceMs: 500, lastLocalDocSignature: '', lastLocalHtmlSignature: '', lastLocalUsesTailwind: false, lastRealUrl: '', lastLoggedMode: '' },
  sidebar: { open: true, pages: [], loading: false, refreshTimer: null, hasMore: false, limit: 20, visibleLimit: 20, pageCache: {}, lastRemoteLoadAt: 0, remoteCacheTtlMs: 300000, autoRefreshEnabled: false, autoRefreshIntervalMs: 600000 },
  projects: { rows: [], items: [], pageToProject: {}, itemsByProject: {} },
  search: { debounce: null, query: '', pages: [], cache: {}, loading: false, remoteQuery: '' },
  welcomeSearch: { debounce: null, query: '', pages: [], cache: {}, loading: false, remoteQuery: '' },
  panelMode: 'both', previewFocus: false, pageMeta: {},
  context: { pageId: '', pageTitle: '', projectId: '', createProjectTargetPageId: '' },
  drafts: { byKey: {}, autosaveTimer: null, autosaveIntervalMs: 60000, unsavedId: 'local-unsaved-main', lastAutosaveAtByKey: {}, promptToken: 0, diffEditor: null, diffOriginalModel: null, diffModifiedModel: null, fallbackSyncing: false, activeDraftKey: '', activeRecovery: null, reopenCandidate: null, dismissedMap: {} },
  conflictCompare: { diffEditor: null, diffOriginalModel: null, diffModifiedModel: null, diffMode: 'remote', fallbackSyncing: false }
};
