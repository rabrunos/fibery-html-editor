import type {
  ConflictCandidate,
  FiberyPage,
  PreviewMode,
  RemoteStatus,
  SaveBlockedReason,
  UpdateCheckStatus,
  UnsavedTransitionChoice
} from './domain';
import type {
  DraftRecord,
  PageContentCacheRecord,
  PageMetaRecord,
  ProjectItemRecord,
  ProjectRecord,
  UpdateBackupListRecord
} from './storage';
import type { RequiredResourceStatus, ResourceManifest } from './resources';

export type AppLanguage = 'en' | 'pt-BR';
export type PanelMode = 'both' | 'editor' | 'preview';
export type UpdateStatus = 'idle' | UpdateCheckStatus;
export type ExternalSyncStatus = 'idle' | 'checking' | 'current' | 'changed' | 'error';
export type ApiUsageKind = 'fibery-api' | 'fibery-preview' | 'github-remote' | 'unknown';
export type ApiUsageOperation = string;

export interface ApiUsageMeta {
  kind?: ApiUsageKind | string;
  operation?: ApiUsageOperation;
  source?: string;
  pageId?: string;
  automatic?: boolean;
}

export interface ApiUsageCall {
  kind: ApiUsageKind | string;
  operation: ApiUsageOperation;
  source: string;
  pageId: string;
  automatic: boolean;
  success: boolean;
  durationMs: number;
  timestamp: number;
  error: string;
}

export interface ApiUsageEntry extends ApiUsageMeta {
  timestamp?: number;
  durationMs?: number;
  success?: boolean;
  error?: unknown;
}

export type ApiUsageRecordedEntry = ApiUsageCall;
export type ApiUsageTask<TResult = unknown> = () => Promise<TResult>;

export interface AppState {
  isAdmin: boolean;
  lang: AppLanguage | string;
  appPageId: string;
  current: FiberyPage;
  currentBaseline: FiberyPage;
  blank: boolean;
  dirty: boolean;
  db: IDBDatabase | null;
  saving: boolean;
  loadingPage: boolean;
  code: {
    editor: unknown;
    suppress: boolean;
    fallback: boolean;
  };
  confirmResolver: ((value: boolean) => void) | null;
  unsavedTransitionResolver: ((value: UnsavedTransitionChoice) => void) | null;
  unsavedTransitionBusy: boolean;
  unsavedBeforeUnloadWarningActive: boolean;
  apiUsage: {
    recentCalls: ApiUsageCall[];
    maxRecentCalls: number;
    summaryWindowMs: number;
    automaticCooldownMs: number;
    slowCallThresholdMs: number;
    slowModeMs: number;
    lastAutomaticFiberyCallAt: number;
    slowModeUntil: number;
    inFlight: Record<string, number>;
  };
  pageLoads: {
    inFlightById: Record<string, Promise<unknown> | undefined>;
  };
  cachedPageOpen: {
    pageId: string;
    openRequestId: string;
    openedFromCache: boolean;
    cacheSignature: string;
    remoteStatus: RemoteStatus;
    saveBlockedReason: SaveBlockedReason;
    remoteCandidate: ConflictCandidate | null;
    lastErrorMessage: string;
    verifiedAt: number;
    remoteVerificationTimer: number | null;
  };
  externalSync: {
    enabled: boolean;
    automaticEnabled: boolean;
    checking: boolean;
    timer: number | null;
    intervalMs: number;
    minCooldownMs: number;
    lastCheckedAt: number;
    lastErrorAt: number;
    lastErrorMessage: string;
    remoteCandidate: ConflictCandidate | null;
    remoteSignature: string;
    baselineSignatureAtDetection: string;
    localBaselineSignature: string;
    dismissedSignature: string;
    lastNotifiedSignature: string;
    pageId: string;
    status: ExternalSyncStatus | string;
    lastSkipReason: string;
    lastSkipLoggedAt: number;
  };
  update: {
    checking: boolean;
    applying: boolean;
    rollbacking: boolean;
    status: UpdateStatus | string;
    remoteVersion: string;
    remoteChangelog: string;
    changelogLoading: boolean;
    backupsLoading: boolean;
    backups: UpdateBackupListRecord[];
  };
  preview: {
    mode: PreviewMode;
    paused: boolean;
    needsSync: boolean;
    pendingForceRealReload: boolean;
    localObjectUrl: string;
    localStatusLabel: string;
    activeRequestId: string;
    debounceTimer: number | null;
    debounceMs: number;
    lastLocalDocSignature: string;
    lastLocalHtmlSignature: string;
    lastLocalUsesTailwind: boolean;
    lastRealUrl: string;
    lastLoggedMode: string;
  };
  sidebar: {
    open: boolean;
    pages: FiberyPage[];
    loading: boolean;
    refreshTimer: number | null;
    hasMore: boolean;
    limit: number;
    visibleLimit: number;
    pageCache: Record<string, FiberyPage | PageContentCacheRecord>;
    lastRemoteLoadAt: number;
    lastOpenRemoteLoadAt: number;
    remoteCacheTtlMs: number;
    openRemoteCooldownMs: number;
    autoRefreshEnabled: boolean;
    autoRefreshIntervalMs: number;
  };
  projects: {
    rows: ProjectRecord[];
    items: ProjectItemRecord[];
    pageToProject: Record<string, string>;
    itemsByProject: Record<string, ProjectItemRecord[]>;
  };
  search: SearchState;
  welcomeSearch: SearchState;
  panelMode: PanelMode;
  previewFocus: boolean;
  pageMeta: Record<string, PageMetaRecord>;
  context: {
    pageId: string;
    pageTitle: string;
    projectId: string;
    createProjectTargetPageId: string;
  };
  drafts: {
    byKey: Record<string, DraftRecord>;
    autosaveTimer: number | null;
    autosaveIntervalMs: number;
    unsavedId: string;
    lastAutosaveAtByKey: Record<string, number>;
    promptToken: number;
    diffEditor: unknown;
    diffOriginalModel: unknown;
    diffModifiedModel: unknown;
    fallbackSyncing: boolean;
    activeDraftKey: string;
    activeRecovery: unknown;
    reopenCandidate: unknown;
    dismissedMap: Record<string, string>;
  };
  conflictCompare: {
    diffEditor: unknown;
    diffOriginalModel: unknown;
    diffModifiedModel: unknown;
    diffMode: 'remote';
    fallbackSyncing: boolean;
  };
  resources: {
    loading: boolean;
    ready: boolean;
    downloading: boolean;
    errorMessage: string;
    requiredMissing: string[];
    manifest: ResourceManifest | null;
    statuses: RequiredResourceStatus[];
    lastCheckedAt: number;
    lastDownloadedAt: number;
  };
}

export interface SearchState {
  debounce: number | null;
  query: string;
  pages: FiberyPage[];
  cache: Record<string, FiberyPage[]>;
  loading: boolean;
  remoteQuery: string;
}
