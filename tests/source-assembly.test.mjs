import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { assertDevelopCurrent, buildDevelopHtml, locateDevelopLine } from '../scripts/build-develop-html.mjs';
import { buildPushFromDevelop } from '../scripts/build-release-html.mjs';

const require = createRequire(import.meta.url);
const { parse } = require('acorn');
const repository = path.resolve(import.meta.dirname, '..');
const components = [
  ['createFunConversions', 'fun-conversions'],
  ['createWorkSummary', 'work-summary'],
  ['createMonthSummary', 'month-summary'],
  ['createHourlySummary', 'hourly-summary'],
  ['createProgressReadout', 'progress-readout'],
  ['createStatusReadout', 'status-readout'],
  ['createHistoryDateSeek', 'history-date-seek'],
  ['createHistoryTimeInput', 'history-time-input'],
  ['bindHistoryQuickButtons', 'history-quick-buttons'],
  ['createHistoryPanelFocus', 'history-panel-focus'],
  ['createHistoryPanelController', 'history-panel-controller'],
  ['createDateEstimateResult', 'date-estimate-result'],
  ['createIncomeRateSummary', 'income-rate-summary'],
  ['createIncomeModeSwitch', 'income-mode-switch'],
  ['createIncomeViewTabs', 'income-view-tabs'],
  ['createIncomeDrafts', 'income-drafts'],
  ['createIncomeFields', 'income-fields'],
  ['createIncomeSettings', 'income-settings'],
  ['createScheduleCalibrationSummary', 'schedule-calibration-summary'],
  ['createCalendarStatus', 'calendar-status'],
  ['createScheduleSettings', 'schedule-settings'],
  ['createScheduleWheels', 'schedule-settings', 'wheels.js'],
  ['evaluateScheduleDraft', 'schedule-settings', 'validation.js'],
];

