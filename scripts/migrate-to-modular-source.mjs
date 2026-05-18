import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const sourceDir = path.join(rootDir, 'source');

const BODY_SECTION_MARKERS = [
  ['context-menus.html', '<!-- Context menus -->'],
  ['modal-create-project.html', '<!-- Create project modal -->'],
  ['modal-draft-recovery.html', '<!-- Draft recovery modal -->'],
  ['modal-search.html', '<!-- Search modal -->'],
  ['modal-settings.html', '<!-- Settings modal -->'],
  ['modal-update-app.html', '<!-- Update app modal -->'],
  ['modal-history.html', '<!-- History modal -->'],
  ['modal-confirm.html', '<!-- Confirm modal -->'],
  ['panel-log.html', '<!-- Log panel -->']
];

const JS_SPLIT_ANCHORS = [
  ['00-version-api-i18n-base.js', 'const APP_VERSION ='],
  ['01-i18n-en-extended.js', 'Object.assign(I18N.en, {'],
  ['02-i18n-ptbr-extended.js', "Object.assign(I18N['pt-BR'], {"],
  ['03-dom-refs-and-state.js', 'const $ = (id) => document.getElementById(id);'],
  ['04-core-utils-and-update-flow.js', 'function preferredLang()'],
  ['05-page-meta-and-drafts.js', 'function getMetaMap()'],
  ['06-editor-workspace-and-preview.js', 'function setCodeValue(value)'],
  ['07-pages-projects-search.js', 'function normalizePageRows(rows)'],
  ['08-menus-context-and-history.js', 'function positionFloatingMenu(menu, x, y)'],
  ['09-lifecycle-init.js', 'function enterPreviewFocus()']
];

const CSS_SPLIT_ANCHORS = [
  ['00-base.css', null],
  ['01-sidebar-alignment.css', '/* Sidebar icon optical alignment.'],
  ['02-preview-and-diff.css', '.panel-editor-only #previewPane, .panel-editor-only #splitter { display: none !important; }'],
  ['03-update-panel.css', '.update-changelog-version-heading { display:flex; align-items:center; justify-content:space-between; gap:.75rem; border-radius:.75rem; border:1px solid rgb(229 231 235); background:rgb(249 250 251); padding:.5rem .625rem; }'],
  ['04-animations.css', '@keyframes miniTooltip { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }']
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function findAllOccurrences(source, token) {
  const hits = [];
  let cursor = 0;
  while (cursor >= 0 && cursor < source.length) {
    const idx = source.indexOf(token, cursor);
    if (idx < 0) break;
    hits.push(idx);
    cursor = idx + token.length;
  }
  return hits;
}

function splitByOrderedAnchors(source, orderedAnchors, description) {
  const positions = [];
  for (const [name, token] of orderedAnchors) {
    if (!token) {
      positions.push({ name, token: '', index: 0 });
      continue;
    }
    const hits = findAllOccurrences(source, token);
    assert(hits.length === 1, `${description}: anchor "${token}" must appear exactly once (found ${hits.length})`);
    positions.push({ name, token, index: hits[0] });
  }

  for (let i = 1; i < positions.length; i += 1) {
    assert(positions[i].index > positions[i - 1].index, `${description}: anchor order is invalid near "${positions[i].token}"`);
  }

  const chunks = [];
  for (let i = 0; i < positions.length; i += 1) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : source.length;
    const raw = source.slice(start, end).trim();
    assert(raw.length > 0, `${description}: generated empty chunk for ${positions[i].name}`);
    chunks.push({ fileName: positions[i].name, content: `${raw}\n` });
  }
  return chunks;
}

function normalizeLf(text) {
  return String(text).replace(/\r\n/g, '\n');
}

function indentBlock(text, spaces = 4) {
  const indent = ' '.repeat(spaces);
  const normalized = normalizeLf(text).replace(/\n$/, '');
  return normalized.split('\n').map(line => `${indent}${line}`).join('\n');
}

