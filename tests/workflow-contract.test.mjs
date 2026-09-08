import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const quality = readFileSync(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
const pages = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');

test('Pages is callable only after all three Quality jobs', () => {
  const job = quality.replace(/\r/g, '').split('\n  pages:\n')[1].split('\n  release-validation:')[0];
  assert.match(job, /needs: \[release-validation, visual-regression, webkit-smoke\]/);
  assert.match(job, /github\.ref == 'refs\/heads\/main'/);
  assert.match(job, /github\.event_name == 'push'/);
  assert.match(job, /uses: \.\/\.github\/workflows\/pages\.yml/);
  assert.doesNotMatch(job, /always\(\)|continue-on-error/);
});

test('Pages cannot bypass Quality with a direct trigger or drift to another SHA', () => {
  const triggers = pages.split('permissions:')[0];
  assert.match(triggers, /workflow_call:/);
  assert.doesNotMatch(triggers, /push:|workflow_dispatch:|workflow_run:/);
  assert.match(pages, /ref: \$\{\{ github.sha \}\}/);
  assert.match(pages, /persist-credentials: false/);
  assert.match(pages, /Verify published Push bytes/);
});
