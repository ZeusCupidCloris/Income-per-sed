import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyChanges, normalizeHtml, browserArgs, checkGate } from '../scripts/quality-scope.mjs';

const quality = readFileSync(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
const pages = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
const release = readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8');

test('browser evidence survives a retry-passed job', () => {
  for (const name of ['Upload visual diagnostics', 'Upload WebKit diagnostics']) {
    const step = quality.split(`- name: ${name}`)[1].split('retention-days: 14')[0];
    assert.match(step, /if: \$\{\{ !cancelled\(\) \}\}/);
    assert.match(step, /test-results\//);
    assert.match(step, /playwright-report\//);
  }
});

test('all dependency installs have bounded retries and outer step deadlines', () => {
  for (const workflow of [quality, pages, release]) {
    assert.doesNotMatch(workflow, /- run: npm ci/);
    assert.match(workflow, /install-ci-dependencies\.mjs npm\r?\n\s+timeout-minutes: 11/);
  }
  assert.match(quality, /install-ci-dependencies\.mjs webkit\r?\n\s+timeout-minutes: 15/);
});

test('Pages is callable only after the fail-closed Quality Gate', () => {
  const job = quality.replace(/\r/g, '').split('\n  pages:\n')[1].split('\n  release-validation:')[0];
  assert.match(job, /needs: \[quality-gate\]/);
  assert.match(job, /github\.ref == 'refs\/heads\/main'/);
  assert.match(job, /github\.event_name == 'push'/);
  assert.match(job, /uses: \.\/\.github\/workflows\/pages\.yml/);
  assert.doesNotMatch(job, /always\(\)|continue-on-error/);
  const gate = quality.split('  quality-gate:')[1].split('  pages:')[0];
  assert.match(gate, /needs: \[scope, release-validation, visual-regression, webkit-smoke\]/);
  assert.match(gate, /always\(\)/);
  assert.match(gate, /QUALITY_NEEDS: \$\{\{ toJSON\(needs\) \}\}/);
  assert.doesNotMatch(quality, /continue-on-error/);
});

const html = `<html><style>.card{color:red}</style><script>
const APP_RELEASE=Object.freeze({productVersion:'2.5.9',sourceTag:'v2.5.9',buildId:'v39-20261006.4',releaseDate:'2026-10-06',settingsSchema:3});
function calculate(){return 42;}
function updateIncomeModeIndicator(){element.animate([],{duration:180});}
function updateScheduleCalibrationSummary(){setTextIfChanged(summary,'等待校准');}
</script></html>`;
const metadataUpdate = html.replaceAll('2.5.9', '2.6.1').replace('20261006.4', '20261008.1').replace('2026-10-06', '2026-10-08');
const change = (file, after, before = html) => ({ file, before, after });

test('widget plus four-file metadata selects widget, not HTML full coverage', () => {
  const changes = [change('Income-per-sed-Develop.html', metadataUpdate), change('Income-per-sed-Push.html', metadataUpdate),
    change('IncomeWidget.js', 'readoutWidth:199', 'readoutWidth:212'), change('tests/widget-settings.cjs', 'new assertion', 'old assertion'),
    change('docs/releases/v2.6.1.md', 'New guidance', null), change('SHA256SUMS.txt', 'new hashes', 'old hashes')];
  assert.equal(classifyChanges(changes).scope, 'widget');
  assert.equal(normalizeHtml(html), normalizeHtml(metadataUpdate));
  assert.deepEqual(browserArgs('widget', 'edge'), []);
  assert.deepEqual(browserArgs('docs', 'webkit'), []);
});

test('real shared HTML changes, malformed metadata and unknown paths never take the widget shortcut', () => {
  for (const after of [metadataUpdate.replace('return 42', 'return 43'), metadataUpdate.replace('color:red', 'color:blue'),
    metadataUpdate.replace('settingsSchema:3', 'settingsSchema:4'), metadataUpdate.replace("'2.6.1'", 'sideEffect()'),
    metadataUpdate + '<script>doSomething()</script>', metadataUpdate.replace('</html>', '<div>changed</div></html>'),
    metadataUpdate.replace("productVersion:'2.6.1'", "productVersion:'2.6.1',productVersion:'2.6.1'"),
    metadataUpdate.replace('Object.freeze', 'alternate.freeze')]) {
    assert.equal(classifyChanges([change('Income-per-sed-Develop.html', after), change('IncomeWidget.js', 'new')]).scope, 'full');
  }
  assert.equal(classifyChanges([change('Income-per-sed-Push.html', metadataUpdate)]).scope, 'full');
  for (const file of ['scripts/build-release-html.mjs', '.github/workflows/quality.yml', 'config/test-groups.cjs',
    'tests/helpers/clock.js', 'unknown.js']) assert.equal(classifyChanges([change(file, 'new')]).scope, 'full');
  assert.equal(classifyChanges([{ file: 'IncomeWidget.js', before: null, after: 'new' }]).scope, 'full');
  assert.equal(classifyChanges([{ file: 'README.md', before: 'old', after: null }]).scope, 'full');
});

test('only isolated UI literal edits and single known test groups select functional coverage', () => {
  assert.equal(classifyChanges([change('Income-per-sed-Develop.html', metadataUpdate.replace('duration:180', 'duration:190')),
    change('Income-per-sed-Push.html', metadataUpdate.replace('duration:180', 'duration:190'))]).scope, 'settings');
  assert.equal(classifyChanges([change('Income-per-sed-Develop.html', html.replace('element.animate', 'other.animate'))]).scope, 'full');
  for (const [file, scope] of [['settings-refinements.spec.js','settings'], ['foreground-resume.spec.js','recovery'],
    ['long-amount-layout.spec.js','layout'], ['storage-resilience.spec.js','data']]) {
    assert.equal(classifyChanges([change(`tests/${file}`, 'updated')]).scope, scope);
    assert.ok(browserArgs(scope, 'edge').includes(`tests/${file}`));
  }
  assert.equal(classifyChanges([change('tests/settings-refinements.spec.js', 'new'), change('tests/foreground-resume.spec.js', 'new')]).scope, 'full');
  assert.throws(() => browserArgs('missing', 'edge'));
  assert.throws(() => browserArgs('full', 'unknown'));
  assert.equal(browserArgs('full', 'webkit').length, 2);
});

test('JSON version-only changes are distinguished from dependencies and manifest structure', () => {
  const packageBefore = JSON.stringify({ version: '2.5.9', devDependencies: { '@playwright/test': '1.62.1' } });
  assert.equal(classifyChanges([change('package.json', packageBefore.replace('2.5.9','2.6.1'), packageBefore)]).scope, 'metadata');
  assert.equal(classifyChanges([change('package.json', packageBefore.replace('1.62.1','1.63.0'), packageBefore)]).scope, 'full');
  assert.equal(classifyChanges([change('package-lock.json', '{broken', '{}')]).scope, 'full');
});

test('summary refuses missing, skipped, cancelled or failed jobs and invalid plans', () => {
  const valid = { scope: { result:'success', outputs:{scope:'widget'} }, 'release-validation': {result:'success'},
    'visual-regression': {result:'success'}, 'webkit-smoke': {result:'success'} };
  assert.doesNotThrow(() => checkGate(valid));
  for (const name of Object.keys(valid)) for (const result of ['skipped','cancelled','failure', undefined]) {
    assert.throws(() => checkGate({...valid, [name]:{result}}));
  }
  assert.throws(() => checkGate({...valid, scope:{result:'success',outputs:{scope:'unknown'}}}));
});

test('Pages cannot bypass Quality with a direct trigger or drift to another SHA', () => {
  const triggers = pages.split('permissions:')[0];
  assert.match(triggers, /workflow_call:/);
  assert.doesNotMatch(triggers, /push:|workflow_dispatch:|workflow_run:/);
  assert.match(pages, /ref: \$\{\{ github.sha \}\}/);
  assert.match(pages, /persist-credentials: false/);
  assert.match(pages, /Verify published Push bytes/);
});
