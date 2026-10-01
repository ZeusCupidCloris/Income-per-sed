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
  vm.runInContext(source.replace(/await main\(\)\s*$/, '') + '\nthis.api={readSettingsResult,saveSettings,createWidget,findLatestHtmlPath,nextRefreshDate,defaults:DEFAULTS,main,editSettings,openFullPage};', context);
  return {api:context.api,files};
}
test('missing config is first use; valid legacy config remains supported', () => {
  const {api}=load(); assert.equal(api.readSettingsResult().status,'missing');
  assert.equal(load(JSON.stringify(api.defaults)).api.readSettingsResult().status,'ok');
  assert.equal(load(JSON.stringify({monthlyIncome:8000})).api.readSettingsResult().status,'ok');
});

function transaction(failure) {
  const defaults = load().api.defaults;
  const original = JSON.stringify(defaults);
  const target = '/local/IncomeWidget-settings.json';
  const files = new Map([[target, original]]);
  const manager = {
    documentsDirectory: () => '/local', joinPath: (a,b) => `${a}/${b}`,
    fileExists: p => files.has(p), readString: p => { if (!files.has(p)) throw Error('missing'); return files.get(p); },
    writeString(p,v) {
      if (failure === 'temp' && p.endsWith('.tmp')) { files.set(p,'{'); throw Error('temp failed'); }
      if (failure === 'rollback' && p === target) throw Error('rollback failed');
      if (failure === 'backup' && p.endsWith('.previous')) { files.set(p,'{'); throw Error('backup failed'); }
      files.set(p,v);
    },
    remove: p => files.delete(p),
    move(a,b) {
      files.set(b, files.get(a)); files.delete(a);
      if (['replace','rollback'].includes(failure)) { files.set(b,'{'); throw Error('replace failed'); }
      if (failure === 'verify') files.set(b,'{}');
    }
  };
  const api = load(undefined,false,{FileManager:{local:()=>manager}}).api;
  return {api,files,original,target,defaults};
}

test('temporary write and replacement failures preserve previous configuration', () => {
  for (const failure of ['temp','backup','replace','verify']) {
    const f = transaction(failure);
    assert.throws(() => f.api.saveSettings({...f.defaults,monthlyIncome:9000}));
    assert.equal(f.files.get(f.target),f.original);
    assert.equal(f.api.readSettingsResult().settings.monthlyIncome,f.defaults.monthlyIncome);
    assert.equal(f.files.has(`${f.target}.tmp`),false);
  }
});

test('failed rollback remains recoverable without overwriting damaged primary', () => {
  const f = transaction('rollback');
  assert.throws(() => f.api.saveSettings({...f.defaults,monthlyIncome:9000}));
  const result = f.api.readSettingsResult();
  assert.equal(result.recovered,true);
  assert.equal(result.settings.monthlyIncome,f.defaults.monthlyIncome);
  assert.equal(f.files.get(f.target),'{');
  assert.equal(f.files.get(`${f.target}.previous`),f.original);
  assert.throws(() => f.api.saveSettings({...f.defaults,monthlyIncome:9500}));
  assert.equal(f.files.get(`${f.target}.previous`),f.original);
});

test('successful replacement is verified and removes temporary recovery data', () => {
  const f = transaction();
  assert.equal(f.api.saveSettings({...f.defaults,monthlyIncome:9000}).monthlyIncome,9000);
  assert.equal(f.api.readSettingsResult().settings.monthlyIncome,9000);
  assert.equal(f.files.size,1);
});

test('first-use failed replacement never leaves a broken primary file', () => {
  const f = transaction('replace');
  f.files.clear();
  assert.throws(() => f.api.saveSettings(f.defaults));
  assert.equal(f.api.readSettingsResult().status,'missing');
  assert.equal(f.files.size,0);
});

test('all widget families constrain long text and extraLarge has a dedicated layout', () => {
  const roots=[];
  class Item {
    constructor(text){this.text=text;this.children=[];}
    addStack(){const item=new Item();this.children.push(item);return item;}
    addText(text){const item=new Item(text);this.children.push(item);return item;}
    addImage(){const item=new Item();this.children.push(item);return item;}
    addSpacer(){} setPadding(...values){this.padding=values;}
    centerAlignContent(){} layoutVertically(){} centerAlignText(){} rightAlignText(){}
  }
  class ListWidget extends Item { constructor(){super();roots.push(this);} }
  class Size {constructor(width,height){this.width=width;this.height=height;}}
  const noop = class { constructor(){return new Proxy(this,{get:(o,k)=>k in o?o[k]:()=>({})});} };
  const api=load(undefined,false,{ListWidget,Size,Point:Size,Rect:noop,Path:noop,DrawContext:noop,LinearGradient:class{},
    Font:new Proxy({},{get:(_,key)=>size=>({key,size})})}).api;
  const data={statusKey:'working',status:'工作中',calendarCovered:true,updatedLabel:'截至 23:59',progress:1,monthProgress:1,
    todayIncome:12000000000,daily:12000000000,secondly:512820.5128,monthEarned:264000000000,
    nextAction:{value:'明日 09:00',label:'下次上班时间将在下一个工作日开始'},goalLabel:'今日目标',elapsed:23400,
    workdays:22,year:2026,month:9,day:7,workday:true};
  function all(node){return [node,...node.children.flatMap(all)];}
  for(const family of ['small','medium','large','extraLarge']){
    const tree=api.createWidget(data,family);
    const items=all(tree);
    for(const item of items.filter(i=>i.text && i.text!=='●')) assert.equal(item.lineLimit,1,`${family}: ${item.text}`);
    assert.ok(items.some(i=>i.text && /亿/.test(i.text)),family);
    for (const item of items.filter(i=>i.text && (i.text.startsWith('¥') || i.text.startsWith('本月累计 ¥')))) {
      assert.ok(item.text.length<=19,`${family}: ${item.text}`);
      assert.ok(item.minimumScaleFactor>=0.68);
    }
  }
  assert.notDeepEqual(roots[1].padding,roots[3].padding);
  assert.ok(all(roots[3]).some(i=>i.imageSize && i.imageSize.width===124));
  for (const statusKey of ['not-started','break','ended','day-off']) {
    for (const family of ['small','medium','large','extraLarge']) {
      const items=all(api.createWidget({...data,statusKey},family));
      assert.ok(items.some(i=>i.text && /亿/.test(i.text)),`${statusKey}/${family}`);
      for (const item of items.filter(i=>i.text && i.text.length>20)) {
        assert.equal(item.lineLimit,1);
        assert.ok(item.minimumScaleFactor>=0.68,`${statusKey}/${family}: ${item.text}`);
      }
    }
  }
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
