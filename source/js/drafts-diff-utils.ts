interface DraftDiffFields {
  title: boolean;
  description: boolean;
  html: boolean;
}

type DraftLineDiffType = 'same' | 'added' | 'removed' | 'changed' | 'empty';

interface DraftLineDiffRow {
  leftNo: number | '';
  rightNo: number | '';
  leftLine: string;
  rightLine: string;
  leftType: DraftLineDiffType;
  rightType: DraftLineDiffType;
}

interface DraftLineDiffStats {
  added: number;
  removed: number;
  changed: number;
}

interface DraftLineDiffResult {
  rows: DraftLineDiffRow[];
  stats: DraftLineDiffStats;
}

function draftUpdatedAtLabel(time: number): string {
  if (!time) return '';
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(state.lang === 'pt-BR' ? 'pt-BR' : 'en-US');
}

function draftDiffMap(
  currentSnapshot: Partial<PageSnapshot> | null | undefined,
  draftSnapshot: Partial<PageSnapshot> | null | undefined
): DraftDiffFields {
  return {
    title: String(currentSnapshot?.title || '') !== String(draftSnapshot?.title || ''),
    description: String(currentSnapshot?.description || '') !== String(draftSnapshot?.description || ''),
    html: String(currentSnapshot?.html || '') !== String(draftSnapshot?.html || '')
  };
}

function draftFieldBadge(isDifferent: boolean): string {
  if (isDifferent) return `<span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">${escapeHtml(t('draftDifferent'))}</span>`;
  return `<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">${escapeHtml(t('draftSame'))}</span>`;
}

function draftMetadataLine(text: string = ''): string {
  const value = String(text || '');
  const textClass = value ? 'text-gray-500' : 'text-transparent';
  return `<div class="mt-1 min-h-[16px] text-[11px] ${textClass}">${escapeHtml(value || ' ')}</div>`;
}

function draftColumnHtml(
  label: string,
  snapshot: Partial<PageSnapshot> | null | undefined,
  diff: DraftDiffFields,
  options: { subtitle?: string } = {}
): string {
  const subtitle = String(options.subtitle || '');
  const titleValue = String(snapshot?.title || '');
  const descriptionValue = String(snapshot?.description || '');
  return `
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div class="border-b border-gray-200 bg-gray-50 px-3 py-2">
        <div class="text-sm font-semibold text-gray-800">${escapeHtml(label)}</div>
        ${draftMetadataLine(subtitle)}
      </div>
      <div class="space-y-3 p-3">
        <div>
          <div class="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500"><span>${escapeHtml(t('draftFieldTitle'))}</span>${draftFieldBadge(!!diff.title)}</div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-800 whitespace-pre-wrap break-words">${escapeHtml(titleValue || '-')}</div>
        </div>
        <div>
          <div class="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500"><span>${escapeHtml(t('draftFieldDescription'))}</span>${draftFieldBadge(!!diff.description)}</div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-700 whitespace-pre-wrap break-words min-h-[56px]">${escapeHtml(descriptionValue || '-')}</div>
        </div>
      </div>
    </div>`;
}

function draftLineCount(value: unknown): string[] {
  const text = String(value || '');
  if (!text) return [];
  return text.replace(/\r\n/g, '\n').split('\n');
}

function buildDraftLineDiffRows(currentHtml: string, draftHtml: string): DraftLineDiffResult {
  const currentLines = draftLineCount(currentHtml);
  const draftLines = draftLineCount(draftHtml);
  let i = 0;
  let j = 0;
  let leftNo = 1;
  let rightNo = 1;
  const rows: DraftLineDiffRow[] = [];
  const stats: DraftLineDiffStats = { added: 0, removed: 0, changed: 0 };

  while (i < currentLines.length || j < draftLines.length) {
    const leftLine: string | null = i < currentLines.length ? currentLines[i] : null;
    const rightLine: string | null = j < draftLines.length ? draftLines[j] : null;

    if (leftLine !== null && rightLine !== null && leftLine === rightLine) {
      rows.push({ leftNo, rightNo, leftLine, rightLine, leftType: 'same', rightType: 'same' });
      i += 1; j += 1; leftNo += 1; rightNo += 1;
      continue;
    }

    const draftLookahead = (leftLine !== null && j + 1 < draftLines.length) ? draftLines[j + 1] : null;
    if (leftLine !== null && draftLookahead !== null && leftLine === draftLookahead) {
      rows.push({ leftNo: '', rightNo, leftLine: '', rightLine: rightLine ?? '', leftType: 'empty', rightType: 'added' });
      j += 1; rightNo += 1; stats.added += 1;
      continue;
    }

    const currentLookahead = (rightLine !== null && i + 1 < currentLines.length) ? currentLines[i + 1] : null;
    if (rightLine !== null && currentLookahead !== null && currentLookahead === rightLine) {
      rows.push({ leftNo, rightNo: '', leftLine: leftLine ?? '', rightLine: '', leftType: 'removed', rightType: 'empty' });
      i += 1; leftNo += 1; stats.removed += 1;
      continue;
    }

    if (leftLine !== null && rightLine !== null) {
      rows.push({ leftNo, rightNo, leftLine, rightLine, leftType: 'changed', rightType: 'changed' });
      i += 1; j += 1; leftNo += 1; rightNo += 1; stats.changed += 1;
      continue;
    }

    if (leftLine !== null) {
      rows.push({ leftNo, rightNo: '', leftLine, rightLine: '', leftType: 'removed', rightType: 'empty' });
      i += 1; leftNo += 1; stats.removed += 1;
      continue;
    }

    rows.push({ leftNo: '', rightNo, leftLine: '', rightLine: rightLine ?? '', leftType: 'empty', rightType: 'added' });
    j += 1; rightNo += 1; stats.added += 1;
  }

  return { rows, stats };
}
