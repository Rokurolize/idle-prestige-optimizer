import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

function optimize(input){
  const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
  return {result,roadmap:M.optimizeIngotUpgrades(input,result,M.DEFAULT_MEASUREMENTS,192)};
}

const a10={
  goal:'ascension',objective:'ascensionEta',ascensionCount:10,totalCore:59048,
  heldIngots:133240000000.00002,totalIngotsEarned:228539567801,prestigeCount:0,
  currentCoreLevels:[0,12,0,0,0],currentSlowdownLevel:8,normalAutoUnlocked:true,
  ingotLevels:[32,36,22,31,16,27,17,28],maxTargetLevel:3600,
  oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,
  hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5
};

const exact=optimize(a10);
assert.deepEqual(exact.roadmap.steps,[],
  'roadmap must not invent a +1 purchase by dropping the initial Core/Slowdown setup cost');
assert.equal(exact.roadmap.plannedEta,exact.roadmap.baselineEta);
assert.equal(exact.roadmap.timeSaved,0);
assert.equal(exact.roadmap.stopReason,'marginal_no_gain');

const afterReportedPurchase=optimize({...a10,heldIngots:176970000000,totalIngotsEarned:276564535097,ingotLevels:[33,36,22,31,16,27,17,28]});
assert.deepEqual(afterReportedPurchase.roadmap.steps,[],
  'second supplied diagnostic must not invent the follow-up damage +1 purchase either');
assert.equal(afterReportedPurchase.roadmap.timeSaved,0);

const freshA10={
  ...a10,
  heldIngots:43904,totalIngotsEarned:43904,
  currentCoreLevels:[0,12,0,0,0],currentSlowdownLevel:8,
  ingotLevels:Array(8).fill(0)
};
const fresh=optimize(freshA10);
assert.ok(fresh.roadmap.steps.length>0,'fresh A10 should have a non-empty investment roadmap');
assert.ok(fresh.result.plan.runs>fresh.roadmap.finalPlan.prestigeSchedule.reduce((sum,x)=>sum+x.runs,0),
  'post-roadmap plan should reduce the displayed Prestige-loop count');
assert.ok(fresh.roadmap.totalPlannedEta<fresh.result.plan.totalEta,
  'post-roadmap final plan should beat the pre-roadmap plan');
assert.ok(fresh.roadmap.totalPlannedEta<1900,
  'high-capital bundle planning should beat the old ~2180s sequential-beam route');
assert.ok(fresh.roadmap.targetLevels[1]>=30,
  'capitalized planning should still buy a mature EXP baseline instead of walking the low levels one by one');

const suppliedConverged=optimize({...a10,
  heldIngots:755230000000,totalIngotsEarned:878442660921,prestigeCount:18,
  currentCoreLevels:[13,15,11,9,8],currentSlowdownLevel:8,
  ingotLevels:[33,36,33,34,16,27,17,28]
});
assert.deepEqual(suppliedConverged.roadmap.steps,[],
  'the supplied post-upgrade A10 diagnostic must remain fully converged');
assert.equal(suppliedConverged.roadmap.timeSaved,0);
assert.equal(suppliedConverged.roadmap.replans,0,
  'an already-computed converged state must reuse the incoming Ascension plan instead of fully replanning');
assert.ok(suppliedConverged.roadmap.nodesEvaluated<=32,
  'mature-capital convergence should use the reduced marginal frontier rather than the old 73-node beam');

const rerun=optimize({...freshA10,
  heldIngots:fresh.roadmap.finalHeld,
  totalIngotsEarned:fresh.roadmap.finalTotalIngotsEarned,
  prestigeCount:fresh.roadmap.finalPrestigeCount,
  currentCoreLevels:fresh.roadmap.finalCurrentCoreLevels,
  currentSlowdownLevel:fresh.roadmap.finalCurrentSlowdownLevel,
  ingotLevels:fresh.roadmap.targetLevels.slice()
});
assert.deepEqual(rerun.roadmap.steps,[],
  'a converged roadmap must be idempotent when its returned final state is re-optimized');

const a15Levels=[45,44,44,44,0,39,17,39];
const suppliedA15={
  goal:'ascension',objective:'ascensionEta',ascensionCount:15,totalCore:M.totalCoreForAscension(15),
  heldIngots:3690000000000,totalIngotsEarned:M.inferTotalIngotsEarned(3690000000000,a15Levels,true),prestigeCount:3,
  currentCoreLevels:[20,23,20,9,13],currentSlowdownLevel:14,normalAutoUnlocked:true,
  ingotLevels:a15Levels,maxTargetLevel:4400,
  oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,
  hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5
};
const suppliedA15Plan=optimize(suppliedA15);
assert.equal(suppliedA15Plan.roadmap.targetLevels[4],0,
  'A15 Gem Chance roadmap must stay at Lv0 when operation-aware scheduling already reaches the 28-run ETA optimum');
assert.ok(!suppliedA15Plan.roadmap.steps.some(s=>s.index===4),
  'A15 roadmap must not buy Gem Chance when it cannot reduce total ETA');
assert.equal(suppliedA15Plan.roadmap.totalPlannedEta,6207.25);

console.log(JSON.stringify({
  exact:{steps:exact.roadmap.steps.length,baseline:exact.roadmap.baselineEta,planned:exact.roadmap.plannedEta},
  afterReportedPurchase:{steps:afterReportedPurchase.roadmap.steps.length},
  suppliedConverged:{steps:suppliedConverged.roadmap.steps.length,nodes:suppliedConverged.roadmap.nodesEvaluated,replans:suppliedConverged.roadmap.replans},
  suppliedA15:{gemLevel:suppliedA15Plan.roadmap.targetLevels[4],plannedEta:suppliedA15Plan.roadmap.totalPlannedEta},
  fresh:{initialRuns:fresh.result.plan.runs,finalRuns:fresh.roadmap.finalPlan.prestigeSchedule.reduce((sum,x)=>sum+x.runs,0),steps:fresh.roadmap.steps.length,plannedEta:fresh.roadmap.totalPlannedEta,levels:fresh.roadmap.targetLevels,rerunSteps:rerun.roadmap.steps.length}
},null,2));
