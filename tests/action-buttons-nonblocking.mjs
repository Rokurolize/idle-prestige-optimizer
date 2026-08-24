import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repo = process.env.TEST_ROOT ? resolve(process.env.TEST_ROOT) : resolve(new URL('..', import.meta.url).pathname);
const temp = await mkdtemp(join(tmpdir(), 'action-buttons-nonblocking-'));
const httpPort = 18851;
const debugPort = 18852;
const server = spawn('python3', ['-m', 'http.server', String(httpPort), '--directory', repo], { stdio: 'ignore' });
const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${temp}`,
  `http://127.0.0.1:${httpPort}/`,
], { stdio: 'ignore' });

const sleep = ms => new Promise(resolvePromise => setTimeout(resolvePromise, ms));
async function retry(fn, attempts = 50) {
  let error;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { error = e; await sleep(100); }
  }
  throw error;
}

let ws;
let seq = 0;
const pending = new Map();
function attachSocket(socket) {
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const p = pending.get(message.id); pending.delete(message.id);
    if (message.error) p.reject(new Error(message.error.message)); else p.resolve(message.result);
  });
}
function call(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolvePromise, reject) => pending.set(id, { resolve: resolvePromise, reject }));
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed');
  return result.result.value;
}

try {
  const page = await retry(async () => {
    const r = await fetch(`http://127.0.0.1:${debugPort}/json`);
    if (!r.ok) throw new Error(`debug endpoint ${r.status}`);
    const pages = await r.json();
    const found = pages.find(p => p.url === `http://127.0.0.1:${httpPort}/`);
    if (!found) throw new Error('app page not found');
    return found;
  });
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => { ws.addEventListener('open', resolvePromise, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  attachSocket(ws);
  await call('Runtime.enable');
  await retry(async () => {
    const ready = await evaluate(`document.readyState === 'complete' && !!document.getElementById('levelUp')`);
    if (!ready) throw new Error('app not ready');
    return true;
  });
  await sleep(300);

  await evaluate(`(() => {
    const key='prestige-route-optimizer-v1';
    const st=JSON.parse(localStorage.getItem(key));
    const now=Date.now();
    st.level=49; st.cash=2e9; st.cashAuto=false; st.cashUpdatedAt=now; st.income=2e6; st.incomeMode='manual';
    st.run={id:10,startedAt:now-600000}; st.timing={level:49,startedAt:now-60000,recordedAt:null};
    st.v6={...(st.v6||{}),mode:'active',prestigeCount:9,prestigeGoal:25,ingotGoal:250,observations:[],observed:{}};
    const logs=[];
    for(let run=1;run<=9;run++){
      for(let level=35;level<=50;level++){
        const at=now-(10-run)*900000-(51-level)*70000;
        const snap={at,runId:run,type:'level_start',level,cash:1e8,dps:1000,dpsCalibration:1,permanent:{prestigeCash:1.5,prestigeDmg:1.5,refining:5.44,crush:5.44,expEff:1.44,ingots:37},upgrades:st.upgrades};
        logs.push(snap);
        logs.push({...snap,at:at+60000,type:'exp_full_level_up',detail:{from:level,to:level+1,durationMs:60000,exactTiming:true}});
      }
    }
    const recommendation={bestAffordable:{key:'speed',name:'Speed',cost:100,value:20},roiLeader:{key:'speed',name:'Speed',cost:100,value:20},nearest:null,timePlan:{first:{key:'speed',name:'Speed',cost:100,wait:0,from:20,to:21},saved:12,finish:60,baseline:72,rate:{rate:2e6,low:2e6,high:2e6,count:0,source:'manual'}},interactionGate:{seconds:2,count:20,deadlineClosed:false,investmentLevels:1},v6Shadow:{version:'6.1-shadow',status:'ok',firstDecision:{type:'purchase',key:'speed',name:'Speed',cost:100,wait:0,from:20,to:21,level:49},first:{key:'speed',name:'Speed',cost:100,wait:0,from:20,to:21},savedSeconds:12,baselineSeconds:72,finishSeconds:60,currentLevelSeconds:60,targetLevel:50,stable:true,confidence:'high',searchCheck:{shallowFirst:'purchase:speed',deepFirst:'purchase:speed',shallowSaved:12,deepSaved:12},uncertainty:{workLow:50000,workMid:60000,workHigh:70000,etaLow:50,etaMid:60,etaHigh:70,partialCurrentLevel:false},workPrior:{low:50000,mid:60000,high:70000,count:9,source:'same-level',directFraction:1},throughputMode:'modeled'}};
    for(let i=0;i<300;i++){
      const at=now-400000+i*50;
      logs.push({at,runId:10,type:'purchase',level:49,cash:2e9,dps:1000,dpsCalibration:1,permanent:{prestigeCash:1.5,prestigeDmg:1.5,refining:5.44,crush:5.44,expEff:1.44,ingots:37},upgrades:st.upgrades,observationQuality:'level_exact',observed:{cash:{value:2e9,source:'fixture'}},predicted:{cash:2e9,dps:1000,v6:recommendation.v6Shadow},modelVersion:'v5+v6-shadow',recommendation,detail:{source:'fixture',key:'speed',name:'Speed',cost:100,from:20,to:21,beforeCash:2e9,afterCash:2e9-100}});
    }
    for(let i=0;i<9000;i++){
      const run=1+(i%9),level=2+(i%63),at=now-9000000+i*700;
      if(i%8===7) logs.push({at,runId:run,type:'exp_full_level_up',level:level+1,cash:1e8,dps:1000,observationQuality:'exact',detail:{from:level,to:level+1,durationMs:60000,exactTiming:true}});
      else logs.push({at,runId:run,type:'purchase',level,cash:1e8,dps:1000,detail:{key:'speed',cost:100,from:20,to:21}});
    }
    logs.push({at:now-60000,runId:10,type:'run_state',level:49,cash:st.cash,dps:1000,dpsCalibration:1,permanent:{prestigeCash:1.5,prestigeDmg:1.5,refining:5.44,crush:5.44,expEff:1.44,ingots:37},upgrades:st.upgrades});
    st.actionLog=logs;
    const raw=JSON.stringify(st);
    localStorage.setItem(key,raw);
    localStorage.setItem(key+'-hot-v15',JSON.stringify({...st,schemaVersion:15,actionLog:logs.slice(-120),persistence:{logStore:'indexeddb-v1',logReady:false}}));
    return st.level;
  })()`);
  const created = await call('Target.createTarget', { url: `http://127.0.0.1:${httpPort}/?seeded=1` });
  const seededPage = await retry(async () => {
    const r = await fetch(`http://127.0.0.1:${debugPort}/json`);
    const pages = await r.json();
    const found = pages.find(p => p.id === created.targetId || p.url === `http://127.0.0.1:${httpPort}/?seeded=1`);
    if (!found) throw new Error('seeded page not found');
    return found;
  });
  ws.close();
  ws = new WebSocket(seededPage.webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => { ws.addEventListener('open', resolvePromise, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  attachSocket(ws);
  await call('Runtime.enable');
  await retry(async () => {
    const status = await evaluate(`({readyState:document.readyState,level:Number(document.getElementById('level')&&document.getElementById('level').value),stored:JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')||'null')?.level})`);
    const ready = status.readyState === 'complete' && status.level === 49;
    if (!ready) throw new Error('seeded app not ready: '+JSON.stringify(status));
    return true;
  });

  const live = await evaluate(`(async () => {
    const original=window.PrestigeV6.planShadow;
    let planCalls=0,planMs=0,maxLag=0,last=performance.now();
    window.PrestigeV6.planShadow=(...args)=>{const t=performance.now();try{return original(...args)}finally{planMs+=performance.now()-t;planCalls++}};
    const timer=setInterval(()=>{const now=performance.now();maxLag=Math.max(maxLag,now-last-10);last=now},10);
    await new Promise(resolve=>setTimeout(resolve,6200));
    clearInterval(timer);
    window.PrestigeV6.planShadow=original;
    return {planCalls,planMs,maxLag};
  })()`);

  const result = await evaluate(`(async () => {
    window.confirm=()=>true;
    const metrics={stringifyMs:0,parseMs:0,planMs:0,stringifyCalls:0,parseCalls:0,planCalls:0};
    const stringify=JSON.stringify.bind(JSON),parse=JSON.parse.bind(JSON),plan=window.PrestigeV6.planShadow.bind(window.PrestigeV6);
    JSON.stringify=(...args)=>{const t=performance.now();try{return stringify(...args)}finally{metrics.stringifyMs+=performance.now()-t;metrics.stringifyCalls++}};
    JSON.parse=(...args)=>{const t=performance.now();try{return parse(...args)}finally{metrics.parseMs+=performance.now()-t;metrics.parseCalls++}};
    window.PrestigeV6.planShadow=(...args)=>{const t=performance.now();try{return plan(...args)}finally{metrics.planMs+=performance.now()-t;metrics.planCalls++}};
    const measure=target=>{const el=typeof target==='string'?document.getElementById(target):target,before={...metrics},start=performance.now();el.click();const total=performance.now()-start;return {total,stringifyMs:metrics.stringifyMs-before.stringifyMs,parseMs:metrics.parseMs-before.parseMs,planMs:metrics.planMs-before.planMs,stringifyCalls:metrics.stringifyCalls-before.stringifyCalls,parseCalls:metrics.parseCalls-before.parseCalls,planCalls:metrics.planCalls-before.planCalls}};
    const upgradeButton=document.querySelector('.buy:not(:disabled)');
    const upgrade=upgradeButton?measure(upgradeButton):null;
    let postUpgradeMaxLag=0,last=performance.now();
    const postUpgradeTimer=setInterval(()=>{const now=performance.now();postUpgradeMaxLag=Math.max(postUpgradeMaxLag,now-last-10);last=now},10);
    const postUpgradeBefore={...metrics};
    await new Promise(resolve=>setTimeout(resolve,800));
    clearInterval(postUpgradeTimer);
    const postUpgrade={maxLag:postUpgradeMaxLag,planCalls:metrics.planCalls-postUpgradeBefore.planCalls,planMs:metrics.planMs-postUpgradeBefore.planMs};
    const levelUp=measure('levelUp');
    document.getElementById('level').value='50';
    const prestige=measure('newRun');
    const stored=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')||'null');
    const idbRows=await new Promise((resolve,reject)=>{const r=indexedDB.open('prestige-route-optimizer-v1-history-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const q=r.result.transaction('actions','readonly').objectStore('actions').count();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)}});
    const storageChars=(localStorage.getItem('prestige-route-optimizer-v1')||'').length;
    return {upgrade,postUpgrade,levelUp,prestige,storageChars,logRows:stored?.actionLog?.length||0,idbRows,pass:(!upgrade||upgrade.total<50)&&postUpgrade.maxLag<50&&postUpgrade.planCalls===0&&levelUp.total<50&&prestige.total<50&&(!upgrade||upgrade.planCalls===0)&&levelUp.planCalls===0&&prestige.planCalls===0&&storageChars<100000&&idbRows>9000};
  })()`);
  console.log(JSON.stringify({...result,live}));
  if (!result.pass || live.planCalls!==0 || live.maxLag>=50) process.exitCode = 1;
} finally {
  if (ws) ws.close();
  chrome.kill('SIGTERM');
  server.kill('SIGTERM');
  await Promise.race([new Promise(resolvePromise => chrome.once('exit', resolvePromise)), sleep(1000)]);
  await Promise.race([new Promise(resolvePromise => server.once('exit', resolvePromise)), sleep(1000)]);
  await retry(() => rm(temp, { recursive: true, force: true }), 10);
}
