import type { AppState } from './app';

declare global {
  type ContentSignature = import('./domain').ContentSignature;
  type DraftRecord = import('./storage').DraftRecord;
  type FiberyPage = import('./domain').FiberyPage;
  type LocalEmergencyDraft = import('./storage').LocalEmergencyDraft;
  type PageId = import('./domain').PageId;
  type PageSnapshot = import('./domain').PageSnapshot;
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
    [key: string]: unknown;
  };
  const monaco: MonacoGlobal | undefined;
  const state: AppState;

  function closeCreateProjectModal(): void;
  function confirmAction(options?: {
    title?: string;
    message?: string;
    okText?: string;
    showPreview?: boolean;
    previewId?: string;
    openPreviewId?: string;
  }): Promise<boolean>;
  function escapeHtml(v: unknown): string;
  function log(message: string): void;
  function markDirty(value?: boolean): void;
  function rebuildProjectMaps(): void;
  function refreshSidebarFromLocalCache(options?: unknown): void;
  function renderCurrent(): void;
  function renderSidebarProjects(): void;
  function setStatus(text: string): void;
  function syncExternalSyncBaselineState(): void;
  function syncBeforeUnloadWarningState(): void;
  function syncPreviewMode(options?: { immediate?: boolean; forceRealReload?: boolean }): void;
  function t(key: string): string;
  function updateCurrentFromInputs(): void;
}

export {};
