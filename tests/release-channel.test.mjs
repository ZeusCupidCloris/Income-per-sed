import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseChannel } from '../scripts/release-channel.mjs';
import { resolveMajorRelease } from '../scripts/resolve-major-release.mjs';

const tagSha = 'a'.repeat(40);
const mainSha = 'b'.repeat(40);
const request = {
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_SHA: mainSha,
  GITHUB_REPOSITORY: 'owner/repo',
  RELEASE_CONFIRMED: 'true',
  RELEASE_TAG: 'v3.0.0',
};
const passedRun = {
  id: 11, head_sha: tagSha, head_branch: 'main', event: 'push',
  status: 'completed', conclusion: 'success', created_at: '2026-11-01T00:00:00Z',
};

function releaseReader(runs, steps = []) {
  return (file, args) => {
    steps.push([file, ...args]);
    if (file === 'git' && args[0] === 'rev-parse') return tagSha;
    if (file === 'git' && args[0] === 'merge-base') return '';
    assert.equal(file, 'gh');
    return JSON.stringify({ workflow_runs: runs });
  };
}

test('major Release rejects automatic, non-main, unconfirmed and non-major requests before reading tags', () => {
  const neverRead = () => assert.fail('Ineligible requests must not resolve tags or CI');
  for (const inputs of [
    { GITHUB_EVENT_NAME: 'push' },
    { GITHUB_REF: 'refs/heads/release/uat' },
    { RELEASE_CONFIRMED: 'false' },
    { RELEASE_CONFIRMED: undefined },
  ]) {
    assert.throws(() => resolveMajorRelease({ ...request, ...inputs }, neverRead), /manually from main|approval/);
  }
  for (const tag of ['v2.8.0', 'v3.0.1', 'v3.0.0-rc.1', 'v0.0.0', 'v03.0.0', 'v3.0.0\n', 'main']) {
    assert.throws(() => resolveMajorRelease({ ...request, RELEASE_TAG: tag }, neverRead), /major version tag/);
  }
});

test('major Release resolves an exact tag against main and uses the verified commit and short title', () => {
  const steps = [];
  const result = resolveMajorRelease(request, releaseReader([passedRun], steps));
  assert.deepEqual(result, { sha: tagSha, tagRef: 'refs/tags/v3.0.0', title: 'V3', qualityRunId: 11 });
  assert.deepEqual(steps, [
    ['git', 'rev-parse', '--verify', 'refs/tags/v3.0.0^{commit}'],
    ['git', 'merge-base', '--is-ancestor', tagSha, mainSha],
    ['gh', 'api', '--method', 'GET', 'repos/owner/repo/actions/workflows/quality.yml/runs',
      '-f', 'branch=main', '-f', `head_sha=${tagSha}`, '-F', 'per_page=20'],
  ]);
  assert.equal(resolveMajorRelease({ ...request, RELEASE_TAG: 'v12.0.0' }, releaseReader([passedRun])).title, 'V12');
});

test('major Release stops for a missing tag or a tagged commit outside main', () => {
  for (const failedCommand of ['rev-parse', 'merge-base']) {
    assert.throws(() => resolveMajorRelease(request, (file, [command]) => {
      assert.equal(file, 'git', 'Do not query Quality for an unresolved or unmerged tag');
      if (command === failedCommand) throw new Error('git rejected release target');
      return tagSha;
    }), /git rejected release target/);
  }
});

test('major Release needs the latest exact main check, not an unrelated or older pass', () => {
  const newer = { ...passedRun, id: 12, created_at: '2026-11-02T00:00:00Z' };
  for (const runs of [
    [],
    [{ ...passedRun, head_sha: mainSha }, { ...passedRun, event: 'pull_request' }, { ...passedRun, head_branch: 'test' }],
    [passedRun, { ...newer, conclusion: 'failure' }],
    [passedRun, { ...newer, status: 'in_progress', conclusion: null }],
  ]) {
    assert.throws(() => resolveMajorRelease(request, releaseReader(runs)), /successful latest main Quality run/);
  }
  const success = resolveMajorRelease(request, releaseReader([passedRun, { ...newer, event: 'workflow_dispatch' }]));
  assert.equal(success.qualityRunId, 12);
});

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
