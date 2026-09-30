import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function withoutFences(text) {
  return text.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, '');
}

function prose(text) {
  return withoutFences(text).replace(/`+[^`\n]*`+/g, '');
}

export function extractLinks(text) {
  const source = prose(text);
  const links = [];
  const definitions = new Map();
  for (const match of source.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gm)) {
    definitions.set(match[1].trim().toLowerCase(), match[2] || match[3]);
  }
  links.push(...definitions.values());
  // Read balanced inline destinations so filenames containing parentheses work.
  for (let i = 0; i < source.length; i++) {
    if (source[i] !== '[' || source[i - 1] === '\\') continue;
    let end = i + 1;
    while (end < source.length && (source[end] !== ']' || source[end - 1] === '\\')) end++;
    if (source[end + 1] === '(') {
      let cursor = end + 2;
      let depth = 1;
      let destination = '';
      if (source[cursor] === '<') {
        const close = source.indexOf('>', cursor + 1);
        if (close >= 0) destination = source.slice(cursor + 1, close);
      } else {
        for (; cursor < source.length; cursor++) {
          const char = source[cursor];
          if (char === '\\' && cursor + 1 < source.length) {
            destination += source[++cursor];
            continue;
          }
          if (char === '(') depth++;
          if (char === ')' && --depth === 0) break;
          if (/\s/.test(char) && depth === 1) break;
          destination += char;
        }
      }
      if (destination) links.push(destination);
    } else if (source[end + 1] === '[') {
      const close = source.indexOf(']', end + 2);
      if (close >= 0) {
        const key = (source.slice(end + 2, close) || source.slice(i + 1, end)).trim().toLowerCase();
        if (definitions.has(key)) links.push(definitions.get(key));
        else links.push(`missing-reference:${key}`);
      }
    }
    i = end;
  }
  for (const match of source.matchAll(/<(?:a|img)\b[^>]*\b(?:href|src)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    links.push(match[1]);
  }
  return links;
}

function anchors(text) {
  const result = new Set();
  const counts = new Map();
  for (const match of withoutFences(text).matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const slug = match[1].toLowerCase().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<[^>]*>/g, '')
      .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-');
    const count = counts.get(slug) || 0;
    result.add(count ? `${slug}-${count}` : slug);
    counts.set(slug, count + 1);
  }
  for (const match of text.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) result.add(match[1]);
  return result;
}

export function checkLink(root, file, href) {
  if (href.startsWith('missing-reference:')) return `Undefined reference: ${href.slice(18)}`;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null;
  let target;
  let fragment;
  try {
    const hash = href.indexOf('#');
    fragment = hash >= 0 ? decodeURIComponent(href.slice(hash + 1)) : '';
    const raw = (hash >= 0 ? href.slice(0, hash) : href).split('?')[0];
    const destination = decodeURIComponent(raw);
    target = destination ? path.resolve(destination.startsWith('/') ? root : path.dirname(path.join(root, file)),
      destination.replace(/^\//, '')) : path.join(root, file);
  } catch { return `Malformed link: ${href}`; }
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return `Link leaves repository: ${href}`;
  if (!existsSync(target)) return `Missing target: ${href}`;
  if (fragment && target.endsWith('.md') && !anchors(readFileSync(target, 'utf8')).has(fragment)) {
    return `Missing heading: ${href}`;
  }
  return null;
}

export function validateDocs(root, files) {
  const errors = [];
  const catalogPath = 'docs/repository-map.md';
  if (!existsSync(path.join(root, catalogPath))) return ['Missing docs/repository-map.md'];
  const catalog = readFileSync(path.join(root, catalogPath), 'utf8');
  const listed = new Set();
  for (const line of catalog.split(/\r?\n/)) {
    if (!line.startsWith('| [')) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    const match = /^\[([^\]]+)\]\((.+)\)$/.exec(cells[0]);
    if (!match || cells.length !== 3 || !cells[1] || !cells[2]) {
      errors.push(`Invalid catalog row: ${line}`);
      continue;
    }
    const name = match[1];
    if (listed.has(name)) errors.push(`Duplicate catalog entry: ${name}`);
    listed.add(name);
    const resolved = path.resolve(root, 'docs', match[2]);
    if (path.relative(root, resolved).split(path.sep).join('/') !== name) errors.push(`Catalog path mismatch: ${name}`);
    if (!files.includes(name)) errors.push(`Catalog entry not in repository inventory: ${name}`);
  }
  for (const file of files) {
    if (!listed.has(file)) errors.push(`Missing catalog entry: ${file}`);
    const absolute = path.join(root, file);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      errors.push(`Missing repository file: ${file}`);
      continue;
    }
    if (file.endsWith('.md')) {
      for (const href of extractLinks(readFileSync(absolute, 'utf8'))) {
        const error = checkLink(root, file, href);
        if (error) errors.push(`${file}: ${error}`);
      }
    }
    if (/^(scripts|tests)\//.test(file) && /\.(?:js|mjs|cjs|py)$/.test(file)) {
      const folder = file.split('/')[0];
      const indexPath = path.join(root, folder, 'README.md');
      const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
      const escaped = path.basename(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(?<![\\w.-])${escaped}(?![\\w.-])`).test(index)) errors.push(`Missing ${folder} purpose entry: ${file}`);
    }
  }
  return [...new Set(errors)];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(import.meta.dirname, '..');
  const deleted = new Set(execFileSync('git', ['ls-files', '-z', '--deleted'],
    { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean));
  const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8' }).split('\0').filter(file => file && !deleted.has(file)))];
  const errors = validateDocs(root, files);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log(`Documentation validation passed: ${files.length} files, complete catalog and valid internal links.`);
}
