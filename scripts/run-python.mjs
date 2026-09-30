import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const marker = 'INCOME_PER_SED_PYTHON=';
const bundledPython = path.join(
  os.homedir(),
  '.cache',
  'codex-runtimes',
  'codex-primary-runtime',
  'dependencies',
  'python',
  process.platform === 'win32' ? 'python.exe' : 'bin/python3',
);

const candidates = [];
if (process.env.PYTHON) candidates.push([process.env.PYTHON, []]);
if (existsSync(bundledPython)) candidates.push([bundledPython, []]);
candidates.push(['python3', []], ['python', []]);
if (process.platform === 'win32') candidates.push(['py', ['-3']]);

const seen = new Set();
let selected = null;
for (const [command, prefix] of candidates) {
  const key = JSON.stringify([command, prefix]);
  if (seen.has(key)) continue;
  seen.add(key);
  const probe = spawnSync(
    command,
    [...prefix, '-c', `import sys; print('${marker}' + sys.executable)`],
    { encoding: 'utf8', timeout: 5000, windowsHide: true },
  );
  if (probe.status === 0 && probe.stdout.includes(marker)) {
    selected = { command, prefix };
    break;
  }
}

if (!selected) {
  console.error('A working Python 3 interpreter is required. Set the PYTHON environment variable to its executable path.');
  process.exit(1);
}

const result = spawnSync(
  selected.command,
  [...selected.prefix, ...process.argv.slice(2)],
  { stdio: 'inherit', windowsHide: true },
);
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
