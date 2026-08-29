import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';

const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,'..');
const BASELINE_COMMIT='4567b00b3d33ab83603735e544fa84f99ac5a9f4';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'idle-prestige-roadmap-bench-'));

function loadBaseline(){
  const source=execFileSync('git',['show',`${BASELINE_COMMIT}:ascension-model.js`],{cwd:root,encoding:'utf8'}),file=path.join(tmp,'ascension-model.cjs');
  fs.writeFileSync(file,source);
  return require(file);
}

const baseline=loadBaseline();
const current=require('../ascension-model.js');
function fixture(M){return {objective:'ascensionEta',ascensionCount:17,totalCore:M.totalCoreForAscension(17),heldIngots:0,totalIngotsEarned:0,prestigeCount:0,normalAutoUnlocked:false,ingotLevels:Array(8).fill(0),maxTargetLevel:4750,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5}}
function run(M){const input=fixture(M),result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS),started=performance.now(),roadmap=M.optimizeIngotUpgrades(input,result,M.DEFAULT_MEASUREMENTS,192),ms=performance.now()-started;return {ms,roadmap}}
try{
  const oldRun=run(baseline),newRun=run(current),speedup=oldRun.ms/newRun.ms;
  assert.ok(oldRun.roadmap.steps.length>0,'baseline fixture must exercise the purchase planner');
  assert.ok(newRun.roadmap.steps.length>0,'current fixture must exercise the purchase planner');
  assert.deepEqual(newRun.roadmap.targetLevels,[0,44,0,1,0,38,17,38]);
  assert.equal(newRun.roadmap.plannedEta,2824.25);
  assert.ok(speedup>=10,`Ingot roadmap must be >=10x faster than ${BASELINE_COMMIT}: ${speedup.toFixed(2)}x (${oldRun.ms.toFixed(1)} -> ${newRun.ms.toFixed(1)} ms)`);
  console.log(JSON.stringify({baselineCommit:BASELINE_COMMIT,baseline:{ms:oldRun.ms,levels:oldRun.roadmap.targetLevels,eta:oldRun.roadmap.plannedEta},current:{ms:newRun.ms,levels:newRun.roadmap.targetLevels,eta:newRun.roadmap.plannedEta,nodes:newRun.roadmap.nodesEvaluated,replans:newRun.roadmap.replans},speedup},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
