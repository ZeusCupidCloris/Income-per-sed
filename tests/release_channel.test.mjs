import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseChannel } from '../scripts/release_channel.mjs';

test('stable tags select latest releases', () => {
  assert.equal(releaseChannel('v2.5.4'), 'stable');
});
test('candidate and other prerelease tags never select stable', () => {
  for (const tag of ['v2.5.4-rc.2', 'v2.5.4-beta.1', 'v2.5.4-alpha']) {
    assert.equal(releaseChannel(tag), 'prerelease');
  }
});
test('malformed tags fail closed', () => {
  for (const tag of ['', 'vnext', '2.5.4', 'v02.5.4', 'v2.5.4-rc.02', 'v2.5.4\n']) {
    assert.throws(() => releaseChannel(tag));
  }
});
