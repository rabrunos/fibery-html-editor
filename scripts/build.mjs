import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'source', 'config', 'manifest.json');

const REQUIRED_TEMPLATE_PLACEHOLDERS = [
  '__INLINE_CSS__',
  '__INLINE_JS__',
  '__BODY_CONTENT__',
  '__APP_VERSION__',
  '__BODY_OPEN_TAG__'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeLf(text) {
  return String(text).replace(/\r\n/g, '\n');
}

function isSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(String(version || '').trim());
}

async function readText(filePath, label) {
  const content = await fs.readFile(filePath, 'utf8');
  const normalized = normalizeLf(content);
  assert(normalized.trim().length > 0, `${label} is empty: ${filePath}`);
  return normalized;
}

function parseOutArg(argv) {
  const outFlagIndex = argv.findIndex((arg) => arg === '--out');
  if (outFlagIndex >= 0) {
    const next = argv[outFlagIndex + 1];
    assert(next, 'Missing value for --out');
    return next;
  }
  return 'index.html';
}

async function main() {
  const argv = process.argv.slice(2);
  const outputRelative = parseOutArg(argv);
  const outputPath = path.resolve(rootDir, outputRelative);

  const manifestRaw = await readText(manifestPath, 'Manifest');
  const manifest = JSON.parse(manifestRaw);
  assert(isSemver(manifest.version), `Invalid manifest version: ${manifest.version}`);
  assert(Array.isArray(manifest.css) && manifest.css.length > 0, 'Manifest css list is empty');
  assert(Array.isArray(manifest.html) && manifest.html.length > 0, 'Manifest html list is empty');
  assert(Array.isArray(manifest.js) && manifest.js.length > 0, 'Manifest js list is empty');
  assert(typeof manifest.template === 'string' && manifest.template.trim(), 'Manifest template path is missing');
  assert(typeof manifest.bodyOpenTag === 'string' && manifest.bodyOpenTag.trim(), 'Manifest bodyOpenTag is missing');

  const templatePath = path.resolve(rootDir, manifest.template);
  const template = await readText(templatePath, 'Template');

  for (const token of REQUIRED_TEMPLATE_PLACEHOLDERS) {
    assert(template.includes(token), `Template missing placeholder: ${token}`);
  }

  const cssParts = [];
  for (const rel of manifest.css) {
    const filePath = path.resolve(rootDir, rel);
    cssParts.push(await readText(filePath, 'CSS part'));
  }

  const htmlParts = [];
  for (const rel of manifest.html) {
    const filePath = path.resolve(rootDir, rel);
    htmlParts.push(await readText(filePath, 'HTML part'));
  }

  const jsParts = [];
  for (const rel of manifest.js) {
    const filePath = path.resolve(rootDir, rel);
    jsParts.push(await readText(filePath, 'JS part'));
  }

  const inlineCss = cssParts.join('\n\n').trim();
  const bodyContent = htmlParts.join('\n\n').trim();
  const inlineJs = jsParts.join('\n\n').trim();

  assert(inlineCss.length > 100, 'Generated inline CSS is too short');
  assert(bodyContent.length > 1000, 'Generated body content is too short');
  assert(inlineJs.length > 1000, 'Generated inline JS is too short');

  let html = template;
  html = html.replace('__BODY_OPEN_TAG__', manifest.bodyOpenTag);
  html = html.replace('__INLINE_CSS__', inlineCss);
  html = html.replace('__BODY_CONTENT__', bodyContent);
  html = html.replace('__INLINE_JS__', inlineJs);
  html = html.replace(/__APP_VERSION__/g, manifest.version);

  const unresolved = html.match(/__[A-Z0-9_]+__/g) || [];
  assert(unresolved.length === 0, `Unresolved placeholders in generated HTML: ${[...new Set(unresolved)].join(', ')}`);

  assert(html.includes(`<meta name="fibery-html-editor-version" content="${manifest.version}" />`), 'Generated HTML missing version meta line');
  assert(html.includes(`const APP_VERSION = '${manifest.version}';`), 'Generated HTML missing APP_VERSION line');
  assert(html.includes('window.FIBERY_HTML_EDITOR_VERSION = APP_VERSION;'), 'Generated HTML missing window version assignment');
  assert(html.includes('document.documentElement.dataset.appVersion = APP_VERSION;'), 'Generated HTML missing dataset version assignment');
  assert(html.includes('<link rel="stylesheet" href="tailwind.css" />'), 'Generated HTML missing tailwind.css link');
  assert(html.includes('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js'), 'Generated HTML missing Monaco CDN loader');
  assert(/fibery-html-editor/i.test(html), 'Generated HTML does not look like Fibery HTML Editor');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${html.trimEnd()}\n`, 'utf8');

  console.log(`Build completed: ${path.relative(rootDir, outputPath)} (version ${manifest.version})`);
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
