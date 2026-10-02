import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export async function retryInstall(run, { attempts = 2, delayMs = 10_000, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 2) throw new Error('Install attempts must be 1 or 2');
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    console.log(`Dependency installation attempt ${attempt}/${attempts}`);
    const result = await run();
    if (result === 0) return;
    if (attempt < attempts) await wait(delayMs);
  }
  throw new Error('Dependency installation failed after bounded retries');
}

export function runCommand(command, args, timeoutMs, { platform = process.platform, rootChildren = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', detached: platform !== 'win32' });
    let timedOut = false;
    let termination = Promise.resolve();
    const timer = setTimeout(() => {
      timedOut = true;
      console.error(`Installation exceeded ${timeoutMs / 1000}s; terminating its process tree`);
      if (platform === 'win32') {
        termination = killTree('taskkill', ['/pid', String(child.pid), '/T', '/F']);
      } else if (rootChildren) {
        // install-deps starts root-owned apt children on GitHub's Linux runner.
        // Only signal the detached process group created by this invocation.
        termination = killTree('sudo', ['-n', 'kill', '-KILL', '--', `-${child.pid}`]);
      } else {
        try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') reject(error); }
      }
      termination.catch(reject);
    }, timeoutMs);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    function killTree(executable, arguments_) {
      return new Promise((done, fail) => {
        const killer = spawn(executable, arguments_, { stdio: 'inherit' });
        killer.on('error', fail);
        killer.on('exit', (code) => code === 0 ? done() : fail(new Error('Failed to terminate installation process tree')));
      });
    }
    child.on('close', async (code) => {
      clearTimeout(timer);
      try { await termination; resolve(timedOut ? 124 : (code ?? 1)); } catch (error) { reject(error); }
    });
  });
}

export async function install(mode) {
  const commands = {
    npm: ['npm', ['ci', '--fetch-retries=2', '--fetch-timeout=60000', '--fetch-retry-maxtimeout=15000'], 300_000],
    webkit: ['npx', ['--no-install', 'playwright', 'install', '--with-deps', 'webkit'], 420_000],
  };
  if (!Object.hasOwn(commands, mode)) throw new Error('Expected npm or webkit');
  const [command, args, timeout] = commands[mode];
  // Windows npm entrypoints are cmd files; commands and arguments are fixed above.
  const invocation = process.platform === 'win32'
    ? [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `${command} ${args.join(' ')}`]]
    : [command, args];
  await retryInstall(() => runCommand(...invocation, timeout, { rootChildren: process.platform === 'linux' && mode === 'webkit' }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  install(process.argv[2]).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
