import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';
import { assertDevelopCurrent, buildDevelopHtml } from './build-develop-html.mjs';

const root = path.resolve(import.meta.dirname, '..');
const developPath = path.join(root, 'Income-per-sed-Develop.html');
const pushPath = path.join(root, 'Income-per-sed-Push.html');

function stripMarkedBlock(source, start, end, replacement = '') {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    throw new Error(`Missing or invalid Push build markers: ${start} ... ${end}`);
  }
  if (source.indexOf(start, startIndex + start.length) >= 0) {
    throw new Error(`Duplicate Push build marker: ${start}`);
  }
  return source.slice(0, startIndex) + replacement + source.slice(endIndex + end.length);
}

export async function buildPushFromDevelop(develop) {
  let source = develop.replace(/\r\n?/g, '\n');

  for (const [start, end, replacement] of [
    ['/* R28 DEVELOP MOTION DEBUG CSS START */', '/* R28 DEVELOP MOTION DEBUG CSS END */', ''],
    ['/* R30 DEVELOP MOTION QUALITY CSS START */', '/* R30 DEVELOP MOTION QUALITY CSS END */', ''],
    ['/* DEVELOP DIAGNOSTIC STORE START */', '/* DEVELOP DIAGNOSTIC STORE END */', ''],
    ['/* DEVELOP DEBUG PANEL START */', '/* DEVELOP DEBUG PANEL END */', ''],
    ['/* R30 DEVELOP MOTION QUALITY START */', '/* R30 DEVELOP MOTION QUALITY END */', ''],
    ['/* DEVELOP REGRESSION EXPORT START */', '/* DEVELOP REGRESSION EXPORT END */', ''],
  ]) {
    source = stripMarkedBlock(source, start, end, replacement);
  }

  source = source
    .replace(/\/\* R30 DEVELOP MOTION QUALITY HOOK \*\/[^\r\n]*(?:\r?\n)?/g, '')
    .replace(/motionDebug\.enabled/g, 'false')
    .replace(/if \(typeof updateMotionDebug === 'function'\) updateMotionDebug\(timestamp, status\);/g, '')
    .replace(/^initializeMotionDebug\(\);\s*$/gm, '')
    .replace('<meta name="income-per-sed-channel" content="develop">', '')
    .replace(
      /<title>([^<]+)<\/title>/,
      '<title>Income-per-sed</title><meta name="income-per-sed-channel" content="push">',
    );

  const output = await minify(source, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    conservativeCollapse: false,
    continueOnParseError: false,
    decodeEntities: true,
    keepClosingSlash: true,
    minifyCSS: true,
    minifyJS: {
      compress: {
        passes: 3,
        pure_funcs: ['initializeMotionDebug', 'recordDiagnosticEvent'],
        // Inline scripts share a browser global scope but are minified separately.
        toplevel: false,
      },
      format: {
        ascii_only: false,
        comments: false,
      },
      mangle: {
        toplevel: false,
      },
    },
    minifyURLs: false,
    processConditionalComments: true,
    removeAttributeQuotes: false,
    removeComments: true,
    removeEmptyAttributes: false,
    removeOptionalTags: false,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortAttributes: false,
    sortClassName: false,
    useShortDoctype: true,
  });

  if (!output.includes('name="income-per-sed-channel" content="push"')) {
    throw new Error('Generated Push file is missing the push channel marker.');
  }
  if (output.includes('__incomeClockDiagnostics') || output.includes('运行诊断') || output.includes('MotionQualityMonitor')) {
    throw new Error('Develop-only diagnostics leaked into the Push build.');
  }
  return `${output}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode = '--check', ...extra] = process.argv.slice(2);
    if (extra.length || !['--write', '--check'].includes(mode)) throw new Error(`Unknown build mode: ${mode}`);
    const { html } = mode === '--write' ? await buildDevelopHtml() : await assertDevelopCurrent();
    const generated = await buildPushFromDevelop(html);
    if (mode === '--write') {
      await writeFile(developPath, html, 'utf8');
      await writeFile(pushPath, generated, 'utf8');
      console.log('Generated the standalone Develop and Push HTML files from src/page.html.');
    } else if (await readFile(pushPath, 'utf8') !== generated) {
      throw new Error('Push HTML is stale. Edit src and run npm run build:push.');
    } else console.log('Develop assembly and Push build are reproducible and current.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
