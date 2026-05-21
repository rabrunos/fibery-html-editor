import type {
  ContentSignature,
  FiberyPage,
  HtmlSource,
  PageId,
  PageSnapshot
} from './domain';

export type ManualHistoryKind = 'manual';
export type DraftSource = 'draft' | 'emergency' | 'history-manual';
export type UpdateBackupKind = 'update-backup';

export interface PageContentCacheRecord extends PageSnapshot {
  pageId: PageId;
  signature: ContentSignature;
  cachedAt: number;
  verifiedAt: number;
  source: string;
}

export interface DraftRecord extends PageSnapshot {
  id: string;
  key: string;
  pageId: PageId;
  unsavedId: string;
  signature: ContentSignature;
  updatedAt: number;
  baseSavedAt: number;
}

export interface HistoryRecord extends PageSnapshot {
  key: string;
  kind: ManualHistoryKind;
  pageId: PageId;
  signature: ContentSignature;
  action: string;
  createdAt: number;
}

export interface UpdateBackupRecord extends PageSnapshot {
  key: string;
  kind: UpdateBackupKind;
  source: UpdateBackupKind;
  action: UpdateBackupKind;
  pageId: PageId;
  fromVersion: string;
  toVersion: string;
  signature: ContentSignature;
  createdAt: number;
}

export interface PageMetaRecord {
  id: PageId;
  title?: string;
  description?: string;
  lastOpenedAt?: number;
  lastSavedAt?: number;
  pinnedAt?: number;
  archivedAt?: number;
  [key: string]: unknown;
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
  collapsed: boolean;
}

export interface ProjectItemRecord {
  key: string;
  projectId: string;
  pageId: PageId;
  addedAt: number;
  sortOrder: number;
}

export type CachedFiberyPage = FiberyPage & {
  cachedAt?: number;
};

export interface LocalEmergencyDraft extends PageSnapshot {
  pageId: PageId;
  signature: ContentSignature;
  savedAt: number;
  html: HtmlSource;
}

