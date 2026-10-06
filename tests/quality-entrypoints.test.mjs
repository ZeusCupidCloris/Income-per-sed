import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { buildPlan, groups, parseOptions } from '../scripts/run-quality.mjs';

test('every runnable test belongs to exactly one group or explicit manual observation', () => {
  const files = readdirSync(new URL('.', import.meta.url)).filter(file => /(?:\.spec\.js|\.test\.mjs|\.cjs|^test_.*\.py)$/.test(file));
  const entries = Object.values(groups).flatMap(group => [...group.files, ...(group.manual || [])]);
  assert.equal(new Set(entries).size, entries.length);
  assert.deepEqual(entries.sort(), files.sort());
});

test('focus includes every group assertion without running manual observation', () => {
  for (const [group, definition] of Object.entries(groups)) {
    const jobs = buildPlan('focus', { group, browser: 'both' });
    const args = jobs.flatMap(job => job.args).join(' ');
    for (const file of definition.files) assert.ok(args.includes(file), `${group}: ${file}`);
    for (const file of definition.manual || []) assert.ok(!args.includes(file));
  }
});

test('full is read-only, serial and retains both browsers; observation is opt-in', () => {
  const jobs = buildPlan('full');
  assert.equal(jobs.length, 3);
  assert.ok(jobs[0].args.includes('test:checks'));
  assert.ok(jobs[1].args.some(arg => arg.includes('edge.config')));
  assert.ok(jobs[2].args.some(arg => arg.includes('webkit.config')));
  assert.ok(!jobs.flatMap(job => job.args).includes('release:prepare'));
  const observation = buildPlan('observe')[0];
  assert.equal(observation.env.QUALITY_OBSERVE, '1');
  const config = readFileSync(new URL('../config/playwright-edge.config.js', import.meta.url), 'utf8');
  assert.match(config, /QUALITY_OBSERVE/);
  assert.match(config, /testMatch: '\*\*\/\*\.spec\.js'/);
  assert.match(config, /testIgnore:.*settings-frame-budget\.spec\.js/);
});

test('invalid groups, browsers and incomplete options fail instead of silently running everything', () => {
  assert.throws(() => buildPlan('focus', { group: 'missing' }));
  assert.throws(() => buildPlan('full', { browser: 'missing' }));
  assert.throws(() => parseOptions(['focus', '--group']));
  assert.throws(() => parseOptions(['focus', '--unknown']));
  assert.deepEqual(parseOptions(['focus', '--group', 'settings', '--browser', 'both', '--list']), {
    mode: 'focus', options: { group: 'settings', browser: 'both', list: true },
  });
});
