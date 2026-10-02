import test from 'node:test';
import assert from 'node:assert/strict';
import { retryInstall, runCommand, install } from '../scripts/install-ci-dependencies.mjs';

test('successful installation never retries', async () => {
  let calls = 0;
  await retryInstall(async () => { calls++; return 0; });
  assert.equal(calls, 1);
});
test('one transient failure retries once and waits', async () => {
  let calls = 0;
  const delays = [];
  await retryInstall(async () => ++calls === 1 ? 124 : 0, { wait: async (ms) => delays.push(ms) });
  assert.equal(calls, 2);
  assert.deepEqual(delays, [10_000]);
});
test('persistent failure stops after two attempts', async () => {
  let calls = 0;
  await assert.rejects(retryInstall(async () => { calls++; return 1; }, { wait: async () => {} }));
  assert.equal(calls, 2);
});
test('invalid modes and unlimited retries are rejected', async () => {
  await assert.rejects(install('other'));
  await assert.rejects(retryInstall(async () => 0, { attempts: 3 }));
});
test('timeout terminates a real waiting child', async () => {
  const start = Date.now();
  assert.equal(await runCommand(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], 250), 124);
  assert.ok(Date.now() - start < 5000);
});
