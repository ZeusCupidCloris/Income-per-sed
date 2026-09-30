import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkLink, extractLinks, validateDocs } from '../scripts/validate-document-index.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'income-docs-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = ['Attachment/repository-map.md', 'docs/README.md', 'Attachment/scripts-index.md',
    'scripts/check.mjs', 'Attachment/tests-index.md', 'tests/check.test.mjs', 'tests/helpers/business-clock.js'];
  for (const file of files) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), '# Index\n');
  }
  writeFileSync(path.join(root, 'Attachment/scripts-index.md'), 'check.mjs\n');
  writeFileSync(path.join(root, 'Attachment/tests-index.md'), 'check.test.mjs\nhelpers/business-clock.js\n');
  writeFileSync(path.join(root, 'Attachment/repository-map.md'), files.map(file => {
    const href = path.posix.relative('Attachment', file);
    return `| [${file}](${href}) | Clear purpose | Maintenance |`;
  }).join('\n'));
  return { root, files };
}

test('valid catalog includes every file, script and test', t => {
  const { root, files } = fixture(t);
  assert.deepEqual(validateDocs(root, files), []);
});

test('missing, duplicate and stale catalog entries fail', t => {
  const { root, files } = fixture(t);
  const file = path.join(root, 'Attachment/repository-map.md');
  const rows = readFileSync(file, 'utf8').split('\n');
  writeFileSync(file, [rows[0], ...rows.slice(2), rows[0],
    '| [missing.md](../missing.md) | Missing file | Maintenance |'].join('\n'));
  const errors = validateDocs(root, files).join('\n');
  assert.match(errors, /Missing catalog entry: docs\/README.md/);
  assert.match(errors, /Duplicate catalog entry/);
  assert.match(errors, /not in repository inventory/);
  assert.match(errors, /Missing target/);
});

test('script and helper purpose omissions fail', t => {
  const { root, files } = fixture(t);
  writeFileSync(path.join(root, 'Attachment/scripts-index.md'), 'check.mjs.old\n');
  writeFileSync(path.join(root, 'Attachment/tests-index.md'), 'Other tests\n');
  const errors = validateDocs(root, files).join('\n');
  assert.match(errors, /Missing scripts purpose entry/);
  assert.match(errors, /Missing tests purpose entry/);
  assert.match(errors, /Missing tests purpose entry: tests\/helpers\/business-clock.js/);
});

test('empty purpose labels and mismatched catalog paths fail', t => {
  const { root, files } = fixture(t);
  const file = path.join(root, 'Attachment/repository-map.md');
  const text = readFileSync(file, 'utf8');
  writeFileSync(file, text.replace('| Clear purpose |', '| |')
    .replace('[scripts/check.mjs](../scripts/check.mjs)', '[scripts/check.mjs](../tests/check.test.mjs)'));
  const errors = validateDocs(root, files).join('\n');
  assert.match(errors, /Invalid catalog row/);
  assert.match(errors, /Catalog path mismatch/);
});

test('internal links validate files, directories and Unicode headings', t => {
  const { root } = fixture(t);
  writeFileSync(path.join(root, 'docs/README.md'), '# 文档索引\n## 已完成\n## 已完成\n## `code` 使用\n');
  assert.equal(checkLink(root, 'Attachment/repository-map.md', '../docs/README.md#%E5%B7%B2%E5%AE%8C%E6%88%90'), null);
  assert.equal(checkLink(root, 'Attachment/repository-map.md', '../docs/README.md#已完成-1'), null);
  assert.equal(checkLink(root, 'Attachment/repository-map.md', '../scripts/'), null);
  assert.equal(checkLink(root, 'Attachment/repository-map.md', '../docs/README.md#code-使用'), null);
  assert.match(checkLink(root, 'Attachment/repository-map.md', '../docs/README.md#missing'), /Missing heading/);
  assert.match(checkLink(root, 'Attachment/repository-map.md', '../../outside.md'), /leaves repository/);
  assert.match(checkLink(root, 'Attachment/repository-map.md', '%xx'), /Malformed link/);
});

test('centralized indexes are required and obsolete locations are not accepted', t => {
  const { root, files } = fixture(t);
  const catalog = path.join(root, 'Attachment/repository-map.md');
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  writeFileSync(path.join(root, 'docs/repository-map.md'), readFileSync(catalog));
  rmSync(catalog);
  assert.deepEqual(validateDocs(root, files), ['Missing Attachment/repository-map.md']);
});

test('balanced filenames, image links, references and HTML links are read', () => {
  assert.deepEqual(extractLinks('[manual](manual(1).md) ![image](image.png)\n'
    + '[guide][ref]\n[ref]: <docs/guide.md>\n<img src="preview.png">'),
  ['docs/guide.md', 'manual(1).md', 'image.png', 'docs/guide.md', 'preview.png']);
  assert.deepEqual(extractLinks('[unresolved][absent]'), ['missing-reference:absent']);
});

test('code examples are not checked as links', () => {
  assert.deepEqual(extractLinks('```md\n[example](missing.md)\n```\n`[example](missing.md)`'), []);
});

test('repository validation reports broken local links but does not fetch external URLs', t => {
  const { root, files } = fixture(t);
  writeFileSync(path.join(root, 'docs/README.md'), '[bad](absent.md) [external](https://example.invalid/guide)');
  const errors = validateDocs(root, files);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Missing target: absent.md/);
});
