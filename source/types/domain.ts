export type PageId = string;
export type HtmlSource = string;
export type ContentSignature = string;

export interface SemverSimple {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

export interface UpdateRemoteConfig {
  indexHtmlUrl: string;
  changelogUrl: string;
}

export interface FetchRemoteTextOptions {
  operation?: string;
  source?: string;
  automatic?: boolean;
}

export type UpdateCheckStatus =
  | 'checking'
  | 'latest'
  | 'available'
  | 'local-newer'
  | 'invalid'
  | 'error'
  | 'applying';

export type UpdateValidationReason =
  | 'empty'
  | 'too-short'
  | 'not-found'
  | 'not-html'
  | 'not-editor'
  | 'missing-meta-version'
  | 'invalid-meta-version'
  | 'missing-app-version'
  | 'version-mismatch'
  | 'missing-window-version-assign'
  | 'missing-dataset-version-assign'
  | 'invalid-local-version'
  | 'remote-not-newer';

export interface RemoteUpdateValidationFailure {
  ok: false;
  reason: UpdateValidationReason;
  metaVersion?: string;
  appVersionLiteral?: string;
}

export interface RemoteUpdateValidationSuccess {
  ok: true;
  remoteVersion: string;
  localVersion: string;
}

export type RemoteUpdateValidationResult =
  | RemoteUpdateValidationFailure
  | RemoteUpdateValidationSuccess;

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
export interface FiberyCheckAdminOptions extends FiberyApiCallOptions {}
export interface FiberyLoadPageOptions extends FiberyApiCallOptions {}
export interface FiberySavePageOptions extends FiberyApiCallOptions {}
export interface FiberyDeletePageOptions extends FiberyApiCallOptions {}
export interface FiberyLoadPagesOptions extends FiberyApiCallOptions {
  skip?: number;
  limit?: number;
  search?: string;
}
export type FiberyLoadPagesResult = FiberyPage[];

export type PreviewMode = 'real' | 'local' | 'paused';
export type PreviewVisibilityState = 'visible' | 'hidden' | 'paused';
export type UnsavedTransitionChoice = 'cancel' | 'save-open' | 'keep-draft' | 'discard';

export interface QueuePreviewSyncOptions {
  forceRealReload?: boolean;
}

export interface PausePreviewOptions {
  markNeedsSync?: boolean;
}

export interface ResumePreviewOptions {
  immediate?: boolean;
}

export interface SyncPreviewVisibilityOptions extends ResumePreviewOptions {
  markNeedsSync?: boolean;
}

export interface LocalPreviewStatusOptions {
  usesTailwind?: boolean;
}

export interface LocalPreviewDocumentOptions {
  requestId?: string;
  cssHref?: string;
  baseHref?: string;
  enableTailwindBrowser?: boolean;
}

export type LocalPreviewMessageType =
  | 'css-load'
  | 'css-error'
  | 'css-timeout'
  | 'css-missing'
  | 'tailwind-browser-load'
  | 'tailwind-browser-error';

export interface LocalPreviewMessagePayload extends LocalPreviewDocumentOptions {
  source?: string;
  type?: LocalPreviewMessageType | string;
  resolvedHref?: string;
  at?: number;
}

export interface RealPreviewRenderOptions {
  forceReload?: boolean;
}

export interface SyncPreviewModeOptions {
  immediate?: boolean;
  forceRealReload?: boolean;
}

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
