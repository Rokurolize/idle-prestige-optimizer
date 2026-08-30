import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve(import.meta.dirname,'..'),files=new Set(['ascension-model.js','ascension-worker.js']);
const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><script src="/ascension-model.js"></script>');return}
  const name=req.url.split('?')[0].slice(1);if(!files.has(name)){res.statusCode=404;res.end();return}
  res.setHeader('content-type','application/javascript');res.end(fs.readFileSync(path.join(root,name)));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {port}=server.address(),browser=await chromium.launch({headless:true}),page=await browser.newPage();
try{
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!!window.CrushAscensionOptimizer);
  const output=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const M=window.CrushAscensionOptimizer,input={goal:'singularity',ascensionCount:51,discardedAscensions:52,maxLevelEver:9485,compressionLockedLevel:9485,compressionEnabled:true,totalCore:M.totalCoreForAscension(51),heldIngots:8.53e33,totalIngotsEarned:M.prestigeTotalIngotsEarnedFromMultiplier(44.38e12),prestigeCount:4,currentCoreLevels:[78,79,79,9,47],currentSlowdownLevel:46,ingotLevels:Array(8).fill(0),nextRequirement:2e35,normalAutoUnlocked:true,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1,manualClickRate:4,uiClickRate:4},started=performance.now(),worker=new Worker(`ascension-worker.js?v=${encodeURIComponent(M.MODEL_REVISION)}`),timer=setTimeout(()=>{worker.terminate();reject(new Error('A500 worker smoke timed out'))},10000);
    worker.onmessage=e=>{const msg=e.data||{};if(msg.type==='error'){clearTimeout(timer);worker.terminate();reject(new Error(msg.error));return}if(msg.type!=='result'||msg.goal!=='singularity')return;clearTimeout(timer);worker.terminate();resolve({milliseconds:performance.now()-started,result:msg.result,modelRevision:msg.modelRevision})};
    worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(new Error(e.message||'worker error'))};worker.postMessage({type:'optimize',id:1,goal:'singularity',modelRevision:M.MODEL_REVISION,input,measurements:M.DEFAULT_MEASUREMENTS});
  }));
  const bad=[];function scan(value,path='result'){if(typeof value==='number'&&!Number.isFinite(value))bad.push(`${path}=${value}`);else if(value===undefined)bad.push(`${path}=undefined`);else if(Array.isArray(value))value.forEach((v,i)=>scan(v,`${path}[${i}]`));else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))scan(v,`${path}.${k}`)}scan(output.result);
  assert.equal(output.modelRevision,'r82-runtime-20260830b');assert.ok(output.milliseconds<10000);assert.ok(output.result?.plan?.closedLoop);assert.ok(Number.isFinite(output.result.plan.totalOverlapSeconds));assert.equal(output.result.plan.campaign.legacyPrunedByLowerBound,true);assert.deepEqual(bad,[],'worker result must not contain NaN/Infinity/undefined');
  console.log(JSON.stringify({milliseconds:output.milliseconds,totalSeconds:output.result.plan.totalOverlapSeconds,edges:output.result.plan.campaign.edgeEvaluations,legacyLowerBoundSeconds:output.result.plan.campaign.legacyLowerBoundSeconds},null,2));
}finally{await browser.close();server.close()}
