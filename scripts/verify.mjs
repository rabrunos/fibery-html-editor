import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function npmStep(label, script) {
  console.log(`\n[verify] ${label}`);
  // Single-string form (no args array) avoids DEP0190 when using shell:true
  const result = spawnSync(`npm run ${script}`, { cwd: rootDir, stdio: 'inherit', shell: true });
  if ((result.status ?? 1) !== 0) {
    console.error(`\n[verify] FAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

function nodeStep(label, scriptPath) {
  console.log(`\n[verify] ${label}`);
  const result = spawnSync(process.execPath, [scriptPath], { cwd: rootDir, stdio: 'inherit' });
  if ((result.status ?? 1) !== 0) {
    console.error(`\n[verify] FAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

npmStep('typecheck',    'typecheck');
nodeStep('checks',      'scripts/checks.mjs');
npmStep('build:tmp',    'build:tmp');
npmStep('validate:tmp', 'validate:tmp');
npmStep('build',        'build');
npmStep('validate',     'validate');

console.log('\n[verify] All verifications passed.\n');
