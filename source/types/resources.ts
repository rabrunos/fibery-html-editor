export type ResourceKind = 'script' | 'style' | 'font' | 'image' | 'data' | 'other' | 'template';
export type ResourceCacheStatus = 'missing' | 'cached' | 'stale' | 'failed';
export type ResourceEncoding = 'utf-8' | 'base64';

export interface ResourceManifest {
  version: string;
  generatedAt?: number;
  resources: ResourceManifestEntry[];
}

export interface ResourceManifestEntry {
  key: string;
  kind: ResourceKind;
  url: string;
  integrity?: string;
  sha256?: string;
  contentType?: string;
  encoding?: ResourceEncoding;
  version?: string;
  required?: boolean;
}

export interface ResourceRecord extends ResourceManifestEntry {
  status: ResourceCacheStatus;
  content?: string;
  bytes?: number;
  cachedAt: number;
  downloadedAt?: number;
  verifiedAt?: number;
  appVersion?: string;
  errorMessage?: string;
}

export interface ResourceValidationResult {
  valid: boolean;
  reason?: string;
}

export interface RequiredResourceStatus {
  key: string;
  status: ResourceCacheStatus;
  errorMessage?: string;
}

