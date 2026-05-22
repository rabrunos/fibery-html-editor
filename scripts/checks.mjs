import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`  FAIL  ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`    ok  ${message}`);
}

function warn(message) {
  console.warn(`  WARN  ${message}`);
}

async function readText(rel) {
  const content = await fs.readFile(path.join(rootDir, rel), 'utf8');
  return content.replace(/\r\n/g, '\n');
}

async function checkVersionAlignment() {
  const manifest = JSON.parse(await readText('source/config/manifest.json'));
  const pkg = JSON.parse(await readText('package.json'));
  if (manifest.version !== pkg.version) {
    fail(`Version mismatch: manifest.json=${manifest.version}, package.json=${pkg.version}`);
  }
  ok(`Version aligned: ${manifest.version}`);
  return manifest.version;
}

async function checkChangelogVersion(expectedVersion) {
  const changelog = await readText('CHANGELOG.md');
  const first = changelog.match(/^## \[([^\]]+)\]/m);
  if (!first) {
    fail('CHANGELOG.md: no version entry found');
  }
  if (first[1] !== expectedVersion) {
    fail(`CHANGELOG.md: top entry is [${first[1]}], expected [${expectedVersion}] — update the changelog`);
  }
  ok(`CHANGELOG.md top entry is ${expectedVersion}`);
}

async function checkNoUnexpectedJs() {
  const manifest = JSON.parse(await readText('source/config/manifest.json'));
  const FORBIDDEN_JS = new Set(['i18n-en.js', 'i18n-pt-br.js']);
  const unexpected = (manifest.js || []).filter(rel => rel.endsWith('.js'));
  const forbidden = unexpected.filter(rel => FORBIDDEN_JS.has(path.basename(rel)));
  if (forbidden.length > 0) {
    fail(`Removed i18n JS files still listed in manifest: ${forbidden.map(r => path.basename(r)).join(', ')}`);
  }
  if (unexpected.length > 0) {
    fail(`Unexpected .js files in manifest (migrate to .ts): ${unexpected.map(r => path.basename(r)).join(', ')}`);
  }
  ok('No .js files in manifest');
}

async function checkI18nJsonFiles(version) {
  const enRel = `support/${version}/i18n/en.json`;
  const ptRel = `support/${version}/i18n/pt-BR.json`;

  let enContent, ptContent;
  try { enContent = await readText(enRel); }
  catch (_) { fail(`${enRel} not found — create it for this version`); return; }
  try { ptContent = await readText(ptRel); }
  catch (_) { fail(`${ptRel} not found — create it for this version`); return; }

  let enData, ptData;
  try { enData = JSON.parse(enContent); }
  catch (_) { fail(`${enRel}: invalid JSON`); return; }
  try { ptData = JSON.parse(ptContent); }
  catch (_) { fail(`${ptRel}: invalid JSON`); return; }

  if (typeof enData !== 'object' || enData === null || Array.isArray(enData)) {
    fail(`${enRel}: root must be a plain object`); return;
  }
  if (typeof ptData !== 'object' || ptData === null || Array.isArray(ptData)) {
    fail(`${ptRel}: root must be a plain object`); return;
  }

  for (const [k, v] of Object.entries(enData)) {
    if (typeof v !== 'string') { fail(`${enRel}: value for "${k}" is not a string`); return; }
  }
  for (const [k, v] of Object.entries(ptData)) {
    if (typeof v !== 'string') { fail(`${ptRel}: value for "${k}" is not a string`); return; }
  }

  const enKeys = new Set(Object.keys(enData));
  const ptKeys = new Set(Object.keys(ptData));
  const missingPt = [...enKeys].filter(k => !ptKeys.has(k));
  const missingEn = [...ptKeys].filter(k => !enKeys.has(k));

  if (missingPt.length > 0 || missingEn.length > 0) {
    const msgs = [];
    if (missingPt.length > 0) msgs.push(`missing in pt-BR.json: ${missingPt.join(', ')}`);
    if (missingEn.length > 0) msgs.push(`missing in en.json: ${missingEn.join(', ')}`);
    fail(`i18n JSON key mismatch — ${msgs.join('; ')}`);
    return;
  }

  ok(`${enRel}: valid, ${enKeys.size} string entries`);
  ok(`${ptRel}: valid, ${ptKeys.size} string entries`);
  ok(`i18n JSON keys aligned (${enKeys.size} keys each)`);
}

const RESOURCE_KINDS_ALLOWED = new Set(['script', 'style', 'font', 'image', 'data', 'other', 'template']);
const RESOURCE_ENCODINGS_ALLOWED = new Set(['utf-8', 'base64']);
const SHA256_HEX_RE = /^[0-9a-f]{64}$/i;
const GITHUB_RAW_REPO_PREFIX = 'https://raw.githubusercontent.com/rabrunos/fibery-html-editor/main/';
const TEXT_RESOURCE_EXTENSIONS = new Set(['.css', '.html', '.json', '.md', '.txt', '.svg']);
const MOJIBAKE_MARKERS = [
  '\u00C3', // Ã
  '\u00C2', // Â
  '\uFFFD', // replacement char
  '\u00E2\u20AC\u201D', // â€”
  '\u00E2\u20AC\u201C', // â€“
  '\u00E2\u20AC\u02DC', // â˜
  '\u00E2\u20AC\u2122', // â™
  '\u00E2\u20AC\u0153', // âœ
  '\u00E2\u20AC\uFFFD' // â�
];

async function fileExists(rel) {
  try { await fs.access(path.join(rootDir, rel)); return true; }
  catch (_) { return false; }
}

function hasUtf8Bom(bytes) {
  return bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
}

function decodeRuntimeText(bytes) {
  return new TextDecoder('utf-8').decode(bytes);
}

function isTextResource(entry, rel) {
  if (entry.encoding === 'base64') return false;
  return TEXT_RESOURCE_EXTENSIONS.has(path.extname(rel).toLowerCase());
}

function findMojibakeMarker(text) {
  for (const marker of MOJIBAKE_MARKERS) {
    if (text.includes(marker)) return marker;
  }
  return '';
}

async function checkTextResourceClean(rel, entry) {
  if (!isTextResource(entry, rel)) return;
  const bytes = await fs.readFile(path.join(rootDir, rel));
  if (hasUtf8Bom(bytes)) {
    fail(`${rel}: UTF-8 BOM is not allowed in text resources`);
    return;
  }
  const text = decodeRuntimeText(bytes);
  if (text.includes('\r\n')) {
    fail(`${rel}: CRLF line endings are not allowed (use LF)`);
    return;
  }
  if (text.includes('`r`n')) {
    fail(`${rel}: literal \`r\`n marker is not allowed`);
    return;
  }
  if (text.includes('\\r\\n')) {
    fail(`${rel}: literal \\\\r\\\\n marker is not allowed`);
    return;
  }
  const mojibake = findMojibakeMarker(text);
  if (mojibake) {
    fail(`${rel}: possible mojibake marker detected (${JSON.stringify(mojibake)})`);
    return;
  }
}

