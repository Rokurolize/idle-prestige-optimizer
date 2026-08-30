import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import {chromium} from 'playwright';

const root=path.resolve(import.meta.dirname,'..');
const BASELINE_COMMIT='4567b00b3d33ab83603735e544fa84f99ac5a9f4';
const baseline={
  model:execFileSync('git',['show',`${BASELINE_COMMIT}:ascension-model.js`],{cwd:root}),
  worker:execFileSync('git',['show',`${BASELINE_COMMIT}:ascension-worker.js`],{cwd:root})
};
const current={model:fs.readFileSync(path.join(root,'ascension-model.js')),worker:fs.readFileSync(path.join(root,'ascension-worker.js'))};
const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><script src="/current/ascension-model.js"></script>');return}
  const key=req.url.split('?')[0],parts=key.split('/').filter(Boolean),set=parts[0]==='baseline'?baseline:parts[0]==='current'?current:null,file=parts[1];
  if(!set||!['ascension-model.js','ascension-worker.js'].includes(file)){res.statusCode=404;res.end();return}
  res.setHeader('content-type','application/javascript');res.end(file==='ascension-model.js'?set.model:set.worker);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {port}=server.address();
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(()=>!!window.CrushAscensionOptimizer);

const input={goal:'ascension',objective:'ascensionEta',ascensionCount:21,totalCore:10460353202,heldIngots:746e15,totalIngotsEarned:276991679474000100,prestigeMultiplier:52630000,prestigeCount:2,currentCoreLevels:[27,33,27,9,19],currentSlowdownLevel:19,compressionEnabled:true,compressionDestroyRate:13.524788260140536,normalAutoUnlocked:true,bombUnlocked:false,dangerEnabled:false,instancePlayerCount:1,incomeBoostActive:false,expBoostActive:false,ingotLevels:[39,53,53,55,0,47,17,47],discardedAscensions:52,maxLevelEver:9485,nextRequirement:2e18,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5};

async function run(kind,maxTargetLevel){
  return page.evaluate(({kind,input,maxTargetLevel})=>new Promise((resolve,reject)=>{
    const currentModel=window.CrushAscensionOptimizer,measurements=currentModel.DEFAULT_MEASUREMENTS,t0=performance.now(),worker=new Worker(`/${kind}/ascension-worker.js?v=${currentModel.MODEL_REVISION}`),timer=setTimeout(()=>{worker.terminate();reject(new Error(`${kind} benchmark timeout`))},30000);
    worker.onmessage=event=>{const msg=event.data||{},isCurrent=kind==='current';if(msg.type==='error'){clearTimeout(timer);worker.terminate();reject(new Error(msg.error));return}if(msg.type==='result'&&(!isCurrent||msg.partial)){clearTimeout(timer);const plan=msg.result&&msg.result.fixedPlan;resolve({ms:performance.now()-t0,core:plan&&plan.core,targetLevel:plan&&plan.targetLevel,totalEta:plan&&plan.totalEta,manualPruned:msg.result&&msg.result.manualPrunedByLowerBound});worker.terminate()}};
    worker.onerror=event=>{clearTimeout(timer);worker.terminate();reject(new Error(event.message||`${kind} worker error`))};
    worker.postMessage({type:'optimize',id:1,goal:'ascension',modelRevision:kind==='current'?currentModel.MODEL_REVISION:undefined,input:{...input,maxTargetLevel},measurements,maxIngotSteps:192});
  }),{kind,input,maxTargetLevel});
}

try{
  const baselineRun=await run('baseline',5750),currentRun=await run('current',10000),speedup=baselineRun.ms/currentRun.ms;
  if(baselineRun.targetLevel!==5651)throw new Error(`baseline fixture drifted: ${JSON.stringify(baselineRun)}`);
  if(currentRun.targetLevel!==5355||JSON.stringify(currentRun.core)!==JSON.stringify([27,33,27,9,19]))throw new Error(`current r82 optimum drifted: ${JSON.stringify(currentRun)}`);
  if(speedup<10)throw new Error(`10x completion condition failed: ${speedup.toFixed(2)}x (${baselineRun.ms.toFixed(1)} ms -> ${currentRun.ms.toFixed(1)} ms)`);
  console.log(JSON.stringify({baselineCommit:BASELINE_COMMIT,baseline:baselineRun,current:currentRun,speedup},null,2));
}finally{
  await browser.close();server.close();
}