function fixture(t, files) {
  const base = realpathSync(os.tmpdir());
  const root = mkdtempSync(path.join(base, 'income-source-'));
  t.after(() => {
    assert.equal(path.dirname(realpathSync(root)), base);
    assert(path.basename(root).startsWith('income-source-'));
    rmSync(root, { recursive: true, force: true });
  });
  for (const [name, text] of Object.entries(files)) {
    const file = path.join(root, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  return root;
}

test('assembly inlines nested source in exact order, normalizes LF and tracks original lines', async t => {
  const root = fixture(t, {
    'src/page.html': '<style>\r\n/* @include card.css#base */\r\n/* @include card.css#small */\r\n</style>\r\n<script>\r\n/* @include card.js */\r\n</script>\r\n',
    'src/card.css': '/* @fragment base */\n.fun-card{display:flex;}\n/* @endfragment */\n\n/* @fragment small */\n.fun-card{gap:5px;}\n/* @endfragment */\n',
    'src/card.js': '/* @include child.js */\nfunction mount() {}\n',
    'src/child.js': 'const value = 1;\n',
  });
  const build = await buildDevelopHtml({ projectRoot: root });
  assert.equal(build.html, '<style>\n.fun-card{display:flex;}\n.fun-card{gap:5px;}\n</style>\n<script>\nconst value = 1;\nfunction mount() {}\n</script>\n');
  assert.deepEqual(locateDevelopLine(build, 2), { file: 'src/card.css', line: 2 });
  assert.deepEqual(locateDevelopLine(build, 3), { file: 'src/card.css', line: 6 });
  assert.deepEqual(locateDevelopLine(build, 6), { file: 'src/child.js', line: 1 });
  assert.deepEqual(locateDevelopLine(build, 7), { file: 'src/card.js', line: 2 });
  assert.equal((await buildDevelopHtml({ projectRoot: root })).html, build.html);
  for (const invalid of [0, -1, 1.5, NaN, 999]) assert.throws(() => locateDevelopLine(build, invalid));
});

test('missing files and missing fragments fail rather than producing a partial page', async t => {
  for (const include of ['missing.js', 'style.css#missing']) {
    const root = fixture(t, { 'src/page.html': `/* @include ${include} */\n`,
      'src/style.css': '/* @fragment present */\na{}\n/* @endfragment */\n' });
    await assert.rejects(buildDevelopHtml({ projectRoot: root }), /ENOENT|Missing fragment/);
  }
});

test('circular and duplicated includes fail before initialization can be duplicated', async t => {
  for (const content of ['/* @include page.html */\n', '/* @include card.js */\n/* @include card.js */\n']) {
    const root = fixture(t, { 'src/page.html': content, 'src/card.js': 'const value = 1;\n' });
    await assert.rejects(buildDevelopHtml({ projectRoot: root }), /Circular|Duplicate/);
  }
});

test('invalid paths, parent traversal and links outside src are rejected', async t => {
  for (const include of ['../outside.js', '/outside.js', 'a/../outside.js', 'a//outside.js', 'C:/outside.js']) {
    const root = fixture(t, { 'src/page.html': `/* @include ${include} */\n`, 'outside.js': 'external\n' });
    await assert.rejects(buildDevelopHtml({ projectRoot: root }), /Invalid source include/);
  }
  const root = fixture(t, { 'src/page.html': '/* @include linked/outside.js */\n', 'outside/outside.js': 'external\n' });
  symlinkSync(path.join(root, 'outside'), path.join(root, 'src/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(buildDevelopHtml({ projectRoot: root }), /leaves src/);
});

test('fragment boundaries, duplicate names and unused sections fail closed', async t => {
  for (const [style, pattern] of [
    ['/* @fragment base */\na{}\n', /Unclosed/],
    ['/* @endfragment */\n', /unresolved source directive/i],
    ['/* @fragment base */\na{}\n/* @endfragment */\n/* @fragment base */\nb{}\n/* @endfragment */\n', /Duplicate fragment/],
    ['/* @fragment base */\na{}\n/* @endfragment */\n/* @fragment unused */\nb{}\n/* @endfragment */\n', /Unused source fragment/],
  ]) {
    const root = fixture(t, { 'src/page.html': style.includes('@fragment') ? '/* @include style.css#base */\n' : '/* @include style.css */\n', 'src/style.css': style });
    await assert.rejects(buildDevelopHtml({ projectRoot: root }), pattern);
  }
});

test('source checks do not rewrite stale generated output', async t => {
  const root = fixture(t, { 'src/page.html': '<!DOCTYPE html>\n', 'Income-per-sed-Develop.html': 'hand edited\n' });
  await assert.rejects(assertDevelopCurrent({ projectRoot: root }), /stale/);
  assert.equal(readFileSync(path.join(root, 'Income-per-sed-Develop.html'), 'utf8'), 'hand edited\n');
  writeFileSync(path.join(root, 'Income-per-sed-Develop.html'), '<!DOCTYPE html>\n');
  await assertDevelopCurrent({ projectRoot: root });
});

test('current component assembly and pure Push builder match both standalone artifacts', async () => {
  const build = await assertDevelopCurrent();
  assert.equal(await buildPushFromDevelop(build.html), readFileSync(path.join(repository, 'Income-per-sed-Push.html'), 'utf8'));
  assert.equal(Object.keys(build.sources).length, 57);
  for (const [name, component, filename = 'index.js'] of components) {
    const line = build.html.slice(0, build.html.indexOf(`function ${name}(`)).split('\n').length;
    assert.deepEqual(locateDevelopLine(build, line), { file: `src/components/${component}/${filename}`, line: 1 });
  }
  const geometryLine = build.html.slice(0, build.html.indexOf('function point(seconds, radius = 112)')).split('\n').length;
  assert.deepEqual(locateDevelopLine(build, geometryLine), { file: 'src/components/history-dial-geometry/index.js', line: 1 });
  assert(!build.html.includes('/* @include '));
  const manifest = JSON.parse(readFileSync(path.join(repository, 'release-manifest.json'), 'utf8'));
  assert.equal(manifest.canonicalSource, 'src/page.html');
  assert.deepEqual(manifest.derivedArtifacts, ['Income-per-sed-Develop.html', 'Income-per-sed-Push.html']);
});

for (const [name, component, filename = 'index.js'] of components) {
test(`${component}${filename === 'index.js' ? '' : '/' + filename} has no implicit app state, storage or independent clock`, () => {
  const source = readFileSync(path.join(repository, `src/components/${component}/${filename}`), 'utf8');
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  assert.equal(ast.body.length, 1);
  assert.equal(ast.body[0].type, 'FunctionDeclaration');
  assert.equal(ast.body[0].id.name, name);
  const forbidden = new Set(['CONFIG', 'dom', 'document', 'window', 'localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'AppClock', 'Date', 'BusinessTimeZone', 'IncomeEngine', 'ScheduleEngine', 'SettingsUI', 'AppLifecycle', 'ComponentScopes', 'getRates']);
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier') assert(!forbidden.has(node.name), `Implicit dependency: ${node.name}`);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') walk(value);
    }
  }
  walk(ast);
});
}

test('history panel focus keeps host state, close ordering and injected listener ownership', () => {
  const source = readFileSync(path.join(repository, 'src/components/history-panel-focus/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateHistoryPanelFocus');
  const root = { body: {}, activeElement: null };
  const inside = {}, outside = {}, backdrop = {}, closeButton = {};
  const opener = { contains: node => node === opener, focus: () => { root.activeElement = opener; } };
  const panel = {
    inert: false, contains: node => node === panel || node === inside,
    hasAttribute: () => false, querySelector: () => closeButton,
    focus: () => { root.activeElement = panel; },
  };
  const control = { contains: node => node === opener };
  const state = { open: true, closing: false, desktop: false, returnFocus: false };
  let allowReturn = true, closes = 0;
  const focus = create({ root, panel, opener, control, backdrop, state,
    closePanel: () => { closes++; }, canReturnFocus: () => allowReturn });
  const bindings = [];
  focus.bind((target, type, listener, options) => bindings.push({ target, type, listener, options }));
  assert.deepEqual(bindings.map(binding => binding.type), ['click', 'click', 'pointerdown', 'focusin']);
  assert.equal(bindings[0].target, backdrop);
  assert.equal(bindings[1].target, closeButton);
  assert.equal(bindings[2].target, root);
  assert.equal(bindings[2].options.passive, true);

  root.activeElement = opener;
  focus.focusAfterOpen(root.body);
  assert.equal(root.activeElement, panel);
  root.activeElement = outside;
  focus.focusAfterOpen(root.body);
  assert.equal(root.activeElement, outside);

  root.activeElement = inside;
  focus.rememberCloseFocus();
  assert.equal(state.returnFocus, true);
  root.activeElement = root.body;
  const shouldReturn = focus.captureCloseFocus();
  assert.equal(shouldReturn, true);
  assert.equal(state.returnFocus, false);
  focus.restoreFocus(shouldReturn);
  assert.equal(root.activeElement, opener);

  root.activeElement = root.body;
  allowReturn = false;
  focus.restoreFocus(true);
  assert.equal(root.activeElement, root.body);
  state.returnFocus = true;
  bindings[2].listener({ target: outside });
  assert.equal(closes, 1);
  assert.equal(state.returnFocus, false);
  root.activeElement = outside;
  assert.equal(focus.captureCloseFocus(), false);
  bindings[3].listener({ target: outside });
  assert.equal(root.activeElement, panel);
  state.desktop = true;
  root.activeElement = outside;
  bindings[3].listener({ target: outside });
  assert.equal(root.activeElement, outside);

  let prevented = false;
  assert.equal(focus.handleKeyboard({ target: outside, key: 'Escape', preventDefault: () => { prevented = true; } }, false), true);
  assert.equal(prevented, true);
  assert.equal(closes, 2);
  assert.deepEqual(state, { open: true, closing: false, desktop: true, returnFocus: false });
  state.open = false;
  assert.equal(focus.handleKeyboard({ target: panel, key: 'Home' }, false), false);
});

test('history panel controller preserves close ordering, reversal and viewport policy without an animation clock', () => {
  const source = readFileSync(path.join(repository, 'src/components/history-panel-controller/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateHistoryPanelController');
  function fixture(synchronous = false) {
    const events = [], classes = new Set(), attributes = new Map();
    const body = { dataset: {}, appendChild(node) { node.parentElement = body; }, classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
    } };
    const panel = { hidden: true, parentElement: null, setAttribute: (name, value) => attributes.set(name, value) };
    const opener = { setAttribute: (name, value) => attributes.set(`opener-${name}`, value) };
    const backdrop = { hidden: true, parentElement: null };
    const root = { body, activeElement: opener };
    const state = { open: false, closing: false, desktop: false, closeTimer: 7, recentTimer: 9,
      recentButton: { classList: { remove: name => events.push(name) } } };
    let desktop = true, width = 854, opened, closed;
    const presentation = {
      show({ onfinish }) { panel.hidden = false; opened = onfinish; events.push('show'); },
      hide({ onfinish, immediate = false }) { closed = onfinish; events.push('hide'); if (immediate || synchronous) onfinish(); },
      release() { assert.equal(panel.hidden, true); events.push('release'); },
      schedulePosition() { events.push('position'); },
    };
    const focus = {
      focusAfterOpen(active) { assert.equal(active, opener); events.push('opened-focus'); },
      rememberCloseFocus() { events.push('remember'); },
      captureCloseFocus() { events.push('capture'); return true; },
      restoreFocus(value) { assert.equal(value, true); assert.equal(panel.hidden, true); events.push('restore'); },
      cancelReturnFocus() { events.push('cancel-return'); },
    };
    const controller = create({ root, panel, opener, backdrop, state, presentation, focus,
      clearTimer: id => events.push(`clear-${id}`), finishEditing: () => events.push('finish-edit'),
      prepareDate: () => events.push('prepare'), resetDrag: () => events.push('reset-drag'),
      dismissNotice: () => events.push('notice'), syncPanel: () => events.push('sync-panel'),
      viewport: { sync: () => events.push('viewport'), desktop: () => desktop, width: () => width } });
    return { controller, events, classes, attributes, body, panel, opener, backdrop, state,
      opened: () => opened(), closed: () => closed(), closeCallback: () => closed,
      viewport: (nextDesktop, nextWidth) => { desktop = nextDesktop; width = nextWidth; } };
  }
  const f = fixture();
  f.controller.initialize();
  assert.equal(f.panel.parentElement, f.body);
  assert.equal(f.backdrop.parentElement, f.body);
  assert.equal(f.body.dataset.historyQuickPortal, 'body');
  f.events.length = 0;
  f.controller.setOpen(true);
  assert.equal(f.state.open, true);
  assert.equal(f.state.desktop, true);
  assert.equal(f.attributes.get('aria-modal'), 'false');
  assert.equal(f.backdrop.hidden, true);
  assert(f.events.indexOf('prepare') < f.events.indexOf('show'));
  f.opened();
  f.controller.toggle();
  assert.equal(f.state.closing, true);
  const staleClose = f.closeCallback();
  f.controller.toggle();
  staleClose();
  assert.equal(f.state.open, true);
  assert.equal(f.panel.hidden, false);
  assert(!f.events.includes('release'));
  f.events.length = 0;
  f.controller.setOpen(false);
  assert(f.events.indexOf('finish-edit') < f.events.indexOf('remember'));
  f.closed();
  assert(f.events.indexOf('capture') < f.events.indexOf('release'));
  assert(f.events.indexOf('release') < f.events.indexOf('restore'));
  assert.equal(f.panel.hidden, true);
  assert.equal(f.state.desktop, false);
  assert.equal(f.attributes.get('opener-aria-expanded'), 'false');
  assert(!f.classes.has('history-quick-panel-closing'));

  f.controller.setOpen(true);
  f.controller.resize();
  assert(f.events.includes('position'));
  f.viewport(false, 620);
  f.controller.resize();
  assert.equal(f.state.closing, true);
  f.closed();
  f.controller.setOpen(true);
  assert.equal(f.backdrop.hidden, false);
  f.controller.resize();
  assert.equal(f.state.open, true);
  f.viewport(true, 621);
  f.controller.resize();
  assert.equal(f.state.closing, true);
  f.closed();
  f.controller.setOpen(true);
  f.events.length = 0;
  f.controller.dismiss();
  assert.equal(f.panel.hidden, true);
  assert(f.events.indexOf('cancel-return') < f.events.indexOf('capture'));
  const closedEvents = f.events.length;
  f.controller.dismiss();
  assert.equal(f.events.length, closedEvents);

  const immediate = fixture(true);
  immediate.controller.setOpen(true);
  immediate.controller.setOpen(false);
  assert.equal(immediate.state.closing, false);
  assert(!immediate.classes.has('history-quick-panel-closing'));
  immediate.events.length = 0;
  immediate.controller.setOpen(false);
  assert.deepEqual(immediate.events, ['finish-edit']);
});

test('date estimate result only renders supplied strings inside its mounted root', () => {
  const source = readFileSync(path.join(repository, 'src/components/date-estimate-result/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateDateEstimateResult');
  const fields = ['dateLabel', 'stateLabel', 'income', 'work', 'daily', 'month'];
  const ids = ['historyDateHeading', 'historyDateState', 'historyDateIncome', 'historyDateWork', 'historyDateDaily', 'historyDateMonth'];
  function fixture() {
    const queries = [], writes = [];
    const nodes = Object.fromEntries(ids.map(id => [`#${id}`, { textContent: 'unchanged' }]));
    const root = { hidden: true, querySelector: selector => { queries.push(selector); return nodes[selector]; } };
    const component = create({ root, writeText: (node, text) => { writes.push(text); node.textContent = text; } });
    return { root, nodes, queries, writes, component };
  }
  const a = fixture(), b = fixture();
  const values = Object.fromEntries(fields.map(field => [field, `<${field}> formatted text`]));
  a.component.update(values);
  assert.equal(a.writes.length, 0);
  a.component.mount();
  a.component.mount();
  b.component.mount();
  assert.deepEqual(a.queries, ids.map(id => `#${id}`));
  a.component.update(values);
  assert.equal(a.root.hidden, false);
  assert.deepEqual(a.writes, fields.map(field => values[field]));
  assert(Object.values(b.nodes).every(node => node.textContent === 'unchanged'));
  assert.equal(b.root.hidden, true);
  a.component.clear();
  assert.equal(a.root.hidden, true);
  assert.deepEqual(Object.values(a.nodes).map(node => node.textContent), fields.map(field => values[field]));
  a.component.destroy();
  a.root.hidden = false;
  a.component.clear();
  a.component.update(Object.fromEntries(fields.map(field => [field, 'not mounted'])));
  assert.equal(a.root.hidden, false);
  assert.equal(a.writes.length, 6);
  a.component.mount();
  a.component.update(values);
  assert.equal(a.queries.length, 12);
  assert.equal(a.writes.length, 12);
});

test('income rate summary renders supplied strings without touching inputs or visibility', () => {
  const source = readFileSync(path.join(repository, 'src/components/income-rate-summary/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateIncomeRateSummary');
  const fields = ['context', 'daily', 'hourly'];
  const ids = ['incomeCalculationDate', 'incomeCalculationDaily', 'incomeCalculationHourly'];
  function fixture() {
    const queries = [], writes = [];
    const nodes = Object.fromEntries(ids.map(id => [`#${id}`, { textContent: 'unchanged' }]));
    const root = { hidden: true, querySelector: selector => { queries.push(selector); return nodes[selector]; } };
    const component = create({ root, writeText: (node, text) => { writes.push(text); node.textContent = text; } });
    return { root, nodes, queries, writes, component };
  }
  const a = fixture(), b = fixture();
  const values = { context: '<supplied context>', daily: '—', hourly: '¥100.00' };
  a.component.update(values);
  assert.equal(a.writes.length, 0);
  a.component.mount();
  a.component.mount();
  b.component.mount();
  assert.deepEqual(a.queries, ids.map(id => `#${id}`));
  a.component.update(values);
  assert.deepEqual(a.writes, fields.map(field => values[field]));
  assert.equal(a.root.hidden, true);
  assert(Object.values(b.nodes).every(node => node.textContent === 'unchanged'));
  a.component.destroy();
  a.component.update({ context: 'not mounted', daily: 'not mounted', hourly: 'not mounted' });
  assert.equal(a.writes.length, 3);
  a.component.mount();
  a.component.update(values);
  assert.equal(a.queries.length, 6);
  assert.equal(a.writes.length, 6);
  assert.equal(a.root.hidden, true);
});

test('income mode switch only paints supplied selection and owns one set of click listeners', () => {
  const source = readFileSync(path.join(repository, 'src/components/income-mode-switch/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateIncomeModeSwitch');
  const modes = ['fixed-monthly', 'annual-average', 'fixed-daily'];
  const listeners = new Map();
  const calls = [];
  let bindings = 0;
  const listen = (button, type, callback) => {
    assert.equal(type, 'click');
    bindings++;
    if (!listeners.has(button)) listeners.set(button, new Set());
    listeners.get(button).add(callback);
    return () => listeners.get(button).delete(callback);
  };
  const click = button => { for (const callback of listeners.get(button) || []) callback(); };
  function fixture() {
    const queries = [], writes = [];
    const buttons = modes.map(mode => {
      const classes = new Set(), attributes = new Map();
      return { dataset: { incomeMode: mode }, classes, attributes,
        classList: { toggle: (name, value) => { if (value) classes.add(name); else classes.delete(name); writes.push([mode, name, value]); } },
        setAttribute: (name, value) => { attributes.set(name, value); writes.push([mode, name, value]); } };
    });
    const component = create({ root: { querySelectorAll: selector => { queries.push(selector); return buttons; } } });
    return { component, buttons, queries, writes };
  }
  const a = fixture(), b = fixture();
  a.component.bind(listen, mode => calls.push(['unmounted', mode]));
  a.component.updateSelection('annual-average');
  assert.equal(bindings, 0);
  assert.equal(a.writes.length, 0);
  a.component.mount();
  a.component.mount();
  b.component.mount();
  assert.deepEqual(a.queries, ['[data-income-mode]']);
  a.component.updateSelection('annual-average');
  assert.deepEqual(a.buttons.map(button => button.classes.has('active')), [false, true, false]);
  assert.deepEqual(a.buttons.map(button => button.attributes.get('aria-pressed')), ['false', 'true', 'false']);
  assert.equal(b.writes.length, 0);
  a.component.bind(listen, mode => calls.push(['obsolete', mode]));
  a.component.bind(listen, mode => calls.push(['a', mode]));
  b.component.bind(listen, mode => calls.push(['b', mode]));
  assert(a.buttons.every(button => listeners.get(button).size === 1));
  click(a.buttons[1]);
  click(a.buttons[1]);
  a.buttons[1].dataset.incomeMode = 'host-validates-this';
  click(a.buttons[1]);
  click(b.buttons[0]);
  assert.deepEqual(calls, [['a', 'annual-average'], ['a', 'annual-average'], ['a', 'host-validates-this'], ['b', 'fixed-monthly']]);
  assert.equal(a.writes.length, 6);
  a.component.destroy();
  a.component.destroy();
  a.component.updateSelection('fixed-daily');
  a.component.bind(listen, mode => calls.push(['unmounted-again', mode]));
  click(a.buttons[2]);
  assert.equal(a.writes.length, 6);
  assert(a.buttons.every(button => listeners.get(button).size === 0));
  assert.equal(calls.length, 4);
  assert(b.buttons.every(button => listeners.get(button).size === 1));
  a.component.mount();
  a.component.bind(listen, mode => calls.push(['remounted', mode]));
  a.component.updateSelection('fixed-daily');
  click(a.buttons[2]);
  assert.equal(a.queries.length, 2);
  assert.equal(a.writes.length, 12);
  assert.deepEqual(calls.at(-1), ['remounted', 'fixed-daily']);
});

test('income view tabs render selection and forward native click and keyboard requests', () => {
  const source = readFileSync(path.join(repository, 'src/components/income-view-tabs/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateIncomeViewTabs');
  const listeners = new Map();
  const calls = [];
  const listen = (tab, type, callback) => {
    if (!listeners.has(tab)) listeners.set(tab, new Map());
    const events = listeners.get(tab);
    if (!events.has(type)) events.set(type, new Set());
    const callbacks = events.get(type);
    callbacks.add(callback);
    return () => callbacks.delete(callback);
  };
  const emit = (tab, type, key) => {
    const event = { key, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
    for (const callback of listeners.get(tab)?.get(type) || []) callback(event);
    return [event.prevented, event.stopped];
  };
  function fixture(prefix) {
    const queries = [], focus = [], resolved = [];
    const panels = new Map();
    const tabs = ['config', 'estimate'].map((view, index) => {
      const id = `${prefix}-${view}`;
      panels.set(id, { hidden: index !== 0 });
      const attrs = new Map([['aria-controls', id], ['aria-selected', String(index === 0)]]);
      return { dataset: { incomeView: view }, tabIndex: index === 0 ? 0 : -1,
        getAttribute: name => attrs.get(name), setAttribute: (name, value) => attrs.set(name, value),
        focus: options => focus.push([view, options.preventScroll]) };
    });
    const component = create({ root: { querySelectorAll: selector => { queries.push(selector); return tabs; } },
      resolvePanel: id => { resolved.push(id); return panels.get(id); } });
    const selection = () => tabs.map(tab => [tab.getAttribute('aria-selected'), tab.tabIndex, panels.get(tab.getAttribute('aria-controls')).hidden]);
    return { component, queries, focus, resolved, tabs, selection };
  }
  const a = fixture('a'), b = fixture('b');
  a.component.updateSelection('estimate', true);
  a.component.bind(listen, () => calls.push(['unmounted']));
  assert.equal(listeners.size, 0);
  assert.equal(a.resolved.length, 0);
  a.component.mount();
  a.component.mount();
  b.component.mount();
  assert.deepEqual(a.queries, ['[role="tab"]']);
  a.component.updateSelection('estimate', true);
  assert.deepEqual(a.selection(), [['false', -1, true], ['true', 0, false]]);
  assert.deepEqual(a.resolved, ['a-config', 'a-estimate']);
  assert.deepEqual(a.focus, [['estimate', true]]);
  assert.deepEqual(b.selection(), [['true', 0, false], ['false', -1, true]]);
  assert.equal(b.resolved.length, 0);
  a.component.bind(listen, () => calls.push(['obsolete']));
  a.component.bind(listen, (...args) => calls.push(['a', ...args]));
  b.component.bind(listen, (...args) => calls.push(['b', ...args]));
  assert.deepEqual(emit(a.tabs[0], 'click'), [false, false]);
  emit(a.tabs[0], 'click');
  assert.deepEqual(emit(a.tabs[0], 'keydown', 'ArrowLeft'), [true, true]);
  assert.deepEqual(emit(a.tabs[1], 'keydown', 'ArrowRight'), [true, true]);
  assert.deepEqual(emit(a.tabs[1], 'keydown', 'Home'), [true, true]);
  assert.deepEqual(emit(a.tabs[0], 'keydown', 'End'), [true, true]);
  for (const key of ['Tab', 'Escape', 'Enter', ' ', 'ArrowUp']) {
    assert.deepEqual(emit(a.tabs[0], 'keydown', key), [false, false]);
  }
  assert.deepEqual(calls, [['a', 'config'], ['a', 'config'], ['a', 'estimate', true],
    ['a', 'config', true], ['a', 'config', true], ['a', 'estimate', true]]);
  a.component.destroy();
  a.component.destroy();
  a.component.updateSelection('config', true);
  emit(a.tabs[0], 'click');
  assert.deepEqual(emit(a.tabs[0], 'keydown', 'End'), [false, false]);
  assert.deepEqual(a.selection(), [['false', -1, true], ['true', 0, false]]);
  assert.equal(calls.length, 6);
  assert(a.tabs.every(tab => [...listeners.get(tab).values()].every(callbacks => callbacks.size === 0)));
  emit(b.tabs[1], 'click');
  assert.deepEqual(calls.at(-1), ['b', 'estimate']);
  a.component.mount();
  a.component.bind(listen, (...args) => calls.push(['remounted', ...args]));
  a.component.updateSelection('config');
  emit(a.tabs[1], 'keydown', 'Home');
  assert.equal(a.queries.length, 2);
  assert.deepEqual(a.focus, [['estimate', true]]);
  assert.deepEqual(a.selection(), [['true', 0, false], ['false', -1, true]]);
  assert.deepEqual(calls.at(-1), ['remounted', 'config', true]);
});

test('income drafts keep independent raw inputs, unchanged comparison rules and recoverable snapshots', () => {
  const source = readFileSync(path.join(repository, 'src/components/income-drafts/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateIncomeDrafts');
  const modes = ['fixed-monthly', 'annual-average', 'fixed-daily'];
  const saved = { monthlyIncome: 7296.7, dailyIncome: 405.37, annualWorkDays: 260 };
  let fields = { amount: '7296.70', days: '260' };
  const drafts = create({ modes, readFields: () => fields });
  const restored = create({ modes, readFields: () => ({ amount: '', days: '0' }) });
  drafts.reset(saved);
  restored.reset(saved);
  const baseline = drafts.key('fixed-monthly');
  fields = { amount: '7296.7', days: '200' };
  assert.equal(drafts.key('fixed-monthly'), baseline);
  assert.equal(restored.get('fixed-monthly').days, '260');

  fields = { amount: '11700.00', days: '260' };
  drafts.capture('fixed-monthly');
  fields = { amount: '13000', days: '240' };
  drafts.capture('annual-average');
  fields = { amount: '', days: '0' };
  const record = { mode: 'fixed-daily', modes: drafts.snapshot('fixed-daily') };
  assert.notEqual(drafts.key('fixed-daily'), baseline);
  assert.deepEqual(structuredClone(record.modes), {
    'fixed-monthly': { amount: '11700.00', days: '260' },
    'annual-average': { amount: '13000', days: '240' },
    'fixed-daily': { amount: '', days: '0' },
  });
  assert.equal(restored.get('annual-average').amount, '7296.70');
  assert(restored.accepts(record));
  assert(!restored.accepts({ ...record, mode: 'unknown' }));
  assert(!restored.accepts({ ...record, modes: {} }));
  for (const invalid of [{ amount: 1 }, { amount: '1'.repeat(65) }, { days: '1'.repeat(17) }]) {
    const malformed = structuredClone(record);
    Object.assign(malformed.modes['fixed-daily'], invalid);
    assert(!restored.accepts(malformed));
  }

  restored.restore(record.modes);
  record.modes['annual-average'].amount = '1';
  restored.get('fixed-monthly').amount = '2';
  assert.equal(drafts.get('annual-average').amount, '13000');
  assert.equal(restored.get('annual-average').amount, '13000');
  assert.equal(restored.get('fixed-monthly').amount, '11700.00');
  assert.equal(restored.get('fixed-daily').amount, '');
  assert.equal(restored.get('fixed-daily').days, '0');
  drafts.clear();
  assert.equal(drafts.key('fixed-daily'), '["fixed-daily",[null,null,null]]');
  drafts.reset(saved);
  assert.equal(drafts.get('fixed-daily').amount, '405.37');
});

test('income fields present supplied values, limits and workdays inside their own panel', () => {
  const source = readFileSync(path.join(repository, 'src/components/income-fields/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateIncomeFields');
  const limits = { minimum: 0.01, maximum: 1000000000, decimals: 2 };
  function fixture() {
    const nodes = Object.fromEntries(['incomeAmountLabel', 'incomeAmountInput', 'annualWorkDaysInput',
      'annualWorkDaysField', 'monthlyWorkDaysField', 'monthlyWorkDaysValue', 'incomeModeHelp']
      .map(id => [id, {}]));
    const queries = [];
    const attributes = new Map();
    const root = {
      querySelector(selector) { queries.push(selector); return nodes[selector.slice(1)]; },
      toggleAttribute(name, enabled) { if (enabled) attributes.set(name, ''); else attributes.delete(name); },
    };
    const component = create({ root, writeText: (node, text) => { node.textContent = text; } });
    return { nodes, queries, attributes, component };
  }
  const a = fixture(), b = fixture();
  const values = { amount: '11700.00', days: '240' };
  a.component.update('fixed-monthly', values, limits);
  assert.equal(a.nodes.incomeAmountInput.value, undefined);
  a.component.mount();
  a.component.mount();
  b.component.mount();
  assert.equal(a.queries.length, 7);
  for (const [mode, label, help, monthly] of [
    ['fixed-monthly', '月薪到手', '按当月工作日折算', true],
    ['annual-average', '月薪到手', '按全年工作日均摊', false],
    ['fixed-daily', '日薪到手', '每个工作日固定计薪', false],
  ]) {
    a.component.update(mode, values, limits);
    assert.equal(a.nodes.incomeAmountLabel.textContent, label);
    assert.equal(a.nodes.incomeModeHelp.textContent, help);
    assert.equal(a.nodes.annualWorkDaysField.hidden, monthly);
    assert.equal(a.nodes.monthlyWorkDaysField.hidden, !monthly);
    assert.equal(a.attributes.has('data-monthly'), monthly);
    assert.deepEqual(a.nodes.incomeAmountInput, { value: '11700.00', min: '0.01', max: '1000000000', step: '0.01' });
    assert.equal(a.nodes.annualWorkDaysInput.value, '240');
  }
  a.component.update('fixed-daily', { amount: '', days: '0' }, { minimum: 0.125, maximum: 17, decimals: 3 });
  assert.deepEqual(a.nodes.incomeAmountInput, { value: '', min: '0.125', max: '17', step: '0.001' });
  assert.equal(a.nodes.annualWorkDaysInput.value, '0');
  a.component.updateMonthlyWorkdays(21);
  assert.equal(a.nodes.monthlyWorkDaysValue.textContent, '21');
  assert.deepEqual(b.nodes.incomeAmountInput, {});
  assert.deepEqual(b.nodes.monthlyWorkDaysValue, {});
  a.component.destroy();
  a.component.update('fixed-monthly', values, limits);
  a.component.updateMonthlyWorkdays(18);
  assert.equal(a.nodes.incomeAmountLabel.textContent, '日薪到手');
  assert.equal(a.nodes.monthlyWorkDaysValue.textContent, '21');
  a.component.mount();
  a.component.updateMonthlyWorkdays(18);
  assert.equal(a.nodes.monthlyWorkDaysValue.textContent, '18');
});

test('income settings assembles and rebinds its mounted components without clearing drafts', async () => {
  const { html } = await buildDevelopHtml();
  const start = html.indexOf('function createIncomeSettings(');
  const end = html.indexOf('\nconst incomeSettings = createIncomeSettings(', start);
  assert(start >= 0 && end > start);
  const create = runInNewContext(html.slice(start, end) + '\ncreateIncomeSettings');
  const modeButton = { dataset: { incomeMode: 'fixed-daily' } };
  const tabs = ['config', 'estimate'].map(incomeView => ({
    dataset: { incomeView },
    getAttribute: () => incomeView,
    setAttribute() {},
  }));
  const modeRoot = { querySelectorAll: () => [modeButton] };
  const panels = new Map(tabs.map(tab => [tab.dataset.incomeView, { hidden: false }]));
  const monthlyValue = {};
  const hourlyValue = {};
  const roots = {
    '.income-mode-segments': modeRoot,
    '#incomeConfigView': { querySelector: selector => selector === '#monthlyWorkDaysValue' ? monthlyValue : {} },
    '.income-view-tabs': { querySelectorAll: () => tabs },
    '.income-rate-summary': { querySelector: selector => selector === '#incomeCalculationHourly' ? hourlyValue : {} },
  };
  const income = create({
    root: { querySelector: selector => roots[selector] },
    resolvePanel: id => panels.get(id),
    modes: ['fixed-monthly', 'annual-average', 'fixed-daily'],
    readFields: () => ({ amount: '650', days: '250' }),
    writeText: (node, text) => { node.textContent = text; },
  });
  assert.equal(income.modeRoot, modeRoot);
  income.drafts.reset({ monthlyIncome: 7296.7, dailyIncome: 405.37, annualWorkDays: 260 });
  income.drafts.capture('fixed-daily');
  income.mount();
  income.mount();
  income.tabs.updateSelection('estimate');
  assert.equal(panels.get('config').hidden, true);
  assert.equal(panels.get('estimate').hidden, false);
  income.fields.updateMonthlyWorkdays(18);
  income.summary.update({ hourly: '¥62.36' });
  assert.equal(monthlyValue.textContent, '18');
  assert.equal(hourlyValue.textContent, '¥62.36');

  const listeners = new Map();
  const listen = (node, type, callback) => {
    if (!listeners.has(node)) listeners.set(node, new Set());
    const entry = { type, callback };
    listeners.get(node).add(entry);
    return () => listeners.get(node).delete(entry);
  };
  const clicks = [];
  const click = node => {
    for (const entry of listeners.get(node)) if (entry.type === 'click') entry.callback();
  };
  const callbacks = { onSelectView: view => clicks.push(view), onSelectMode: mode => clicks.push(mode) };
  const outdated = () => assert.fail('Previous click handler was not removed');
  income.bind(listen, { onSelectView: outdated, onSelectMode: outdated });
  income.bind(listen, callbacks);
  click(tabs[1]);
  click(modeButton);
  assert.deepEqual(clicks, ['estimate', 'fixed-daily']);
  income.destroy();
  income.destroy();
  assert([...listeners.values()].every(set => set.size === 0));
  income.fields.updateMonthlyWorkdays(30);
  income.summary.update({ hourly: '¥100.00' });
  assert.equal(monthlyValue.textContent, '18');
  assert.equal(hourlyValue.textContent, '¥62.36');
  assert.equal(income.drafts.get('fixed-daily').amount, '650');
  income.mount();
  income.bind(listen, callbacks);
  click(tabs[0]);
  click(modeButton);
  assert.deepEqual(clicks, ['estimate', 'fixed-daily', 'config', 'fixed-daily']);
  income.destroy();
});

test('schedule calibration summary formats supplied durations and respects supplied validity', () => {
  const source = readFileSync(path.join(repository, 'src/components/schedule-calibration-summary/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateScheduleCalibrationSummary');
  function fixture() {
    const morning = {}, afternoon = {}, total = {};
    const summary = create({ morning, afternoon, total, writeText: (node, text) => { node.textContent = text; } });
    return { summary, read: () => [morning.textContent, afternoon.textContent, total.textContent] };
  }
  const a = fixture(), b = fixture();
  a.summary.update(9000, 14400, true);
  assert.deepEqual(a.read(), ['2小时30分', '4小时', '6小时30分']);
  a.summary.update(9059.9, 61.25, true);
  assert.deepEqual(a.read(), ['2小时30分', '1分钟', '2小时32分']);
  a.summary.update(0, 14400, false);
  assert.deepEqual(a.read(), ['—', '4小时', '等待校准']);
  a.summary.update(3600, 3600, false);
  assert.deepEqual(a.read(), ['1小时', '1小时', '等待校准']);
  assert.deepEqual(b.read(), [undefined, undefined, undefined]);
});

test('calendar status renders a supplied calendar and reports errors without changing its heading', () => {
  const source = readFileSync(path.join(repository, 'src/components/calendar-status/index.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateCalendarStatus');
  function fixture() {
    const attributes = new Map();
    const nodes = {
      '#calendarDataMeta': { setAttribute: (name, value) => attributes.set(name, value) },
      '#calendarDataBadge': {},
      '#calendarDataStatus': {},
    };
    const view = create({ root: { querySelector: selector => nodes[selector] },
      writeText: (node, text) => { node.textContent = text; } });
    const values = () => Object.values(nodes).map(node => node.textContent);
    return { view, values, attributes };
  }
  const a = fixture(), b = fixture();
  const coverage = { start: '2026-01-01', end: '2026-12-31', label: 'Test calendar', version: 'test-v1' };
  const builtin = { coverage, holidays: ['2026-10-29'], specialWorkdays: [], origin: 'builtin' };
  const imported = { ...builtin, coverage: { ...coverage, end: '2027-12-31' }, origin: 'imported' };
  a.view.update(builtin);
  assert.deepEqual(a.values(), ['2026 年', '内置', '']);
  a.view.update(imported, 'loaded-draft');
  assert.deepEqual(a.values(), ['2026—2027 年', '已导入', '已载入日历，保存后生效。']);
  const label = 'Test calendar，2026-01-01 至 2027-12-31，1 个休息日，0 个调休工作日';
  assert.equal(a.attributes.get('aria-label'), label);
  for (const [kind, message] of [
    ['import-failed', '导入失败：test'],
    ['export-failed', '导出失败：test'],
  ]) {
    a.view.setStatus(kind, 'test');
    assert.deepEqual(a.values(), ['2026—2027 年', '已导入', message]);
    assert.equal(a.attributes.get('aria-label'), label);
  }
  for (const [kind, message] of [
    ['validated-and-saved', '日历 test-v1 已校验并保存。'],
    ['applied-for-page', '日历 test-v1 已在当前页面生效。'],
    ['reset-builtin', '已恢复内置日历清单。'],
    ['reset-for-page', '已在当前页面恢复内置日历，但未能清除浏览器中的旧数据。'],
    ['draft-restored', '草稿已恢复，保存后生效。'],
    ['exported-draft', '已导出当前面板的日历。'],
    ['schedule-and-calendar-saved', '工作时间和日历已保存。'],
    ['selected-builtin', '已选择内置日历，保存后生效。'],
    ['already-builtin', '当前已是内置日历。'],
  ]) {
    a.view.update(builtin, kind);
    assert.deepEqual(a.values(), ['2026 年', '内置', message]);
  }
  a.view.update(builtin);
  assert.deepEqual(a.values(), ['2026 年', '内置', '']);
  assert.deepEqual(b.values(), [undefined, undefined, undefined]);
});

test('schedule settings assembles both displays and wires calendar controls through the supplied listener', async () => {
  const { html } = await buildDevelopHtml();
  const start = html.indexOf('function createScheduleSettings(');
  const end = html.indexOf('\nconst scheduleSettings = createScheduleSettings(', start);
  assert(start >= 0 && end > start);
  const create = runInNewContext(html.slice(start, end) + '\ncreateScheduleSettings');
  const calls = [];
  const file = { name: 'calendar.json' };
  const nodes = {
    '#calendarDataMeta': { setAttribute() {} },
    '#calendarDataBadge': {},
    '#calendarDataStatus': {},
    '#calendarExportButton': {},
    '#calendarImportButton': {},
    '#calendarImportInput': { files: [file], click: () => calls.push('picker') },
    '#calendarResetButton': {},
  };
  const calibration = { morning: {}, afternoon: {}, total: {} };
  const settings = create({
    calibration, calendarRoot: { querySelector: selector => nodes[selector] },
    writeText: (node, text) => { node.textContent = text; },
  });
  settings.summary.update(9000, 14400, true);
  settings.calendar.update({
    coverage: { start: '2026-01-01', end: '2027-12-31', label: 'Test', version: 'test-v1' },
    holidays: [], specialWorkdays: [], origin: 'imported',
  }, 'loaded-draft');
  assert.equal(calibration.total.textContent, '6小时30分');
  assert.equal(nodes['#calendarDataBadge'].textContent, '已导入');
  assert.equal(settings.importButton, nodes['#calendarImportButton']);
  assert.equal(settings.importInput, nodes['#calendarImportInput']);

  const listeners = [];
  settings.bindCalendarActions((node, type, handle) => listeners.push({ node, type, handle }), {
    onExport: () => calls.push('export'),
    onImport: selected => calls.push(selected),
    onReset: () => calls.push('reset'),
  });
  assert.deepEqual(listeners.map(({ node, type }) => [node, type]), [
    [nodes['#calendarExportButton'], 'click'],
    [settings.importButton, 'click'],
    [settings.importInput, 'change'],
    [nodes['#calendarResetButton'], 'click'],
  ]);
  assert.deepEqual(calls, []);
  for (const { handle } of listeners) handle();
  assert.deepEqual(calls, ['export', 'picker', file, 'reset']);
});

test('schedule wheels replace the old group, forward edits, and release every wheel once', () => {
  const source = readFileSync(path.join(repository, 'src/components/schedule-settings/wheels.js'), 'utf8');
  const create = runInNewContext(source + '\ncreateScheduleWheels');
  const node = () => ({
    children: [], dataset: {},
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.append(child); },
    setAttribute() {},
    replaceChildren(...fragments) { this.children = fragments.flatMap(fragment => fragment.children); },
  });
  const hosts = { '#scheduleMorningWheels': node(), '#scheduleAfternoonWheels': node() };
  const fields = ['morningStart', 'morningEnd', 'afternoonStart', 'afternoonEnd'].map(key => ({ key, title: key }));
  const created = [], disposed = [], actions = [];
  const grid = {
    ownerDocument: { createDocumentFragment: node, createElement: node },
    querySelector: selector => hosts[selector],
    querySelectorAll: () => Object.values(hosts),
  };
  const group = create({
    grid, fields, splitTime: value => value,
    createWheel(options) {
      const wheel = { ...options, element: node(), destroy: () => disposed.push(wheel),
        focus: () => actions.push(['focus', options.key, options.unit]),
        openEditor: text => actions.push(['editor', options.key, options.unit, text]) };
      created.push(wheel);
      return wheel;
    },
    onChange: (...args) => actions.push(['change', ...args]),
  });
  const schedule = Object.fromEntries(fields.map(({ key }, index) => [key, { hour: 9 + index, minute: index }]));
  group.mount(schedule);
  assert.equal(group.getCount(), 8);
  assert.deepEqual(Object.values(hosts).map(host => host.children.map(card => card.dataset.timeKey)),
    [['morningStart', 'morningEnd'], ['afternoonStart', 'afternoonEnd']]);
  group.focusFirst();
  group.restoreEditor({ key: 'afternoonEnd', unit: 'minute', text: '42' });
  created[7].onChange(42);
  assert.deepEqual(actions, [
    ['focus', 'morningStart', 'hour'],
    ['editor', 'afternoonEnd', 'minute', '42'],
    ['change', 'afternoonEnd', 'minute', 42],
  ]);
  created[7].animationFrame = 1;
  assert.equal(group.isMoving(), true);
  group.mount(schedule);
  assert.deepEqual(disposed, created.slice(0, 8));
  assert.equal(group.getCount(), 8);
  assert.equal(group.isMoving(), false);
  group.destroy();
  group.destroy();
  assert.deepEqual(disposed, created);
  assert.equal(group.getCount(), 0);
  assert(Object.values(hosts).every(host => host.children.length === 0));
});

test('schedule draft validation shares one parse for durations and the first violation', () => {
  const source = readFileSync(path.join(repository, 'src/components/schedule-settings/validation.js'), 'utf8');
  const evaluate = runInNewContext(source + '\nevaluateScheduleDraft');
  const original = { morningStart: 32400, morningEnd: 41400, afternoonStart: 48600, afternoonEnd: 63000 };
  const cases = [
    [{}, [9000, 14400], null],
    [{ afternoonStart: 41400 }, [9000, 21600], null],
    [{ morningEnd: 32400, afternoonEnd: 48600 }, [0, 0], { key: 'morningEnd', message: '上午结束必须晚于上午开始。' }],
    [{ morningEnd: 32340 }, [0, 14400], { key: 'morningEnd', message: '上午结束必须晚于上午开始。' }],
    [{ afternoonStart: 41340, afternoonEnd: 41340 }, [9000, 0], { key: 'afternoonStart', message: '下午开始不能早于上午结束。' }],
    [{ afternoonEnd: 48600 }, [9000, 0], { key: 'afternoonEnd', message: '下午结束必须晚于下午开始。' }],
  ];
  for (const [overrides, durations, expected] of cases) {
    const schedule = Object.freeze({ ...original, ...overrides });
    const parsed = [];
    const result = evaluate(schedule, value => { parsed.push(value); return value; });
    assert.deepEqual(parsed, Object.values(schedule));
    assert.deepEqual([result.morningSeconds, result.afternoonSeconds], durations);
    assert.deepEqual(result.violation ? { ...result.violation } : null, expected);
  }
  const failure = new Error('Invalid time');
  assert.throws(() => evaluate(original, () => { throw failure; }), error => error === failure);
});

test('history dial geometry gives cardinal coordinates and bounded SVG arcs without browser state', () => {
  const source = readFileSync(path.join(repository, 'src/components/history-dial-geometry/index.js'), 'utf8');
  const { point, arc } = runInNewContext(source + '\n({ point, arc })');
  for (const [seconds, x, y] of [
    [0, 140, 28], [21600, 252, 140], [43200, 140, 252],
    [64800, 28, 140], [86400, 140, 28],
  ]) {
    const actual = point(seconds);
    assert(Math.abs(actual[0] - x) < 1e-9 && Math.abs(actual[1] - y) < 1e-9);
  }
  assert.equal(point(0, 124)[1], 16);
  assert.equal(arc(1, 1), '');
  assert.equal(arc(2, 1), '');
  assert.equal(arc(0, 21600), 'M140 28A112 112 0 0 1 252 140');
  assert.match(arc(0, 43200), /A112 112 0 0 1 /);
  assert.match(arc(0, 43201), /A112 112 0 1 1 /);
  assert.equal(arc(0, 86400), arc(0, 86399.99));
});

test('component data is validated as JSON and item prices remain positive numbers', async t => {
  const invalid = fixture(t, { 'src/page.html': '/* @include data.json */\n', 'src/data.json': '{ invalid }' });
  await assert.rejects(buildDevelopHtml({ projectRoot: invalid }), SyntaxError);
  const items = JSON.parse(readFileSync(path.join(repository, 'src/components/fun-conversions/items.json'), 'utf8'));
  assert(Array.isArray(items) && items.length > 0);
  for (const item of items) {
    assert.equal(typeof item.emoji, 'string');
    assert.equal(typeof item.name, 'string');
    assert(Number.isFinite(item.price) && item.price > 0);
  }
});
