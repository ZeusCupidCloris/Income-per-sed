const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(raw, readFails = false, extras = {}) {
  const files = new Map(raw === undefined ? [] : [['/local/IncomeWidget-settings.json', raw]]);
  const fm = { documentsDirectory: () => '/local', joinPath: (a,b) => `${a}/${b}`,
    fileExists: p => files.has(p), readString: p => { if(readFails) throw Error('unavailable'); return files.get(p); },
    writeString: () => { throw Error('Unexpected write'); } };
  class Color { static dynamic(a) { return a; } }
  const context = vm.createContext({Color, Date, console, FileManager: { local: () => fm }, ...extras});
  const source = fs.readFileSync(path.join(__dirname, '../IncomeWidget.js'), 'utf8');
  vm.runInContext(source.replace(/await main\(\)\s*$/, '') + '\nthis.api={readSettingsResult,findLatestHtmlPath,nextRefreshDate,defaults:DEFAULTS,main,editSettings,openFullPage};', context);
  return {api:context.api,files};
}
test('missing config is first use; valid legacy config remains supported', () => {
  const {api}=load(); assert.equal(api.readSettingsResult().status,'missing');
  assert.equal(load(JSON.stringify(api.defaults)).api.readSettingsResult().status,'ok');
  assert.equal(load(JSON.stringify({monthlyIncome:8000})).api.readSettingsResult().status,'ok');
});
test('invalid widget shows an action but never a default income',async()=>{
  const texts=[];let widget;
  class ListWidget {setPadding(){} addSpacer(){} addText(text){texts.push(text);return {};}}
  const api=load('{',false,{ListWidget,Font:{mediumSystemFont(){},systemFont(){}},args:{},config:{runsInWidget:true},
    Script:{name:()=> 'IncomeWidget',setWidget:w=>widget=w,complete(){}}}).api;
  await api.main();assert.deepEqual(texts,['配置需检查','轻点设置工资与工作时段']);assert.match(widget.url,/action=settings/);
});
test('failed settings write does not announce success',async()=>{
  const alerts=[];
  class Alert {
    constructor(){this.values=[];alerts.push(this);}
    addAction(){} addCancelAction(){} addTextField(_,value){this.values.push(value);}
    textFieldValue(i){return this.values[i];} async presentSheet(){return 0;} async presentAlert(){return 0;}
  }
  const defaults=load().api.defaults;
  await load(JSON.stringify(defaults),false,{Alert}).api.editSettings();
  assert.equal(alerts.at(-1).title,'保存失败');assert.ok(!alerts.some(a=>a.title==='已保存'));
});
test('iCloud download failure is reported instead of opening a stale file',async()=>{
  const alerts=[];
  class Alert {constructor(){alerts.push(this);}addAction(){}async presentAlert(){return 0;}}
  const defaults=load().api.defaults;
  const manager={documentsDirectory:()=>'/cloud',joinPath:(a,b)=>`${a}/${b}`,fileExists:()=>true,isFileDownloaded:()=>false,
    async downloadFileFromiCloud(){throw Error('offline');}};
  const local={documentsDirectory:()=>'/local',joinPath:(a,b)=>`${a}/${b}`,fileExists:()=>true,readString:()=>JSON.stringify(defaults)};
  await load(undefined,false,{Alert,FileManager:{local:()=>local,iCloud:()=>manager},WebView:class{}}).api.openFullPage();
  assert.equal(alerts.at(-1).title,'HTML 打开失败');
});
test('damaged config is never silently accepted or overwritten', () => {
  for(const raw of ['{','null','[]','{}','{"monthlyIncome":-1}','{"incomeMode":"unknown","monthlyIncome":8000}',
    '{"monthlyIncome":8000,"schedule":{"morningStart":"18:00"}}']) {
    const {api,files}=load(raw); assert.equal(api.readSettingsResult().status,'error',raw);
    assert.equal(files.get('/local/IncomeWidget-settings.json'),raw);
  }
  assert.equal(load('{}',true).api.readSettingsResult().status,'error');
});
test('only exact Push name is selected', () => {
  const {api}=load(); const manager={joinPath:(a,b)=>`${a}/${b}`,fileExists:p=>p.endsWith('Push(2).html')};
  assert.equal(api.findLatestHtmlPath(manager,'/cloud'),null);
  manager.fileExists=p=>p.endsWith('/Income-per-sed-Push.html');
  assert.equal(api.findLatestHtmlPath(manager,'/cloud'),'/cloud/Income-per-sed-Push.html');
});
test('refresh request respects near boundaries without promising iOS delivery', () => {
  const {api}=load(); const now=new Date('2026-09-07T01:00:00Z');
  for(const [seconds,status,next] of [[32399,'not-started','09:00'],[41399,'working','11:30'],[48599,'break','13:30'],[62999,'working','17:30']]) {
    const delay=api.nextRefreshDate({statusKey:status,secondsOfDay:seconds,nextAction:{value:next}},now)-now;
    assert.ok(delay>0 && delay<=5000,`boundary delay ${delay}`);
  }
  assert.equal(api.nextRefreshDate({statusKey:'working',secondsOfDay:40000},now)-now,60000);
});
