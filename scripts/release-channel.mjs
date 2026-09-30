import { pathToFileURL } from 'node:url';

export function releaseChannel(tag) {
  const number = '(?:0|[1-9]\\d*)';
  const match = new RegExp(`^v${number}\\.${number}\\.${number}(?:-([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$`).exec(tag);
  if (!match || match[0] !== tag || match[1]?.split('.').some((part) => /^0\d+$/.test(part))) {
    throw new Error(`Invalid release tag: ${tag}`);
  }
  return match[1] ? 'prerelease' : 'stable';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(releaseChannel(process.argv[2] || ''));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