async function computeFileSha256(rel, entry) {
  const bytes = await fs.readFile(path.join(rootDir, rel));
  if (isTextResource(entry, rel)) {
    // Mirror runtime hash input: fetch(...).text() decoded UTF-8 string.
    const runtimeText = decodeRuntimeText(bytes);
    return createHash('sha256').update(runtimeText, 'utf8').digest('hex');
  }
  return createHash('sha256').update(bytes).digest('hex');
}

function urlToLocalRel(url) {
  if (url.startsWith(GITHUB_RAW_REPO_PREFIX)) {
    return url.slice(GITHUB_RAW_REPO_PREFIX.length);
  }
  return null;
}

async function checkResourceManifest(version) {
  const rel = `support/${version}/resources-manifest.json`;
  let content;
  try { content = await readText(rel); }
  catch (_) { fail(`${rel} not found — create it for this version`); return; }
  let data;
  try { data = JSON.parse(content); }
  catch (_) { fail(`${rel} is not valid JSON`); return; }
  if (typeof data !== 'object' || data === null) { fail(`${rel}: root must be an object`); return; }
  if (typeof data.version !== 'string') { fail(`${rel}: missing or invalid "version" field`); return; }
  if (!Array.isArray(data.resources)) { fail(`${rel}: "resources" must be an array`); return; }
  if (data.version !== version) { fail(`${rel}: version field "${data.version}" does not match manifest version "${version}"`); return; }

  if (data.resources.length > 0) {
    for (let i = 0; i < data.resources.length; i++) {
      const e = data.resources[i];
      const p = `${rel} resources[${i}] (key=${e?.key || '?'})`;
      if (typeof e !== 'object' || e === null) { fail(`${p}: must be an object`); return; }
      if (typeof e.key !== 'string' || !e.key) { fail(`${p}: missing or empty "key"`); return; }
      if (typeof e.url !== 'string' || !e.url) { fail(`${p}: missing or empty "url"`); return; }
      if (!e.url.startsWith('https://')) { fail(`${p}: "url" must be an absolute HTTPS URL`); return; }
      if (typeof e.kind !== 'string' || !RESOURCE_KINDS_ALLOWED.has(e.kind)) {
        fail(`${p}: "kind" must be one of: ${[...RESOURCE_KINDS_ALLOWED].join(', ')}`); return;
      }
      if (e.kind === 'script') { fail(`${p}: functional script resources are not allowed in this phase`); return; }
      if (e.encoding !== undefined && !RESOURCE_ENCODINGS_ALLOWED.has(e.encoding)) {
        fail(`${p}: "encoding" must be one of: ${[...RESOURCE_ENCODINGS_ALLOWED].join(', ')}`); return;
      }
      if (e.required !== undefined && typeof e.required !== 'boolean') {
        fail(`${p}: "required" must be boolean when present`); return;
      }
      // sha256 format
      if (e.sha256 !== undefined && !SHA256_HEX_RE.test(e.sha256)) {
        fail(`${p}: "sha256" must be 64 lowercase hex chars`); return;
      }
      // required resources must have sha256 and version
      if (e.required === true) {
        if (typeof e.sha256 !== 'string') { fail(`${p}: required resource must have "sha256"`); return; }
        if (typeof e.version !== 'string' || !e.version) { fail(`${p}: required resource must have "version"`); return; }
      }
      // GitHub URL versioning and local validation
      const localRel = urlToLocalRel(e.url);
      if (localRel !== null) {
        // must point to a versioned path
        if (!e.url.includes(`/${version}/`)) {
          fail(`${p}: GitHub raw URL must contain version path /${version}/ — found: ${e.url}`); return;
        }
        // must not point into source/
        if (localRel.startsWith('source/')) {
          fail(`${p}: resource URL must not point to source/ directory`); return;
        }
        // local existence check
        const exists = await fileExists(localRel);
        if (!exists) {
          if (e.required === true) {
            fail(`${p}: required resource local file not found at ${localRel}`); return;
          } else {
            warn(`${p}: local file not found at ${localRel} (not required)`);
          }
        } else if (typeof e.sha256 === 'string') {
          await checkTextResourceClean(localRel, e);
          // hash verification
          const computed = await computeFileSha256(localRel, e);
          if (computed.toLowerCase() !== e.sha256.toLowerCase()) {
            fail(`${p}: sha256 mismatch — manifest=${e.sha256}, computed=${computed}`); return;
          }
        }
      } else if (e.required === true) {
        // required resource with non-mappable URL — can't verify hash locally
        fail(`${p}: required resource URL must point to this repo's GitHub raw content for local verification`); return;
      }
    }
    ok(`${data.resources.length} resource entr${data.resources.length === 1 ? 'y' : 'ies'} validated`);
  }
  ok(`${rel} valid (version=${data.version}, resources=${data.resources.length})`);
}

