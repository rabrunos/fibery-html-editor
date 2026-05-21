import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const manifestPath = path.join(rootDir, 'source', 'config', 'manifest.json');
const virtualManifestModuleId = 'virtual:fibery-html-editor/manifest-js';
const resolvedVirtualManifestModuleId = `\0${virtualManifestModuleId}`;

function assertConfig(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeLf(text) {
  return String(text).replace(/\r\n/g, '\n');
}

function readText(filePath, label) {
  const content = normalizeLf(readFileSync(filePath, 'utf8'));
  assertConfig(content.trim().length > 0, `${label} is empty: ${filePath}`);
  return content;
}

function readManifest() {
  return JSON.parse(readText(manifestPath, 'Manifest'));
}

function readManifestJsBundle() {
  const manifest = readManifest();
  assertConfig(Array.isArray(manifest.js) && manifest.js.length > 0, 'Manifest js list is empty');

  return manifest.js
    .map((rel) => readText(path.resolve(rootDir, rel), 'JS part'))
    .join('\n\n')
    .trim();
}

function fiberyManifestJsPlugin() {
  return {
    name: 'fibery-manifest-js',
    resolveId(id) {
      if (id === virtualManifestModuleId) {
        return resolvedVirtualManifestModuleId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedVirtualManifestModuleId) {
        return readManifestJsBundle();
      }
      return null;
    }
  };
}

const manifest = readManifest();
const appEntry = path.resolve(rootDir, manifest.appEntry || 'source/app/main.js');

export default defineConfig({
  root: rootDir,
  publicDir: false,
  plugins: [fiberyManifestJsPlugin()],
  build: {
    outDir: path.resolve(rootDir, '.tmp', 'vite'),
    emptyOutDir: true,
    copyPublicDir: false,
    minify: false,
    sourcemap: false,
    target: 'es2020',
    lib: {
      entry: appEntry,
      name: 'FiberyHtmlEditorBundle',
      formats: ['iife'],
      fileName: () => 'app.bundle.js'
    },
    rollupOptions: {
      treeshake: false
    }
  }
});
