import type { AppState } from './app';

declare global {
  type ConfirmActionOptions = import('./domain').ConfirmActionOptions;
  type ContentSignature = import('./domain').ContentSignature;
  type ConflictCandidate = import('./domain').ConflictCandidate;
  type ConflictResolution = import('./domain').ConflictResolution;
  type DraftRecord = import('./storage').DraftRecord;
  type FiberyApiCallOptions = import('./domain').FiberyApiCallOptions;
  type FiberySaveResult = import('./domain').FiberySaveResult;
  type FiberyPage = import('./domain').FiberyPage;
  type LocalEmergencyDraft = import('./storage').LocalEmergencyDraft;
  type PageId = import('./domain').PageId;
  type PageSnapshot = import('./domain').PageSnapshot;
  type RemoteStatus = import('./domain').RemoteStatus;
  type SavePagePayload = import('./domain').SavePagePayload;
  type SaveBlockedReason = import('./domain').SaveBlockedReason;
  type SyncCurrentSnapshotOptions = import('./domain').SyncCurrentSnapshotOptions;
  type UnsavedChangeCheckOptions = import('./domain').UnsavedChangeCheckOptions;
  type UnsavedTransitionChoice = import('./domain').UnsavedTransitionChoice;
  type HistoryRecord = import('./storage').HistoryRecord;
  type SemverSimple = import('./domain').SemverSimple;
  type LocalStorageKeys = import('./storage').LocalStorageKeys;
  type ManualHistoryKind = import('./storage').ManualHistoryKind;
  type PageContentCacheRecord = import('./storage').PageContentCacheRecord;
  type PageMetaRecord = import('./storage').PageMetaRecord;
  type ProjectItemRecord = import('./storage').ProjectItemRecord;
  type ProjectRecord = import('./storage').ProjectRecord;

  interface MonacoEditorModel { dispose(): void; }
  interface MonacoLineChange {
    originalStartLineNumber: number;
    originalEndLineNumber: number;
    modifiedStartLineNumber: number;
    modifiedEndLineNumber: number;
  }
  interface MonacoDiffEditorInstance {
    dispose(): void;
    setModel(model: { original: MonacoEditorModel; modified: MonacoEditorModel }): void;
    onDidUpdateDiff(callback: () => void): void;
    getLineChanges(): MonacoLineChange[] | null;
    layout(): void;
  }
  interface MonacoEditorNamespace {
    createModel(value: string, language: string): MonacoEditorModel;
    createDiffEditor(element: HTMLElement, options: Record<string, unknown>): MonacoDiffEditorInstance;
  }
  interface MonacoGlobal { editor: MonacoEditorNamespace; }

  const els: {
    createProjectNameInput: HTMLInputElement;
    titleInput: HTMLInputElement;
    descriptionInput: HTMLInputElement;
    reopenRecoveryBtn: HTMLButtonElement;
    draftCodeDiffLegend: HTMLElement;
    draftCodeDiffMonaco: HTMLElement;
    draftCodeDiffFallback: HTMLElement;
    draftFallbackCurrentPane: HTMLElement;
    draftFallbackLocalPane: HTMLElement;
    draftRecoveryModal: HTMLElement;
    draftRecoveryTitle: HTMLElement;
    draftRecoverySubtitle: HTMLElement;
    draftCurrentColumn: HTMLElement;
    draftLocalColumn: HTMLElement;
    restoreDraftBtn: HTMLButtonElement;
    keepCurrentVersionBtn: HTMLButtonElement;
    discardDraftBtn: HTMLButtonElement;
    externalSyncNotice: HTMLElement;
    externalSyncNoticeTitle: HTMLElement;
    externalSyncNoticeMessage: HTMLElement;
    externalSyncDismissBtn: HTMLButtonElement;
    searchModal: HTMLElement;
    welcomeSearchResults: HTMLElement;
    unsavedTransitionModal: HTMLElement;
    confirmModal: HTMLElement;
    confirmTitle: HTMLElement;
    confirmMessage: HTMLElement;
    confirmOkBtn: HTMLButtonElement;
    deletePreviewWrap: HTMLElement;
    deletePreviewFrame: HTMLIFrameElement;
    confirmOpenPreviewBtn: HTMLButtonElement;
    logPanel: HTMLElement;
    externalSyncCheckNowBtn: HTMLButtonElement;
    saveBtn: HTMLButtonElement;
    conflictCompareModal: HTMLElement;
    conflictCompareTitle: HTMLElement;
    conflictCompareSubtitle: HTMLElement;
    conflictKeepLocalBtn: HTMLButtonElement;
    conflictLoadRemoteBtn: HTMLButtonElement;
    conflictCompareOpenBtn: HTMLButtonElement;
    conflictCodeDiffLegend: HTMLElement;
    conflictCodeDiffMonaco: HTMLElement;
    conflictCodeDiffFallback: HTMLElement;
    conflictFallbackLeftPane: HTMLElement;
    conflictFallbackRightPane: HTMLElement;
    conflictLocalColumn: HTMLElement;
    conflictRemoteColumn: HTMLElement;
    [key: string]: unknown;
  };
  const monaco: MonacoGlobal | undefined;
  const state: AppState;

  function closeCreateProjectModal(): void;
  function confirmAction(options?: ConfirmActionOptions): Promise<boolean>;
  function closeConfirm(result: unknown): void;
  function currentBaselineSnapshot(): PageSnapshot;
  function currentSnapshotFromState(): PageSnapshot;
  function clearEmergencyDraftForPage(pageId: PageId | ''): void;
  function clearSearchCaches(): void;
  function deleteDraftByKey(key: string): Promise<void>;
  function deletePageContentCacheSafe(pageId: PageId | '', options?: { source?: string }): Promise<boolean>;
  function deletePageMeta(id: PageId | ''): Promise<void>;
  function draftKeyForPage(pageId?: string): string;
  function escapeHtml(v: unknown): string;
  function flushDraftAutosaveNow(): Promise<void>;
  function getMetaMap(): Record<string, PageMetaRecord>;
  function isSaveBlockedByRemoteVerification(): boolean;
  function loadPageWithCacheAwareFlow(pageId: string, promptToken: number): Promise<void>;
  function loadSearchResults(options?: { localOnly?: boolean }): Promise<void>;
  function loadWelcomeSearchResults(options?: { localOnly?: boolean }): Promise<void>;
  function log(message: string): void;
  function markDirty(value?: boolean): void;
  function markCurrentPageRemoteVerified(options?: { remoteStatus?: RemoteStatus; openedFromCache?: boolean; signature?: string }): void;
  function rebuildProjectMaps(): void;
  function refreshSidebarFromLocalCache(options?: unknown): void;
  function renderCurrent(): void;
  function renderSidebarProjects(): void;
  function hasRealUnsavedChangesForCurrentPage(options?: UnsavedChangeCheckOptions): boolean;
  function resetCachedPageOpenState(pageId?: string): void;
  function resetExternalSyncStateForCurrentPage(pageId?: string): void;
  function saveHistory(action?: string): Promise<void>;
  function savePageContentCacheSafe(
    snapshot?: Partial<PageSnapshot & FiberyPage & PageContentCacheRecord>,
    options?: { pageId?: PageId; cachedAt?: number; verifiedAt?: number; source?: string; signature?: ContentSignature }
  ): Promise<PageContentCacheRecord | null>;
  function savePageMeta(id: PageId | '', data?: Partial<PageMetaRecord>): Promise<PageMetaRecord | null>;
  function saveBlockedReasonForCurrentPage(): SaveBlockedReason;
  function saveCurrentDraftNow(options?: { force?: boolean }): Promise<DraftRecord | null>;
  function setCurrentBaseline(): void;
  function showBlankPage(): void;
  function sameSnapshot(a?: Partial<PageSnapshot> | null, b?: Partial<PageSnapshot> | null): boolean;
  function syncDirtyWithBaseline(): void;
  function canRunAutomaticFiberyCall(source: string): boolean;
  function clearExternalSyncCandidateForCurrentPage(options?: { clearDismissed?: boolean; clearNotified?: boolean }): void;
  function automaticFiberySkipReason(source: string): string;
  function recordPreviewUsage(options?: { operation?: string; source?: string; pageId?: string; automatic?: boolean }): void;
  function setStatus(text: string): void;
  function syncBeforeUnloadWarningState(): void;
  function syncCachedOpenCheckNowButtonLabel(): void;
  function syncCurrentSnapshotBaselineAndDirty(options?: SyncCurrentSnapshotOptions): void;
  function syncExternalSyncPollingState(options?: { forceReschedule?: boolean }): void;
  function syncSaveAvailabilityState(options?: { announce?: boolean }): boolean;
  function syncPreviewMode(options?: { immediate?: boolean; forceRealReload?: boolean }): void;
  function cachePagesForSidebar(rows: FiberyPage[]): void;
  function savePage(action?: string): Promise<boolean>;
  function t(key: string): string;
  function updateCurrentFromInputs(): void;
  function viewUrl(id: string): string;

  const API: {
    loadPage(id: string, options?: FiberyApiCallOptions): Promise<FiberyPage | null>;
    savePage(page: SavePagePayload, options?: FiberyApiCallOptions): Promise<FiberySaveResult>;
    deletePage(id: string, options?: FiberyApiCallOptions): Promise<{ success: boolean }>;
  };
}

export {};
