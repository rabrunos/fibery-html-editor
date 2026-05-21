import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
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

function transpileManifestTsPart(source, rel) {
  const result = ts.transpileModule(source, {
    fileName: rel,
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      removeComments: false
    },
    reportDiagnostics: true
  });
  const errors = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assertConfig(errors.length === 0, `TypeScript transpile failed for ${rel}: ${errors.map((diagnostic) => diagnostic.messageText).join('; ')}`);
  const output = normalizeLf(result.outputText).trim();
  assertConfig(!/^\s*(?:import|export)\b/m.test(output), `Manifest TypeScript part must preserve shared script scope: ${rel}`);
  return output;
}

function readManifestJsPart(rel) {
  const source = readText(path.resolve(rootDir, rel), 'JS part');
  return rel.endsWith('.ts') ? transpileManifestTsPart(source, rel) : source;
}

function readManifestJsBundle() {
  const manifest = readManifest();
  assertConfig(Array.isArray(manifest.js) && manifest.js.length > 0, 'Manifest js list is empty');

  return manifest.js
    .map((rel) => readManifestJsPart(rel))
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
const appEntry = path.resolve(rootDir, manifest.appEntry || 'source/app/main.ts');

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
