export type ResourceKind = 'script' | 'style' | 'font' | 'image' | 'data' | 'other';
export type ResourceCacheStatus = 'missing' | 'cached' | 'stale' | 'failed';

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
  contentType?: string;
  required?: boolean;
}

export interface ResourceRecord extends ResourceManifestEntry {
  status: ResourceCacheStatus;
  content?: string;
  bytes?: number;
  cachedAt: number;
  verifiedAt?: number;
  errorMessage?: string;
}

