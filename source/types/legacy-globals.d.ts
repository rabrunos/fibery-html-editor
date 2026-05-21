import type { AppState } from './app';

declare global {
  type ContentSignature = import('./domain').ContentSignature;
  type FiberyPage = import('./domain').FiberyPage;
  type PageId = import('./domain').PageId;
  type PageSnapshot = import('./domain').PageSnapshot;
  type HistoryRecord = import('./storage').HistoryRecord;
  type SemverSimple = import('./domain').SemverSimple;
  type LocalStorageKeys = import('./storage').LocalStorageKeys;
  type ManualHistoryKind = import('./storage').ManualHistoryKind;
  type PageContentCacheRecord = import('./storage').PageContentCacheRecord;
  type PageMetaRecord = import('./storage').PageMetaRecord;

  const state: AppState;

  function deleteDraftByKey(key: string): Promise<void>;
  function draftKeyForPage(pageId?: string): string;
  function getManualHistoryLimit(): number;
  function log(message: string): void;
  function rebuildProjectMaps(): void;
  function syncExternalSyncBaselineState(): void;
  function syncBeforeUnloadWarningState(): void;
  function t(key: string): string;
}

export {};
