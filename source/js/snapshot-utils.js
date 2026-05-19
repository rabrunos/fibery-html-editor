function snapshotSignature(snapshot) {
  const raw = `${String(snapshot?.title || '')}\u001f${String(snapshot?.description || '')}\u001f${String(snapshot?.html || '')}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${raw.length}:${(hash >>> 0).toString(16)}`;
}
function normalizeSnapshotText(value) {
  return String(value || '').replace(/\r\n?/g, '\n');
}
function sameSnapshot(a, b) {
  return normalizeSnapshotText(a?.title) === normalizeSnapshotText(b?.title)
    && normalizeSnapshotText(a?.description) === normalizeSnapshotText(b?.description)
    && normalizeSnapshotText(a?.html) === normalizeSnapshotText(b?.html);
}
function currentSnapshotFromState() {
  return {
    title: String(state.current.title || ''),
    description: String(state.current.description || ''),
    html: String(state.current.html || '')
  };
}
function currentBaselineSnapshot() {
  return {
    title: String(state.currentBaseline.title || ''),
    description: String(state.currentBaseline.description || ''),
    html: String(state.currentBaseline.html || '')
  };
}
function setCurrentBaseline() {
  state.currentBaseline = {
    id: state.current.id || '',
    title: String(state.current.title || ''),
    description: String(state.current.description || ''),
    html: String(state.current.html || '')
  };
  if (typeof syncBeforeUnloadWarningState === 'function') syncBeforeUnloadWarningState();
}
