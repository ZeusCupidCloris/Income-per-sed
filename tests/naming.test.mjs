import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = name => readFileSync(path.join(root, name), 'utf8');
const manifest = JSON.parse(read('release-manifest.json'));

test('public titles remain short and channel-specific', () => {
  assert.equal(read('Income-per-sed-Develop.html').match(/<title>(.*?)<\/title>/s)[1], 'Income-per-sed · Develop');
  assert.equal(read('Income-per-sed-Push.html').match(/<title>(.*?)<\/title>/s)[1], 'Income-per-sed');
  assert.match(read('IncomeWidget.js'), /menu\.title = "Income-per-sed"/);
});

test('component and delivery identifiers agree with the manifest', () => {
  const widget = read('IncomeWidget.js').match(/\bversion:\s*"([^"]+)"/)[1];
  assert.equal(widget, manifest.widgetVersion);
  assert.match(manifest.deliveryRevision, /^\d{8}\.\d+$/);
  assert.equal(manifest.manualRevision, manifest.deliveryRevision);
  assert.match(read('README.md'), new RegExp(manifest.widgetVersion.replaceAll('.', '\\.')));
  assert.ok(read('README.md').includes(manifest.deliveryRevision));
  assert.equal(manifest.publicNames.manualTitle, 'Income-per-sed 使用手册');
});

test('homepage contains only the five agreed sections', () => {
  assert.deepEqual([...read('README.md').matchAll(/^## (.*)$/gm)].map(m => m[1]),
    ['产品介绍', '四文件入口', '快速使用', '当前版本', '维护入口']);
});
