import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { extractImageReferences, inspectPng } from '../scripts/readme_assets_lib.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('extracts rendered Markdown and HTML images but ignores plain paths', () => {
  const markdown = [
    'Plain text: docs/images/preview-unused.png',
    '![Desktop](docs/images/preview-desktop.png)',
    '<img alt="Mobile" src="docs/images/preview-mobile.png">',
  ].join('\n');
  assert.deepEqual(extractImageReferences(markdown), [
    'docs/images/preview-desktop.png',
    'docs/images/preview-mobile.png',
  ]);
});

test('accepts a complete generated preview PNG', async () => {
  const data = await readFile(path.join(root, 'docs', 'images', 'preview-desktop.png'));
  assert.deepEqual(inspectPng(data), { width: 1440, height: 1000 });
});

test('rejects truncated and CRC-corrupted PNG files', async () => {
  const data = await readFile(path.join(root, 'docs', 'images', 'preview-desktop.png'));
  assert.throws(() => inspectPng(data.subarray(0, 24)), /truncated|invalid/i);

  const corrupted = Buffer.from(data);
  const firstChunkDataByte = 16;
  corrupted[firstChunkDataByte] ^= 0x01;
  assert.throws(() => inspectPng(corrupted), /CRC/i);
});
