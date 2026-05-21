import type { AppState } from './app';

declare global {
  type ContentSignature = import('./domain').ContentSignature;
  type PageSnapshot = import('./domain').PageSnapshot;
  type SemverSimple = import('./domain').SemverSimple;
  type LocalStorageKeys = import('./storage').LocalStorageKeys;

  const state: AppState;

  function syncExternalSyncBaselineState(): void;
  function syncBeforeUnloadWarningState(): void;
}

export {};
