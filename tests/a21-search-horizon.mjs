import assert from 'node:assert/strict';
import M from '../ascension-model.js';

const input={
  objective:'ascensionEta',ascensionCount:21,totalCore:10460353202,
  heldIngots:746e15,totalIngotsEarned:276991679474000100,prestigeCount:2,
  currentCoreLevels:[27,33,27,9,19],currentSlowdownLevel:19,
  compressionEnabled:true,normalAutoUnlocked:true,bombUnlocked:false,dangerEnabled:false,
  instancePlayerCount:1,incomeBoostActive:false,expBoostActive:false,
  ingotLevels:[39,53,53,55,0,47,17,47],maxTargetLevel:10000,
  discardedAscensions:52,maxLevelEver:9485,oneShotMargin:1,strictOneShot:true,
  dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,
  manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,
  nextRequirement:2e18,skipManual:true
};

const fast=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(fast.fixedPlan);
assert.deepEqual(fast.fixedPlan.core,[27,33,29,9,18]);
assert.equal(M.slowdownLevel(fast.fixedPlan.slowdown),18);
assert.equal(fast.fixedPlan.targetLevel,6453);
assert.equal(fast.fixedPlan.actualPrestigeLevel,6453);
assert.equal(fast.fixedPlan.totalEta,1524.25);
assert.deepEqual(fast.fixedPlan.prestigeSchedule.map(x=>[x.targetLevel,x.actualPrestigeLevel,x.runs]),[[6453,6453,4],[50,59,19]]);
assert.deepEqual(fast.fixedPlan.coreIngotPrunedLevels.map(x=>x.level),[32,31]);
for(const row of fast.fixedPlan.coreIngotPrunedLevels)assert.ok(row.lowerBound>=fast.fixedPlan.totalEta,`Core-Ingot Lv${row.level} lower bound must prove it cannot win`);

// Differential guard: disabling the Core-Ingot band proof must produce the same
// fixed optimum when the three legacy search bands are all evaluated explicitly.
const exhaustive=M.optimizeAscension({...input,fixedCoreIngotLevels:[33,32,31],disableCoreIngotBandPruning:true},M.DEFAULT_MEASUREMENTS);
assert.deepEqual(exhaustive.fixedPlan.core,fast.fixedPlan.core);
assert.equal(exhaustive.fixedPlan.slowdown,fast.fixedPlan.slowdown);
assert.equal(exhaustive.fixedPlan.targetLevel,fast.fixedPlan.targetLevel);
assert.equal(exhaustive.fixedPlan.totalEta,fast.fixedPlan.totalEta);

// Manual-Core search is not merely omitted for speed: its impossible-physics lower
// bound already exceeds the exact fixed result for this reported A21 state.
const manualBound=M.manualCoreEtaLowerBound(input,M.DEFAULT_MEASUREMENTS,fast.calibration,input.ingotLevels,input.totalCore,fast.fixedPlan.totalEta);
assert.equal(manualBound.coreIngotLevel,33);
assert.equal(manualBound.eta,1532);
assert.ok(manualBound.eta>fast.fixedPlan.totalEta);

console.log(JSON.stringify({
  fixed:{core:fast.fixedPlan.core,slowdownLevel:M.slowdownLevel(fast.fixedPlan.slowdown),targetLevel:fast.fixedPlan.targetLevel,totalEta:fast.fixedPlan.totalEta},
  prunedCoreIngotBands:fast.fixedPlan.coreIngotPrunedLevels,
  manualLowerBound:manualBound
},null,2));
