import type { AppState } from './app';

declare global {
  type ContentSignature = import('./domain').ContentSignature;
  type FiberyPage = import('./domain').FiberyPage;
  type PageId = import('./domain').PageId;
  type PageSnapshot = import('./domain').PageSnapshot;
  type SemverSimple = import('./domain').SemverSimple;
  type LocalStorageKeys = import('./storage').LocalStorageKeys;
  type PageContentCacheRecord = import('./storage').PageContentCacheRecord;

  const state: AppState;

  function log(message: string): void;
  function syncExternalSyncBaselineState(): void;
  function syncBeforeUnloadWarningState(): void;
}

export {};
