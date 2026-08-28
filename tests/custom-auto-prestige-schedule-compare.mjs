import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const input={
  goal:'ascension',objective:'ascensionEta',ascensionCount:17,totalCore:129140162,
  heldIngots:43904,totalIngotsEarned:125344325741636,prestigeCount:0,
  currentCoreLevels:[0,25,0,0,0],currentSlowdownLevel:15,normalAutoUnlocked:true,
  ingotLevels:[0,45,44,44,0,39,17,39],maxTargetLevel:4750,
  oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,
  hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,
  nextRequirement:7000000000000000,measurements:M.DEFAULT_MEASUREMENTS
};

const optimized=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS),plan=optimized.fixedPlan;
assert.ok(plan);
assert.equal(plan.targetLevel,4082);
assert.deepEqual(plan.prestigeSchedule.map(x=>[x.targetLevel,x.runs]),[[4082,11],[50,14]]);
assert.equal(plan.totalEta,2547.25);

assert.equal(typeof M.evaluateAutoPrestigeScheduleSetting,'function',
  'the AP comparison needs a schedule-aware evaluator, not the all-runs fixed-AP evaluator');
const compared=M.evaluateAutoPrestigeScheduleSetting(input,plan.core,input.ingotLevels,optimized.calibration,4082,plan.slowdown,plan.prestigeCore);
assert.deepEqual(compared.prestigeSchedule.map(x=>[x.targetLevel,x.runs]),[[4082,11],[50,14]],
  'matching the recommended deep AP must preserve the fast Lv50 Prestige-count fillers');
assert.equal(compared.totalEta,plan.totalEta,
  'entering the recommended AP and Slowdown in the comparison must reproduce the displayed recommended ETA');

const allRunsFixed=M.evaluateAutoPrestigeSetting(input,plan.core,input.ingotLevels,optimized.calibration,4082,plan.slowdown,plan.prestigeCore);
assert.deepEqual(allRunsFixed.prestigeSchedule.map(x=>[x.targetLevel,x.runs]),[[4082,25]]);
assert.equal(allRunsFixed.totalEta,5347.25,
  'the legacy low-level evaluator intentionally means every Prestige uses the same AP');

const manualInput={goal:'ascension',objective:'ascensionEta',ascensionCount:12,totalCore:531440,heldIngots:3040000000000,totalIngotsEarned:3107712975044,prestigeCount:2,currentCoreLevels:[16,0,16,9,11],currentSlowdownLevel:10,normalAutoUnlocked:true,ingotLevels:[0,35,30,34,0,28,17,25],maxTargetLevel:3500,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,nextRequirement:20000000000000,measurements:M.DEFAULT_MEASUREMENTS};
const manualOptimized=M.optimizeAscension(manualInput,M.DEFAULT_MEASUREMENTS),manualPlan=manualOptimized.plan,manualCompared=M.evaluateAutoPrestigeScheduleSetting(manualInput,manualPlan.core,manualInput.ingotLevels,manualOptimized.calibration,manualPlan.targetLevel,manualPlan.slowdown,manualPlan.prestigeCore);
assert.equal(manualOptimized.recommendedMode,'manual');
assert.equal(manualCompared.totalEta,manualPlan.totalEta,'schedule-aware comparison must also reproduce a manual-Core recommendation');
assert.deepEqual(manualCompared.prestigeSchedule.map(x=>[x.targetLevel,x.runs]),manualPlan.prestigeSchedule.map(x=>[x.targetLevel,x.runs]));

console.log(JSON.stringify({recommended:{eta:plan.totalEta,schedule:plan.prestigeSchedule.map(x=>[x.targetLevel,x.runs])},scheduleCompare:{eta:compared.totalEta,schedule:compared.prestigeSchedule.map(x=>[x.targetLevel,x.runs])},allRunsFixed:{eta:allRunsFixed.totalEta,schedule:allRunsFixed.prestigeSchedule.map(x=>[x.targetLevel,x.runs])},manual:{eta:manualPlan.totalEta,compareEta:manualCompared.totalEta,schedule:manualCompared.prestigeSchedule.map(x=>[x.targetLevel,x.runs])}},null,2));
