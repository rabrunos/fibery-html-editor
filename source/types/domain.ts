export type PageId = string;
export type HtmlSource = string;
export type ContentSignature = string;

export interface SemverSimple {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

export interface PageSnapshot {
  title: string;
  description: string;
  html: HtmlSource;
}

export interface FiberyPage extends PageSnapshot {
  id: PageId;
}

export type SavePagePayload = FiberyPage;
export interface FiberySaveResult extends Partial<FiberyPage> {
  data?: Partial<FiberyPage> | null;
}
export interface FiberyApiCallOptions {
  source?: string;
  automatic?: boolean;
}

export type PreviewMode = 'real' | 'local';
export type PreviewVisibilityState = 'visible' | 'hidden' | 'paused';
export type UnsavedTransitionChoice = 'cancel' | 'save-open' | 'keep-draft' | 'discard';

export interface UnsavedChangeCheckOptions {
  syncFromInputs?: boolean;
}

export interface SyncCurrentSnapshotOptions {
  alignBaseline?: boolean;
}

export interface ConfirmActionOptions {
  title?: string;
  message?: string;
  okText?: string;
  showPreview?: boolean;
  previewId?: PageId | '';
  openPreviewId?: PageId | '';
}

export type RemoteStatus =
  | 'idle'
  | 'checking'
  | 'verified'
  | 'stale-applied'
  | 'failed'
  | 'conflict'
  | 'conflict-resolved-local';

export type SaveBlockedReason = '' | 'pending' | 'failed' | 'conflict';

export interface ConflictCandidate extends FiberyPage {
  signature: ContentSignature;
  detectedAt: number;
}

export type ConflictResolution = 'keep-local' | 'load-remote';
