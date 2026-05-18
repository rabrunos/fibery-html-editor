const $ = (id) => document.getElementById(id);
  const els = {
    sidebar: $('sidebar'), brandBtn: $('brandBtn'), toggleSidebarBtn: $('toggleSidebarBtn'), sidebarCloseIcon: $('sidebarCloseIcon'), sidebarOpenIcon: $('sidebarOpenIcon'), sidebarScroll: $('sidebarScroll'), sidebarProjectsSection: $('sidebarProjectsSection'), sidebarProjectsList: $('sidebarProjectsList'), newProjectBtn: $('newProjectBtn'), sidebarPagesList: $('sidebarPagesList'), refreshSidebarBtn: $('refreshSidebarBtn'), sidebarLoadMoreWrap: $('sidebarLoadMoreWrap'), sidebarLoadMoreBtn: $('sidebarLoadMoreBtn'), searchPagesBtn: $('searchPagesBtn'), sidebarSettingsBtn: $('sidebarSettingsBtn'),
    pageHeader: $('pageHeader'), welcomeView: $('welcomeView'), welcomeNewPageBtn: $('welcomeNewPageBtn'), welcomeSearchInput: $('welcomeSearchInput'), welcomeSearchResults: $('welcomeSearchResults'),
    saveBtn: $('saveBtn'), updateAppBtn: $('updateAppBtn'), refreshBtn: $('refreshBtn'), openViewMenuBtn: $('openViewMenuBtn'), newPageBtn: $('newPageBtn'), historyBtn: $('historyBtn'), deleteBtn: $('deleteBtn'), moreBtn: $('moreBtn'), moreMenu: $('moreMenu'),
    quickBothBtn: $('quickBothBtn'), quickEditorBtn: $('quickEditorBtn'), quickPreviewBtn: $('quickPreviewBtn'),
    titleInput: $('titleInput'), descriptionInput: $('descriptionInput'), dirtyBadge: $('dirtyBadge'), statusText: $('statusText'),
    logToggleBtn: $('logToggleBtn'), logMenuText: $('logMenuText'), settingsModal: $('settingsModal'), closeSettingsBtn: $('closeSettingsBtn'), langSelect: $('langSelect'),
    updateAppModal: $('updateAppModal'), closeUpdateAppBtn: $('closeUpdateAppBtn'), updateInstalledVersionValue: $('updateInstalledVersionValue'), updateAvailableVersionValue: $('updateAvailableVersionValue'), updateCheckStatusText: $('updateCheckStatusText'), updateVerifyAgainBtn: $('updateVerifyAgainBtn'), updateApplyBtn: $('updateApplyBtn'), updateChangelogBox: $('updateChangelogBox'), updateCloseBtn: $('updateCloseBtn'),
    openLastToggle: $('openLastToggle'), versionLimitSelect: $('versionLimitSelect'), autosaveLimitSelect: $('autosaveLimitSelect'), codeEditor: $('codeEditor'), codeEditorFallback: $('codeEditorFallback'), charCount: $('charCount'), copyHtmlBtn: $('copyHtmlBtn'), editorPanelMenuBtn: $('editorPanelMenuBtn'),
    previewFrame: $('previewFrame'), previewStatus: $('previewStatus'), previewPanelMenuBtn: $('previewPanelMenuBtn'), previewFocusBtn: $('previewFocusBtn'), previewFocusExitBtn: $('previewFocusExitBtn'), splitter: $('splitter'), splitArea: $('splitArea'), editorPane: $('editorPane'), previewPane: $('previewPane'), dragOverlay: $('dragOverlay'),
    searchModal: $('searchModal'), closeSearchBtn: $('closeSearchBtn'), globalSearchInput: $('globalSearchInput'), globalSearchResults: $('globalSearchResults'),
    pageContextMenu: $('pageContextMenu'), moveProjectMenu: $('moveProjectMenu'), projectContextMenu: $('projectContextMenu'), editorPanelMenu: $('editorPanelMenu'), previewPanelMenu: $('previewPanelMenu'), createProjectModal: $('createProjectModal'), createProjectNameInput: $('createProjectNameInput'), closeCreateProjectBtn: $('closeCreateProjectBtn'), cancelCreateProjectBtn: $('cancelCreateProjectBtn'), confirmCreateProjectBtn: $('confirmCreateProjectBtn'),
    historyModal: $('historyModal'), closeHistoryBtn: $('closeHistoryBtn'), historyList: $('historyList'), logPanel: $('logPanel'), logBox: $('logBox'), clearLogBtn: $('clearLogBtn'),
    confirmModal: $('confirmModal'), confirmBox: $('confirmBox'), confirmTitle: $('confirmTitle'), confirmMessage: $('confirmMessage'), confirmCancelBtn: $('confirmCancelBtn'), confirmOkBtn: $('confirmOkBtn'), deletePreviewWrap: $('deletePreviewWrap'), deletePreviewFrame: $('deletePreviewFrame'), confirmOpenPreviewBtn: $('confirmOpenPreviewBtn'),
    draftRecoveryModal: $('draftRecoveryModal'), draftRecoveryTitle: $('draftRecoveryTitle'), draftRecoverySubtitle: $('draftRecoverySubtitle'), draftCurrentColumn: $('draftCurrentColumn'), draftLocalColumn: $('draftLocalColumn'), draftCodeDiffLegend: $('draftCodeDiffLegend'), draftCodeDiffMonaco: $('draftCodeDiffMonaco'), draftCodeDiffFallback: $('draftCodeDiffFallback'), draftFallbackCurrentPane: $('draftFallbackCurrentPane'), draftFallbackLocalPane: $('draftFallbackLocalPane'), closeDraftRecoveryBtn: $('closeDraftRecoveryBtn'), restoreDraftBtn: $('restoreDraftBtn'), keepCurrentVersionBtn: $('keepCurrentVersionBtn'), discardDraftBtn: $('discardDraftBtn'),
    reopenRecoveryBtn: $('reopenRecoveryBtn')
  };

  const LS = {
    lang: 'fibery-pro-editor.lang', openLast: 'fibery-pro-editor.openLast', lastPageId: 'fibery-pro-editor.lastPageId', versionLimit: 'fibery-pro-editor.versionLimit', autosaveLimit: 'fibery-pro-editor.autosaveLimit', split: 'fibery-pro-editor.split',
    sidebarOpen: 'fibery-pro-editor.sidebarOpen', pageMeta: 'fibery-pro-editor.pageMeta', panelMode: 'fibery-pro-editor.panelMode', dismissedRecovery: 'fibery-pro-editor.dismissedRecovery'
  };

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
