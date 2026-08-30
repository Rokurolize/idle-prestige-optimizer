import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve(import.meta.dirname,'..'),files=new Set(['ascension-model.js','ascension-worker.js']);
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><script src="/ascension-model.js"></script>');return}const name=req.url.split('?')[0].slice(1);if(!files.has(name)){res.statusCode=404;res.end();return}res.setHeader('content-type','application/javascript');res.end(fs.readFileSync(path.join(root,name)))});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {port}=server.address(),browser=await chromium.launch({headless:true}),page=await browser.newPage();
try{
  await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!!window.CrushAscensionOptimizer);
  const output=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const M=window.CrushAscensionOptimizer,input={goal:'singularity',ascensionCount:109,discardedAscensions:52,maxLevelEver:18066,compressionLockedLevel:9485,compressionEnabled:true,totalCore:M.totalCoreForAscension(109),heldIngots:M.legacyStartIngot(52),totalIngotsEarned:0,prestigeCount:0,currentCoreLevels:[156,0,154,9,56],currentSlowdownLevel:46,ingotLevels:Array(8).fill(0),nextRequirement:M.nextAscensionRequirement(109),normalAutoUnlocked:true,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,strategyStyle:'normal'},started=performance.now(),worker=new Worker(`ascension-worker.js?v=${encodeURIComponent(M.MODEL_REVISION)}`),timer=setTimeout(()=>{worker.terminate();reject(new Error('A109 final A500 worker timed out'))},10000);
    worker.onmessage=e=>{const msg=e.data||{};if(msg.type==='error'){clearTimeout(timer);worker.terminate();reject(new Error(msg.error));return}if(msg.type!=='result'||msg.goal!=='singularity'||msg.partial)return;clearTimeout(timer);worker.terminate();resolve({milliseconds:performance.now()-started,result:msg.result,modelRevision:msg.modelRevision,legacyPending:msg.legacyPending})};worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(new Error(e.message||'worker error'))};worker.postMessage({type:'optimize',id:1,goal:'singularity',modelRevision:M.MODEL_REVISION,input,measurements:M.DEFAULT_MEASUREMENTS});
  }));
  const campaign=output.result?.plan?.campaign,policy=output.result?.plan?.currentPolicy;
  assert.equal(output.modelRevision,'r82-runtime-20260831a');assert.ok(output.milliseconds<10000);assert.equal(output.legacyPending,false);assert.ok(campaign);assert.equal(campaign.legacyPrunedByLowerBound,true);assert.equal(campaign.legacySearchComplete,true);assert.ok(campaign.totalSeconds>140000&&campaign.totalSeconds<150000);assert.ok(campaign.legacyLowerBoundSeconds>campaign.totalSeconds);assert.equal(policy?.humanWorkload?.apTargetChangeClicks,0);assert.equal(policy?.humanWorkload?.coreRetained,true);
  console.log(JSON.stringify({milliseconds:output.milliseconds,totalSeconds:campaign.totalSeconds,legacyLowerBoundSeconds:campaign.legacyLowerBoundSeconds,legacyGapSeconds:campaign.legacyGapSeconds,coreRetained:policy.humanWorkload.coreRetained},null,2));
}finally{await browser.close();server.close()}