async function writeFileSafe(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

function extractRequired(content, regex, description) {
  const match = content.match(regex);
  assert(match, `Could not extract ${description}`);
  return match;
}

async function main() {
  const rawIndex = await fs.readFile(indexPath, 'utf8');
  const index = normalizeLf(rawIndex);

  const metaVersion = extractRequired(index, /<meta\s+name="fibery-html-editor-version"\s+content="([^"]+)"\s*\/>/, 'meta version')[1].trim();
  const appVersion = extractRequired(index, /const\s+APP_VERSION\s*=\s*'([^']+)'\s*;/, 'APP_VERSION')[1].trim();
  assert(metaVersion === appVersion, `Version mismatch in index.html: meta=${metaVersion}, APP_VERSION=${appVersion}`);

  const bodyOpenMatch = extractRequired(index, /<body[^>]*>/i, 'body opening tag');
  const bodyOpenTag = bodyOpenMatch[0];

  const styleMatch = extractRequired(index, /<style>\n([\s\S]*?)\n\s*<\/style>/i, 'inline style');
  const fullCss = styleMatch[1].replace(/\s+$/, '');
  assert(fullCss.trim().length > 0, 'Inline CSS is empty');

  const bodyStart = bodyOpenMatch.index + bodyOpenMatch[0].length;
  const bodyEnd = index.lastIndexOf('</body>');
  assert(bodyEnd > bodyStart, 'Could not find </body> after body start');
  const bodyInner = index.slice(bodyStart, bodyEnd).replace(/^\n+/, '');

  const monacoTag = '<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>';
  const monacoIndex = bodyInner.indexOf(monacoTag);
  assert(monacoIndex >= 0, 'Could not find Monaco script tag in body');

  const bodyHtmlRaw = bodyInner.slice(0, monacoIndex).replace(/\s+$/, '');
  const afterMonaco = bodyInner.slice(monacoIndex + monacoTag.length);
  const inlineScriptOpen = afterMonaco.indexOf('<script>');
  const inlineScriptClose = afterMonaco.lastIndexOf('</script>');
  assert(inlineScriptOpen >= 0 && inlineScriptClose > inlineScriptOpen, 'Could not find inline <script> block after Monaco tag');

  const inlineScriptWrapped = afterMonaco.slice(inlineScriptOpen + '<script>'.length, inlineScriptClose);
  const iifeStartToken = '(() => {';
  const iifeEndToken = '})();';
  const iifeStart = inlineScriptWrapped.indexOf(iifeStartToken);
  const iifeEnd = inlineScriptWrapped.lastIndexOf(iifeEndToken);
  assert(iifeStart >= 0 && iifeEnd > iifeStart, 'Could not extract main IIFE from inline script');

  let scriptBody = inlineScriptWrapped.slice(iifeStart + iifeStartToken.length, iifeEnd);
  scriptBody = scriptBody.replace(/^\s*'use strict';\s*\n?/m, '');
  scriptBody = scriptBody.replace(/^\n+/, '').replace(/\s+$/, '');
  assert(scriptBody.trim().length > 0, 'Main inline script body is empty');

  const sectionPositions = BODY_SECTION_MARKERS.map(([fileName, marker]) => {
    const idx = bodyHtmlRaw.indexOf(marker);
    assert(idx >= 0, `Missing body marker: ${marker}`);
    return { fileName, marker, idx };
  }).sort((a, b) => a.idx - b.idx);

  const htmlSections = [];
  htmlSections.push({ fileName: 'layout-main.html', content: `${bodyHtmlRaw.slice(0, sectionPositions[0].idx).trim()}\n` });
  for (let i = 0; i < sectionPositions.length; i += 1) {
    const start = sectionPositions[i].idx;
    const end = i + 1 < sectionPositions.length ? sectionPositions[i + 1].idx : bodyHtmlRaw.length;
    const content = bodyHtmlRaw.slice(start, end).trim();
    htmlSections.push({ fileName: sectionPositions[i].fileName, content: `${content}\n` });
  }

  const cssChunks = splitByOrderedAnchors(fullCss, CSS_SPLIT_ANCHORS, 'CSS split');
  const jsChunks = splitByOrderedAnchors(scriptBody, JS_SPLIT_ANCHORS, 'JS split');

  jsChunks[0].content = jsChunks[0].content.replace(/const\s+APP_VERSION\s*=\s*'[^']+'\s*;/, "const APP_VERSION = '__APP_VERSION__';");

  const template = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '  <title>Fibery HTML Editor</title>',
    '  <meta name="fibery-html-editor-version" content="__APP_VERSION__" />',
    '  <meta name="fibery-html-editor-name" content="Fibery HTML Editor" />',
    '  <!-- Keep this version metadata in sync with APP_VERSION for future update checks. -->',
    '  <link rel="stylesheet" href="tailwind.css" />',
    '  <style>',
    '__INLINE_CSS__',
    '  </style>',
    '</head>',
    '__BODY_OPEN_TAG__',
    '__BODY_CONTENT__',
    '<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>',
    '<script>',
    '(() => {',
    "  'use strict';",
    '',
    '__INLINE_JS__',
    '})();',
    '</script>',
    '</body>',
    '</html>',
    ''
  ].join('\n');

  const manifest = {
    version: '8.7.0',
    bodyOpenTag,
    template: 'source/template/index.template.html',
    html: htmlSections.map(section => `source/html/${section.fileName}`),
    css: cssChunks.map(chunk => `source/css/${chunk.fileName}`),
    js: jsChunks.map(chunk => `source/js/${chunk.fileName}`)
  };

  await fs.rm(sourceDir, { recursive: true, force: true });

  for (const section of htmlSections) {
    await writeFileSafe(path.join(sourceDir, 'html', section.fileName), section.content);
  }
  for (const chunk of cssChunks) {
    await writeFileSafe(path.join(sourceDir, 'css', chunk.fileName), chunk.content);
  }
  for (const chunk of jsChunks) {
    await writeFileSafe(path.join(sourceDir, 'js', chunk.fileName), chunk.content);
  }

  await writeFileSafe(path.join(sourceDir, 'template', 'index.template.html'), template);
  await writeFileSafe(path.join(sourceDir, 'config', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const readme = [
    '# Modular Source',
    '',
    'This directory is the canonical development source for Fibery HTML Editor.',
    '',
    '- Edit files under `source/`.',
    '- Build a single deployable `index.html` using `node scripts/build.mjs`.',
    '- Validate generated output using `node scripts/validate-build.mjs <file>`.',
    ''
  ].join('\n');
  await writeFileSafe(path.join(sourceDir, 'README.md'), readme);

  console.log(`Modular source generated from index.html (${metaVersion}) -> source/ (target version ${manifest.version}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
