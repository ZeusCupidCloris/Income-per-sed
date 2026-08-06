import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { minify } from 'html-minifier-terser';

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

async function buildPush() {
  let source = await readFile(developPath, 'utf8');

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
    .replace(
      '<title>Income-per-sed · Pocket Watch v35 · R31 Visual · R35 Kinetic Interaction</title>',
      '<title>Income-per-sed · Pocket Watch v35 · R31 Visual · R35 Kinetic Interaction · Push</title><meta name="income-per-sed-channel" content="push">',
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
        toplevel: true,
      },
      format: {
        ascii_only: false,
        comments: false,
      },
      mangle: {
        toplevel: true,
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
  if (output.includes('__incomeClockDiagnostics') || output.includes('运行诊断')) {
    throw new Error('Develop-only diagnostics leaked into the Push build.');
  }
  return `${output}\n`;
}

const mode = process.argv[2] || '--check';
const generated = await buildPush();

if (mode === '--write') {
  await writeFile(pushPath, generated, 'utf8');
  console.log(`Generated ${path.relative(root, pushPath)} from ${path.relative(root, developPath)}.`);
} else if (mode === '--check') {
  const current = await readFile(pushPath, 'utf8');
  if (current !== generated) {
    console.error('Income-per-sed-Push.html is stale. Run npm run build:push.');
    process.exitCode = 1;
  } else {
    console.log('Push build is reproducible and current.');
  }
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
