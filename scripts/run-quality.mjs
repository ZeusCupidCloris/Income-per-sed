import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const groups = require('../config/test-groups.cjs');
const root = path.resolve(import.meta.dirname, '..');
const playwright = require.resolve('@playwright/test/cli');

export function buildPlan(mode, { group, browser = 'edge', list = false } = {}) {
  if (!['edge', 'webkit', 'both'].includes(browser)) throw new Error('Browser must be edge, webkit or both');
  const npm = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const quick = { args: [npm, 'run', 'test:checks'] };
  const browsers = browser === 'both' ? ['edge', 'webkit'] : [browser];
  const browserJobs = files => browsers.map(engine => ({
    args: [playwright, 'test', `--config=config/playwright-${engine}.config.js`, ...files, ...(list ? ['--list'] : [])],
  }));
  if (mode === 'quick') return [quick];
  if (mode === 'full') return [quick, ...['edge', 'webkit'].map(engine => ({
    args: [playwright, 'test', `--config=config/playwright-${engine}.config.js`, ...(list ? ['--list'] : [])],
  }))];
  if (mode === 'observe') {
    if (browser !== 'edge') throw new Error('Frame observation requires Edge');
    return [{ ...browserJobs(['tests/settings-frame-budget.spec.js'])[0], env: { QUALITY_OBSERVE: '1' } }];
  }
  if (mode !== 'focus' || !Object.hasOwn(groups, group)) throw new Error('Choose a group: data, recovery, settings, layout or release');
  const files = groups[group].files;
  const jobs = [];
  const node = files.filter(file => /\.(?:test\.mjs|cjs)$/.test(file));
  if (node.length) jobs.push({ args: ['--test', ...node.map(file => `tests/${file}`)] });
  if (files.includes('test_prepare_delivery.py')) jobs.push({
    args: ['scripts/run-python.mjs', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_prepare_delivery.py'],
  });
  const specs = files.filter(file => file.endsWith('.spec.js')).map(file => `tests/${file}`);
  if (specs.length) jobs.push(...browserJobs(specs));
  return jobs;
}

export function parseOptions(argv) {
  const [mode, ...args] = argv;
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list') options.list = true;
    else if (['--group', '--browser'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) {
      const key = args[i].slice(2);
      options[key] = args[++i];
    }
    else throw new Error(`Unknown or incomplete option: ${args[i]}`);
  }
  return { mode, options };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { mode, options } = parseOptions(process.argv.slice(2));
    const jobs = buildPlan(mode, options);
    console.log(mode === 'focus' ? `${groups[options.group].label}; WebKit uses its existing compatibility subset.` : `Quality: ${mode}`);
    for (const job of jobs) {
      const result = spawnSync(process.execPath, job.args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...job.env } });
      if (result.error) throw result.error;
      if (result.status !== 0) { process.exitCode = result.status || 1; break; }
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
