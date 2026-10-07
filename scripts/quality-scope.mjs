import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const groups = require('../config/test-groups.cjs');
const root = path.resolve(import.meta.dirname, '..');
const scopes = ['full', 'widget', 'docs', 'metadata', 'data', 'settings', 'recovery', 'layout', 'release'];
const releaseFields = {
  productVersion: /^\d+\.\d+\.\d+$/,
  sourceTag: /^v\d+\.\d+\.\d+$/,
  buildId: /^v\d+-\d{8}\.\d+$/,
  releaseDate: /^\d{4}-\d{2}-\d{2}$/,
};

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}

// Remove only validated literal values, never a whole script or release object.
export function normalizeHtml(source, localUi = false) {
  const replacements = [];
  let metadataCount = 0;
  const uiCounts = new Map();
  for (const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    const offset = match.index + match[0].indexOf('>') + 1;
    if (!match[1].trim()) continue;
    const ast = require('acorn').parse(match[1], { ecmaVersion: 'latest', sourceType: 'module' });
    walk(ast, node => {
      if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression'
          && node.callee.object.name === 'Object' && node.callee.property.name === 'freeze'
          && !node.callee.computed && node.arguments.length === 1 && node.arguments[0].type === 'ObjectExpression') {
        const properties = node.arguments[0].properties;
        const names = properties.map(p => p.key?.name ?? p.key?.value);
        if (!Object.keys(releaseFields).every(key => names.includes(key))) return;
        metadataCount++;
        for (const [key, pattern] of Object.entries(releaseFields)) {
          const matches = properties.filter(p => (p.key?.name ?? p.key?.value) === key);
          if (matches.length !== 1 || matches[0].computed || matches[0].type !== 'Property'
              || matches[0].value.type !== 'Literal' || typeof matches[0].value.value !== 'string'
              || !pattern.test(matches[0].value.value)) throw new Error('Invalid release literal');
          const value = matches[0].value;
          replacements.push([offset + value.start, offset + value.end, JSON.stringify(`@${key}`)]);
        }
      }
      if (localUi && node.type === 'FunctionDeclaration'
          && ['updateIncomeModeIndicator', 'updateScheduleCalibrationSummary'].includes(node.id?.name)) {
        uiCounts.set(node.id.name, (uiCounts.get(node.id.name) || 0) + 1);
        walk(node.body, child => {
          if (child.type === 'Literal' && ['string', 'number'].includes(typeof child.value)) {
            replacements.push([offset + child.start, offset + child.end, JSON.stringify(`@ui-${typeof child.value}`)]);
          }
        });
      }
    });
  }
  if (metadataCount !== 1 || [...uiCounts.values()].some(count => count !== 1)) throw new Error('Ambiguous HTML markers');
  let result = source;
  for (const [start, end, replacement] of replacements.sort((a, b) => b[0] - a[0])) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }
  return result;
}

function metadataJson(file, source) {
  const data = JSON.parse(source);
  const strip = (object, field, pattern) => {
    if (typeof object[field] !== 'string' || !pattern.test(object[field])) throw new Error(`Invalid ${field}`);
    object[field] = `@${field}`;
  };
  if (file === 'release-manifest.json') {
    for (const [key, pattern] of Object.entries({ ...releaseFields, releaseTag: /^v\d+\.\d+\.\d+$/,
      deliveryRevision: /^\d{8}\.\d+$/, manualRevision: /^\d{8}\.\d+$/, widgetVersion: /^\d+\.\d+\.\d+$/ })) {
      if (key !== 'sourceTag') strip(data, key, pattern);
    }
  } else {
    strip(data, 'version', /^\d+\.\d+\.\d+$/);
    if (file === 'package-lock.json') strip(data.packages[''], 'version', /^\d+\.\d+\.\d+$/);
  }
  return JSON.stringify(data);
}

