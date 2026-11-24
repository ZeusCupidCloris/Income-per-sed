import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function readCommand(file, args) {
  return execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], timeout: 30_000 }).trim();
}

export function resolveMajorRelease(env, read = readCommand) {
  if (env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('Formal Release must be started manually from main.');
  }
  if (env.RELEASE_CONFIRMED !== 'true') throw new Error('Explicit major Release approval is required.');
  const version = /^v([1-9][0-9]*)\.0\.0$/.exec(env.RELEASE_TAG);
  if (!version || version[0] !== env.RELEASE_TAG) {
    throw new Error('Expected an existing major version tag such as v3.0.0.');
  }
  const shaPattern = /^[0-9a-f]{40}$/;
  if (!shaPattern.test(env.GITHUB_SHA)) throw new Error('Missing main dispatch commit.');
  const tagRef = `refs/tags/${env.RELEASE_TAG}`;
  const sha = read('git', ['rev-parse', '--verify', `${tagRef}^{commit}`]);
  if (!shaPattern.test(sha)) throw new Error('Release tag did not resolve to a commit.');
  read('git', ['merge-base', '--is-ancestor', sha, env.GITHUB_SHA]);

  const response = JSON.parse(read('gh', [
    'api', '--method', 'GET', `repos/${env.GITHUB_REPOSITORY}/actions/workflows/quality.yml/runs`,
    '-f', 'branch=main', '-f', `head_sha=${sha}`, '-F', 'per_page=20',
  ]));
  const latest = response.workflow_runs
    .filter(run => run.head_branch === 'main' && run.head_sha === sha
      && (run.event === 'push' || run.event === 'workflow_dispatch'))
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)[0];
  if (latest?.status !== 'completed' || latest.conclusion !== 'success') {
    throw new Error('The tagged commit needs a successful latest main Quality run.');
  }
  return { sha, tagRef, title: `V${version[1]}`, qualityRunId: latest.id };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { sha, tagRef, title, qualityRunId } = resolveMajorRelease(process.env);
    appendFileSync(process.env.GITHUB_OUTPUT, `sha=${sha}\ntag_ref=${tagRef}\ntitle=${title}\n`, 'utf8');
    console.log(`Verified main Quality run ${qualityRunId} for ${sha}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
