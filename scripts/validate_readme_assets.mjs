import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const configPath = path.join(root, 'config', 'readme-previews.json');
const readmePath = path.join(root, 'README.md');
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const [configText, readme] = await Promise.all([
  readFile(configPath, 'utf8'),
  readFile(readmePath, 'utf8'),
]);
const previews = JSON.parse(configText);
const errors = [];

if (!Array.isArray(previews) || previews.length === 0) {
  errors.push('config/readme-previews.json must contain at least one preview.');
}

const configuredPaths = new Set();
for (const preview of previews) {
  const { file, readmePath: assetPath, width, height, colorScheme } = preview;
  if (!file || !assetPath || !Number.isInteger(width) || !Number.isInteger(height)) {
    errors.push(`Invalid preview specification: ${JSON.stringify(preview)}`);
    continue;
  }
  if (width <= 0 || height <= 0 || !['light', 'dark'].includes(colorScheme)) {
    errors.push(`Invalid dimensions or color scheme for ${file}.`);
    continue;
  }
  if (assetPath !== `docs/images/${file}`) {
    errors.push(`${file} must use the README path docs/images/${file}.`);
  }
  if (configuredPaths.has(assetPath)) {
    errors.push(`Duplicate preview path in configuration: ${assetPath}`);
  }
  configuredPaths.add(assetPath);

  const referenceCount = readme.split(assetPath).length - 1;
  if (referenceCount !== 1) {
    errors.push(`${assetPath} must be referenced exactly once in README.md; found ${referenceCount}.`);
  }

  try {
    const data = await readFile(path.join(root, ...assetPath.split('/')));
    if (data.length < 24 || !data.subarray(0, 8).equals(pngSignature)) {
      errors.push(`${assetPath} is not a valid PNG file.`);
      continue;
    }
    if (data.subarray(12, 16).toString('ascii') !== 'IHDR') {
      errors.push(`${assetPath} does not contain a PNG IHDR header.`);
      continue;
    }
    const actualWidth = data.readUInt32BE(16);
    const actualHeight = data.readUInt32BE(20);
    if (actualWidth !== width || actualHeight !== height) {
      errors.push(`${assetPath} must be ${width}x${height}; found ${actualWidth}x${actualHeight}.`);
    }
  } catch (error) {
    errors.push(`Cannot read ${assetPath}: ${error.message}`);
  }
}

const readmePreviewPaths = new Set(
  [...readme.matchAll(/docs\/images\/preview-[a-z0-9-]+\.png/g)].map((match) => match[0]),
);
for (const assetPath of readmePreviewPaths) {
  if (!configuredPaths.has(assetPath)) {
    errors.push(`README preview is missing from config/readme-previews.json: ${assetPath}`);
  }
}

if (errors.length > 0) {
  console.error('README preview validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('README preview validation passed.');
for (const { readmePath: assetPath, width, height, colorScheme } of previews) {
  console.log(`  ${assetPath}: ${width}x${height}, ${colorScheme}`);
}