export function classifyChanges(changes) {
  const selected = new Set();
  let widget = false, docs = false, metadata = false, develop = null, localUi = false;
  const full = reason => ({ scope: 'full', reason });
  try {
    for (const change of changes) {
      const { file, before, after } = change;
      if (!file || after == null) return full('Deleted or unreadable file');
      if (['README.md', 'CHANGELOG.md', 'docs/Income-per-sed（说明文档）.docx'].includes(file)
          || /^(docs|Attachment)\/.*\.md$/.test(file)
          || /^docs\/images\/[^/]+\.(png|json)$/.test(file)) { docs = true; continue; }
      if (before == null) return full('Added runtime, test or tooling file');
      if (file === 'Income-per-sed-Develop.html') {
        develop = change;
        if (normalizeHtml(before) === normalizeHtml(after)) { metadata = true; continue; }
        if (normalizeHtml(before, true) === normalizeHtml(after, true)) { localUi = true; selected.add('settings'); continue; }
        return full('HTML behavior, markup, styles or shared logic changed');
      }
      if (file === 'Income-per-sed-Push.html') continue;
      if (file === 'IncomeWidget.js' || file === 'tests/widget-settings.cjs') { widget = true; continue; }
      if (['package.json', 'package-lock.json', 'release-manifest.json'].includes(file)) {
        if (metadataJson(file, before) !== metadataJson(file, after)) return full('Dependency, command or manifest structure changed');
        metadata = true; continue;
      }
      if (file === 'SHA256SUMS.txt') { metadata = true; continue; }
      if (file.startsWith('tests/')) {
        const matches = Object.entries(groups).filter(([, group]) => group.files.includes(file.slice(6)));
        if (matches.length === 1 && ['data', 'settings', 'recovery', 'layout'].includes(matches[0][0])) {
          selected.add(matches[0][0]); continue;
        }
      }
      return full('Tooling, workflow, shared helper or unknown path changed');
    }
    const push = changes.find(change => change.file === 'Income-per-sed-Push.html');
    if (push && (!develop || (!localUi && normalizeHtml(push.before) !== normalizeHtml(push.after)))) {
      return full('Push changed beyond validated release literals, or without Develop');
    }
    // Local UI literals may alter minification; mandatory reproducible-build validation verifies Push.
    if (selected.size > 1) return full('Multiple browser behavior groups changed');
    return { scope: selected.values().next().value || (widget ? 'widget' : docs ? 'docs' : 'metadata'),
      reason: selected.size ? 'Existing functional group selected' : metadata ? 'Runtime unchanged except release literals; targeted artifact checks' : 'Non-HTML change' };
  } catch (error) { return full(`Uncertain classification: ${error.message}`); }
}

export function browserArgs(scope, browser) {
  if (!scopes.includes(scope) || !['edge', 'webkit'].includes(browser)) throw new Error('Invalid scope or browser');
  if (['widget', 'docs', 'metadata'].includes(scope)) return [];
  return ['test', `--config=config/playwright-${browser}.config.js`,
    ...(scope === 'full' ? [] : groups[scope].files.filter(file => file.endsWith('.spec.js')).map(file => `tests/${file}`))];
}

export function checkGate(needs) {
  const required = ['scope', 'release-validation', 'visual-regression', 'webkit-smoke'];
  for (const name of required) {
    if (needs[name]?.result !== 'success') throw new Error(`Missing or unsuccessful check: ${name}`);
  }
  if (!scopes.includes(needs.scope.outputs?.scope)) throw new Error('Missing or invalid scope');
}

function planFromGit() {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const base = event.pull_request?.base?.sha || event.before;
  const head = process.env.GITHUB_SHA;
  let plan = { scope: 'full', reason: 'Manual run or unavailable comparison' };
  if (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' && /^[a-f0-9]{40}$/.test(base || '')
      && !/^0+$/.test(base) && /^[a-f0-9]{40}$/.test(head || '')) {
    try {
      const files = execFileSync('git', ['diff', '--name-only', '-z', '--no-renames', base, head], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
      const changes = files.map(file => {
        const show = ref => { try { return execFileSync('git', ['show', `${ref}:${file}`], { cwd: root, maxBuffer: 20 * 1024 * 1024 }).toString('utf8'); } catch { return null; } };
        return { file, before: show(base), after: show(head) };
      });
      plan = classifyChanges(changes);
    } catch (error) { plan.reason = `Comparison unavailable: ${error.message}`; }
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `scope=${plan.scope}\n`);
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Selected validation\n\nScope: **${plan.scope}**\n\n${plan.reason}\n`);
  console.log(JSON.stringify(plan));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, browser, scope] = process.argv.slice(2);
    if (command === 'plan') planFromGit();
    else if (command === 'gate') checkGate(JSON.parse(process.env.QUALITY_NEEDS));
    else if (command === 'run') {
      const args = browserArgs(scope, browser);
      if (!args.length) console.log(`No HTML browser run required for ${scope}; artifact validation remains mandatory.`);
      else {
        const result = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), ...args], { cwd: root, stdio: 'inherit' });
        if (result.error) throw result.error;
        process.exitCode = result.status || (result.signal ? 1 : 0);
      }
    } else throw new Error('Expected plan, run or gate');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
