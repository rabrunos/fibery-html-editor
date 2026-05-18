import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ESSENTIAL_IDS = [
  'app',
  'sidebar',
  'pageHeader',
  'welcomeView',
  'splitArea',
  'saveBtn',
  'updateAppBtn',
  'updateAppModal',
  'updateApplyBtn',
  'codeEditor',
  'codeEditorFallback',
  'previewFrame',
  'historyModal',
  'confirmModal',
  'draftRecoveryModal'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeLf(value) {
  return String(value).replace(/\r\n/g, '\n');
}

function extractSingle(regex, source, description) {
  const match = source.match(regex);
  assert(match, `Missing ${description}`);
  return match;
}

function parseVersionMeta(html) {
  const match = extractSingle(/<meta\s+name="fibery-html-editor-version"\s+content="([^"]+)"\s*\/>/i, html, 'version meta');
  return match[1].trim();
}

function parseAppVersion(html) {
  const match = extractSingle(/const\s+APP_VERSION\s*=\s*'([^']+)'\s*;/, html, 'APP_VERSION');
  return match[1].trim();
}

function parseInlineAppScript(html) {
  const blocks = [];
  const regex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    blocks.push(match[1]);
  }
  assert(blocks.length > 0, 'No inline <script> block found');
  const selected = blocks.sort((a, b) => b.length - a.length)[0];
  assert(selected.trim().length > 1000, 'Inline app script looks too short');
  return selected;
}

function countMatches(source, regex) {
  return (source.match(regex) || []).length;
}

function isSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function parseArgs(argv) {
  const positionals = [];
  let baseline = 'index.html';
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--baseline') {
      const next = argv[i + 1];
      assert(next, 'Missing value for --baseline');
      baseline = next;
      i += 1;
      continue;
    }
    positionals.push(arg);
  }
  assert(positionals.length >= 1, 'Usage: node scripts/validate-build.mjs <generated-file> [--baseline <path>]');
  return { target: positionals[0], baseline };
}

async function readFileSafe(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return normalizeLf(content);
}

async function main() {
  const { target, baseline } = parseArgs(process.argv.slice(2));
  const targetPath = path.resolve(rootDir, target);
  const baselinePath = path.resolve(rootDir, baseline);

  const generated = await readFileSafe(targetPath);
  assert(generated.trim().length > 10000, 'Generated HTML is unexpectedly short');
  assert(!/^\s*404:\s*Not Found/i.test(generated), 'Generated HTML looks like 404 response');
  assert(!/<title>\s*404/i.test(generated), 'Generated HTML looks like error page');
  assert(/fibery-html-editor/i.test(generated), 'Generated HTML does not look like Fibery HTML Editor');

  const unresolved = generated.match(/__[A-Z0-9_]+__/g) || [];
  assert(unresolved.length === 0, `Generated HTML still contains unresolved placeholders: ${[...new Set(unresolved)].join(', ')}`);

  const metaVersion = parseVersionMeta(generated);
  const appVersion = parseAppVersion(generated);
  assert(isSemver(metaVersion), `Version meta is not semver: ${metaVersion}`);
  assert(isSemver(appVersion), `APP_VERSION is not semver: ${appVersion}`);
  assert(metaVersion === appVersion, `Version mismatch: meta=${metaVersion}, APP_VERSION=${appVersion}`);

  assert(generated.includes('window.FIBERY_HTML_EDITOR_VERSION = APP_VERSION;'), 'Missing window.FIBERY_HTML_EDITOR_VERSION assignment');
  assert(generated.includes('document.documentElement.dataset.appVersion = APP_VERSION;'), 'Missing dataset appVersion assignment');
  assert(generated.includes('<link rel="stylesheet" href="tailwind.css" />'), 'Missing tailwind.css link');
  assert(generated.includes('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js'), 'Missing Monaco CDN loader');
  assert(!generated.includes('source/js/'), 'Generated HTML should not reference modular source JS files');
  assert(!generated.includes('source/css/'), 'Generated HTML should not reference modular source CSS files');

  const styleMatch = extractSingle(/<style>\n([\s\S]*?)\n\s*<\/style>/i, generated, 'inline style block');
  assert(styleMatch[1].trim().length > 1000, 'Inline style block is too short');

  for (const id of ESSENTIAL_IDS) {
    assert(generated.includes(`id="${id}"`), `Missing essential DOM id: ${id}`);
  }

  const inlineScript = parseInlineAppScript(generated);
  const tmpDir = path.join(rootDir, '.tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpScriptPath = path.join(tmpDir, 'validate-inline-script.js');
  await fs.writeFile(tmpScriptPath, `${inlineScript.trim()}\n`, 'utf8');

  const checkResult = spawnSync(process.execPath, ['--check', tmpScriptPath], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  assert(checkResult.status === 0, `Inline JavaScript syntax check failed:\n${checkResult.stderr || checkResult.stdout || 'unknown error'}`);

  let baselineContent = '';
  try {
    baselineContent = await readFileSafe(baselinePath);
  } catch (_) {
    baselineContent = '';
  }

  if (baselineContent) {
    const generatedBytes = Buffer.byteLength(generated, 'utf8');
    const baselineBytes = Buffer.byteLength(baselineContent, 'utf8');
    const ratio = generatedBytes / baselineBytes;
    assert(ratio > 0.7 && ratio < 1.3, `Generated size drift too large versus baseline (ratio=${ratio.toFixed(3)})`);

    const generatedIdCount = countMatches(generated, /id="[^"]+"/g);
    const baselineIdCount = countMatches(baselineContent, /id="[^"]+"/g);
    const idDiff = Math.abs(generatedIdCount - baselineIdCount);
    assert(idDiff <= 5, `Generated ID count diverged too much from baseline (${generatedIdCount} vs ${baselineIdCount})`);
  }

  console.log(`Validation passed for ${path.relative(rootDir, targetPath)} (version ${metaVersion}).`);
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