async function checkHtmlExternalization() {
  const manifest = JSON.parse(await readText('source/config/manifest.json'));
  const htmlArray = (manifest.html || []).map(f => path.normalize(f));

  const EXTERNALIZED_HTML = [
    'source/html/modal-settings.html',
    'source/html/modal-search.html',
    'source/html/modal-update-app.html',
    'source/html/modal-history.html',
    'source/html/modal-create-project.html',
    'source/html/modal-draft-recovery.html',
    'source/html/modal-unsaved-transition.html',
    'source/html/modal-conflict-compare.html'
  ];
  for (const f of EXTERNALIZED_HTML) {
    if (htmlArray.includes(path.normalize(f))) {
      fail(`${f} was externalized but is still listed in manifest html array`); return;
    }
  }
  ok('Externalized modal HTML files absent from inline manifest html array');

  const REQUIRED_HTML = [
    'source/html/layout-main.html',
    'source/html/context-menus.html',
    'source/html/modal-confirm.html',
    'source/html/panel-log.html',
    'source/html/template-resources-host.html',
    'source/html/panel-resources-boot.html'
  ];
  for (const f of REQUIRED_HTML) {
    if (!htmlArray.includes(path.normalize(f))) {
      fail(`${f} is required inline but missing from manifest html array`); return;
    }
  }
  ok('Required inline HTML files present in manifest html array');

  // Template safety: ensure no <script> or inline event handlers in the template resource file
  const version = manifest.version;
  const templateRel = `support/${version}/templates/app-modals.html`;
  let templateContent;
  try { templateContent = await readText(templateRel); }
  catch (_) { warn(`${templateRel} not found — skipping template safety check`); return; }
  if (/<script/i.test(templateContent)) {
    fail(`${templateRel}: template HTML must not contain <script> tags`); return;
  }
  if (/\bon\w+\s*=/i.test(templateContent)) {
    fail(`${templateRel}: template HTML must not contain inline event handlers (on...=)`); return;
  }
  ok(`${templateRel}: template HTML safety check passed`);
}

