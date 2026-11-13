import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(import.meta.dirname, '..');
const directive = /<!-- @include ([^\r\n]+?) -->|\/\* @include ([^\r\n]+?) \*\//g;
const fragmentMarker = /^\/\* @(fragment ([a-z][a-z0-9-]*)|endfragment) \*\/\n?/gm;
const normalize = text => text.replace(/\r\n?/g, '\n');
const withoutFinalNewline = text => text.endsWith('\n') ? text.slice(0, -1) : text;

function fragments(text, file) {
  const result = new Map();
  let current = null;
  let cursor = 0;
  for (const match of text.matchAll(fragmentMarker)) {
    if (match[2]) {
      if (current || text.slice(cursor, match.index).trim()) throw new Error(`Invalid fragment boundary: ${file}`);
      if (result.has(match[2])) throw new Error(`Duplicate fragment ${match[2]}: ${file}`);
      current = { name: match[2], offset: match.index + match[0].length };
    } else {
      if (!current) throw new Error(`Unexpected fragment end: ${file}`);
      result.set(current.name, { offset: current.offset, text: withoutFinalNewline(text.slice(current.offset, match.index)) });
      current = null;
      cursor = match.index + match[0].length;
    }
  }
  if (current || text.slice(cursor).trim()) throw new Error(`Unclosed fragment or unmarked content: ${file}`);
  return result;
}

export async function buildDevelopHtml({ projectRoot = repository } = {}) {
  const sourceRoot = await realpath(path.join(projectRoot, 'src'));
  const files = new Map();
  const used = new Set();
  const segments = [];
  let generatedOffset = 0;
  const pieces = [];

  async function load(request) {
    const match = /^([a-zA-Z0-9_.\/-]+)(?:#([a-z][a-z0-9-]*))?$/.exec(request);
    if (!match || path.isAbsolute(match[1]) || match[1].split('/').some(part => !part || part === '.' || part === '..')) {
      throw new Error(`Invalid source include: ${request}`);
    }
    const file = await realpath(path.resolve(sourceRoot, match[1]));
    const relative = path.relative(sourceRoot, file);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error(`Source include leaves src: ${request}`);
    }
    let record = files.get(file);
    if (!record) {
      const text = normalize(await readFile(file, 'utf8'));
      if (path.extname(file) === '.json') JSON.parse(text);
      record = { file: `src/${relative.split(path.sep).join('/')}`, text,
        fragments: text.includes('/* @fragment ') ? fragments(text, request) : null };
      files.set(file, record);
    }
    const name = match[2];
    if (name && !record.fragments?.has(name)) throw new Error(`Missing fragment ${name}: ${request}`);
    if (!name && record.fragments) throw new Error(`Include a named fragment: ${request}`);
    const selected = name ? record.fragments.get(name) : { offset: 0, text: withoutFinalNewline(record.text) };
    return { ...selected, record, name, key: `${file}#${name || ''}` };
  }

  function append(text, selected, localOffset) {
    if (!text) return;
    pieces.push(text);
    segments.push({ generatedOffset, length: text.length, sourceOffset: selected.offset + localOffset, source: selected.record.file });
    generatedOffset += text.length;
  }

  async function render(selected, stack) {
    if (stack.includes(selected.key)) throw new Error(`Circular source include: ${selected.record.file}`);
    if (used.has(selected.key)) throw new Error(`Duplicate source include: ${selected.record.file}#${selected.name || ''}`);
    used.add(selected.key);
    let cursor = 0;
    for (const match of selected.text.matchAll(new RegExp(directive))) {
      append(selected.text.slice(cursor, match.index), selected, cursor);
      await render(await load(match[1] || match[2]), [...stack, selected.key]);
      cursor = match.index + match[0].length;
    }
    append(selected.text.slice(cursor), selected, cursor);
  }

  const entry = await load('page.html');
  entry.text = entry.record.text;
  await render(entry, []);
  for (const [file, record] of files) {
    for (const name of record.fragments?.keys() || []) {
      if (!used.has(`${file}#${name}`)) throw new Error(`Unused source fragment ${name}: ${record.file}`);
    }
  }
  const html = pieces.join('');
  if (/<!--\s*@include|\/\*\s*@include|\/\*\s*@(?:end)?fragment/.test(html)) throw new Error('An unresolved source directive remains in Develop.');
  return { html, segments, sources: Object.fromEntries([...files.values()].map(record => [record.file, record.text])) };
}

export function locateDevelopLine(build, line) {
  if (!Number.isSafeInteger(line) || line < 1) throw new Error('Provide a positive generated line number.');
  let offset = 0;
  for (let number = 1; number < line; number++) {
    const next = build.html.indexOf('\n', offset);
    if (next < 0) throw new Error('Generated line is outside Develop.');
    offset = next + 1;
  }
  const end = build.html.indexOf('\n', offset);
  const lineEnd = end < 0 ? build.html.length : end;
  while (offset < lineEnd && /\s/.test(build.html[offset])) offset++;
  const segment = build.segments.find(part => offset >= part.generatedOffset && offset < part.generatedOffset + part.length);
  if (!segment) throw new Error('Generated line has no source content.');
  const sourceOffset = segment.sourceOffset + offset - segment.generatedOffset;
  return { file: segment.source, line: build.sources[segment.source].slice(0, sourceOffset).split('\n').length };
}

export async function assertDevelopCurrent({ projectRoot = repository } = {}) {
  const build = await buildDevelopHtml({ projectRoot });
  if (await readFile(path.join(projectRoot, 'Income-per-sed-Develop.html'), 'utf8') !== build.html) {
    throw new Error('Develop HTML is stale. Edit src and run npm run build:develop.');
  }
  return build;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode = '--check', value, ...extra] = process.argv.slice(2);
    if (extra.length || !['--check', '--write', '--locate'].includes(mode) || (mode !== '--locate' && value)) throw new Error('Use --check, --write or --locate <line>.');
    const build = mode === '--check' ? await assertDevelopCurrent() : await buildDevelopHtml();
    const output = path.join(repository, 'Income-per-sed-Develop.html');
    if (mode === '--write') {
      await writeFile(output, build.html, 'utf8');
      console.log('Generated the standalone Develop HTML from src/page.html.');
    } else if (mode === '--locate') {
      const location = locateDevelopLine(build, Number(value));
      console.log(`${location.file}:${location.line}`);
    } else console.log('Develop assembly is reproducible and current.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
