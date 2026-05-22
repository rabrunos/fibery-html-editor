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

const ALLOWED_JS = new Set(['i18n-en.js', 'i18n-pt-br.js']);

async function checkNoUnexpectedJs() {
  const manifest = JSON.parse(await readText('source/config/manifest.json'));
  const unexpected = (manifest.js || []).filter(rel => {
    if (!rel.endsWith('.js')) return false;
    return !ALLOWED_JS.has(path.basename(rel));
  });
  if (unexpected.length > 0) {
    fail(`Unexpected .js files in manifest (migrate to .ts or allowlist): ${unexpected.map(r => path.basename(r)).join(', ')}`);
  }
  ok(`No unexpected .js in manifest (allowed: ${[...ALLOWED_JS].join(', ')})`);
}

async function checkI18nFilesOnlyExtend() {
  for (const rel of ['source/js/i18n-en.js', 'source/js/i18n-pt-br.js']) {
    let content;
    try { content = await readText(rel); }
    catch (_) { continue; }

    if (/(?:const|let|var)\s+I18N\s*=/.test(content)) {
      fail(`${rel}: must not reassign I18N (use Object.assign only)`);
    }
    if (/\bdelete\b.*\bI18N\b/.test(content)) {
      fail(`${rel}: must not delete from I18N`);
    }
    if (!content.includes('Object.assign(I18N')) {
      fail(`${rel}: does not call Object.assign(I18N...)`);
    }
    ok(`${path.basename(rel)} only extends I18N`);
  }
}

function extractI18nKeys(block) {
  // Strip string values first to avoid matching key-like substrings inside them
  // e.g. 'Read-only: admin...' would otherwise produce a spurious 'only' key
  const sanitized = block
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const keys = new Set();
  const re = /\b([a-zA-Z]\w*)\s*:/g;
  let m;
  while ((m = re.exec(sanitized)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

async function checkI18nKeyAlignment() {
  let source;
  try { source = await readText('source/js/i18n-base.ts'); }
  catch (_) { fail('source/js/i18n-base.ts not found'); return; }

  const enMatch = source.match(/\ben:\s*\{([^}]+)\}/);
  const ptMatch = source.match(/'pt-BR'\s*:\s*\{([^}]+)\}/);
  if (!enMatch) { fail('source/js/i18n-base.ts: could not locate en: { } block'); return; }
  if (!ptMatch) { fail('source/js/i18n-base.ts: could not locate pt-BR: { } block'); return; }

  const enKeys = extractI18nKeys(enMatch[1]);
  const ptKeys = extractI18nKeys(ptMatch[1]);

  const missingPt = [...enKeys].filter(k => !ptKeys.has(k));
  const missingEn = [...ptKeys].filter(k => !enKeys.has(k));

  if (missingPt.length > 0 || missingEn.length > 0) {
    const msgs = [];
    if (missingPt.length > 0) msgs.push(`missing in pt-BR: ${missingPt.join(', ')}`);
    if (missingEn.length > 0) msgs.push(`missing in en: ${missingEn.join(', ')}`);
    fail(`i18n-base.ts key mismatch — ${msgs.join('; ')}`);
  }
  ok(`i18n-base.ts en/pt-BR keys aligned (${enKeys.size} keys each)`);
}

const RESOURCE_KINDS_ALLOWED = new Set(['script', 'style', 'font', 'image', 'data', 'other']);
const RESOURCE_ENCODINGS_ALLOWED = new Set(['utf-8', 'base64']);

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
      const p = `${rel} resources[${i}]`;
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
    }
    ok(`${data.resources.length} resource entr${data.resources.length === 1 ? 'y' : 'ies'} validated`);
  }
  ok(`${rel} valid (version=${data.version}, resources=${data.resources.length})`);
}

async function main() {
  console.log('Running local checks...');
  const version = await checkVersionAlignment();
  await checkChangelogVersion(version);
  await checkNoUnexpectedJs();
  await checkI18nFilesOnlyExtend();
  await checkI18nKeyAlignment();
  await checkResourceManifest(version);
  console.log('\nAll local checks passed.');
}

main().catch(err => {
  console.error(`  FAIL  ${err.message || String(err)}`);
  process.exit(1);
});