async function checkCssExternalization() {
  const manifest = JSON.parse(await readText('source/config/manifest.json'));
  const cssArray = (manifest.css || []).map(f => path.normalize(f));

  const EXTERNALIZED = ['source/css/03-update-panel.css', 'source/css/04-animations.css'];
  for (const f of EXTERNALIZED) {
    if (cssArray.includes(path.normalize(f))) {
      fail(`${f} was externalized but is still listed in manifest css array`); return;
    }
  }
  ok('Externalized CSS files absent from inline manifest css array');

  const CRITICAL = ['source/css/00-base.css', 'source/css/01-sidebar-alignment.css', 'source/css/02-preview-and-diff.css'];
  for (const f of CRITICAL) {
    if (!cssArray.includes(path.normalize(f))) {
      fail(`${f} is required inline but missing from manifest css array`); return;
    }
  }
  ok('Critical CSS files present in inline manifest css array');
}

const PT_BR_LITERAL_Q_PATTERNS = [
  { re: /vers\?o/i, label: 'versão→vers?o' },
  { re: /p\?gina/i, label: 'página→p?gina' },
  { re: /hist\?ric/i, label: 'histórico→hist?rico' },
  { re: /pr\?via/i, label: 'prévia→pr?via' },
  { re: /configura\?\?o/i, label: 'configuração→configura??o' },
  { re: /a\?\?o\b/i, label: 'ação→a??o' },
  { re: /descri\?\?o/i, label: 'descrição→descri??o' },
  { re: /informa\?\?o/i, label: 'informação→informa??o' },
  { re: /atualiza\?\?o/i, label: 'atualização→atualiza??o' },
];

async function checkI18nPtBrLiteralQPatterns(version) {
  const ptRel = `support/${version}/i18n/pt-BR.json`;
  let ptData;
  try { ptData = JSON.parse(await readText(ptRel)); } catch (_) { return; }
  const hits = [];
  for (const [key, val] of Object.entries(ptData)) {
    for (const { re, label } of PT_BR_LITERAL_Q_PATTERNS) {
      if (re.test(val)) {
        hits.push(`  key "${key}" matches pattern ${label}: ${JSON.stringify(val.slice(0, 60))}`);
        break;
      }
    }
  }
  if (hits.length > 0) {
    fail(`${ptRel}: literal-? substitution mojibake detected in ${hits.length} value(s):\n${hits.join('\n')}`);
    return;
  }
  ok(`${ptRel}: no literal-? mojibake patterns detected`);
}

const HTML_I18N_SOURCES = [
  'source/html/layout-main.html',
  'source/html/context-menus.html',
  'source/html/modal-confirm.html',
  'source/html/panel-log.html',
  'source/html/panel-resources-boot.html',
];
const DATA_I18N_ATTR_RE = /data-i18n(?:-title)?=["']([\w-]+)["']/g;

async function checkDataI18nKeys(version) {
  const enRel = `support/${version}/i18n/en.json`;
  let enKeys;
  try { enKeys = new Set(Object.keys(JSON.parse(await readText(enRel)))); } catch (_) { return; }

  const sources = [...HTML_I18N_SOURCES, `support/${version}/templates/app-modals.html`];
  const missing = [];
  for (const rel of sources) {
    let content;
    try { content = await readText(rel); } catch (_) { continue; }
    const re = new RegExp(DATA_I18N_ATTR_RE.source, DATA_I18N_ATTR_RE.flags);
    let m;
    while ((m = re.exec(content)) !== null) {
      if (!enKeys.has(m[1])) {
        missing.push(`${rel}: data-i18n key "${m[1]}" not in i18n JSON`);
      }
    }
  }
  if (missing.length > 0) {
    fail(`data-i18n key(s) missing from i18n JSON:\n${missing.map(s => '  ' + s).join('\n')}`);
    return;
  }
  ok('All data-i18n/data-i18n-title keys found in i18n JSON');
}

async function checkChangelogResourceNonRequired(version) {
  const rel = `support/${version}/resources-manifest.json`;
  let data;
  try { data = JSON.parse(await readText(rel)); } catch (_) { return; }
  const entry = (data.resources || []).find(r => r.key === 'update/changelog');
  if (!entry) { ok('update/changelog resource not listed (skipping required check)'); return; }
  if (entry.required === true) {
    fail(`update/changelog resource must have required: false (currently required: true)`); return;
  }
  ok('update/changelog resource is not required');
}

async function main() {
  console.log('Running local checks...');
  const version = await checkVersionAlignment();
  await checkChangelogVersion(version);
  await checkNoUnexpectedJs();
  await checkI18nJsonFiles(version);
  await checkI18nPtBrLiteralQPatterns(version);
  await checkDataI18nKeys(version);
  await checkResourceManifest(version);
  await checkHtmlExternalization();
  await checkCssExternalization();
  await checkChangelogResourceNonRequired(version);
  console.log('\nAll local checks passed.');
}

main().catch(err => {
  console.error(`  FAIL  ${err.message || String(err)}`);
  process.exit(1);
});
