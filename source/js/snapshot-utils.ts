function snapshotSignature(snapshot?: Partial<PageSnapshot> | null): ContentSignature {
  const raw = `${String(snapshot?.title || '')}\u001f${String(snapshot?.description || '')}\u001f${String(snapshot?.html || '')}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${raw.length}:${(hash >>> 0).toString(16)}`;
}
function normalizeSnapshotText(value?: unknown): string {
  return String(value || '').replace(/\r\n?/g, '\n');
}
function sameSnapshot(a?: Partial<PageSnapshot> | null, b?: Partial<PageSnapshot> | null): boolean {
  return normalizeSnapshotText(a?.title) === normalizeSnapshotText(b?.title)
    && normalizeSnapshotText(a?.description) === normalizeSnapshotText(b?.description)
    && normalizeSnapshotText(a?.html) === normalizeSnapshotText(b?.html);
}
function currentSnapshotFromState(): PageSnapshot {
  return {
    title: String(state.current.title || ''),
    description: String(state.current.description || ''),
    html: String(state.current.html || '')
  };
}
function currentBaselineSnapshot(): PageSnapshot {
  return {
    title: String(state.currentBaseline.title || ''),
    description: String(state.currentBaseline.description || ''),
    html: String(state.currentBaseline.html || '')
  };
}
function setCurrentBaseline(): void {
  state.currentBaseline = {
    id: state.current.id || '',
    title: String(state.current.title || ''),
    description: String(state.current.description || ''),
    html: String(state.current.html || '')
  };
  if (typeof syncExternalSyncBaselineState === 'function') syncExternalSyncBaselineState();
  if (typeof syncBeforeUnloadWarningState === 'function') syncBeforeUnloadWarningState();
}
