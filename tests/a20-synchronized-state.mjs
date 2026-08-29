import assert from 'node:assert/strict';
import M from '../ascension-model.js';

// 2026-08-29 reported game state after correcting the optimizer's A19 -> game A20 mismatch.
// The game screenshots show 5e17 as the next Ascension requirement, 159.22M Core left,
// Core [28,31,28,9,18], Slowdown Lv17, Danger Close ON, and these Ingot Upgrade levels.
const input={
  goal:'ascension',objective:'ascensionEta',ascensionCount:20,totalCore:M.totalCoreForAscension(20),
  heldIngots:9.26e16,totalIngotsEarned:M.prestigeTotalIngotsEarnedFromMultiplier(14.21e6),prestigeMultiplier:14.21e6,prestigeCount:1,
  currentCoreLevels:[28,31,28,9,18],currentSlowdownLevel:17,compressionEnabled:true,normalAutoUnlocked:true,
  bombUnlocked:true,dangerEnabled:true,instancePlayerCount:1,incomeBoostActive:false,expBoostActive:false,
  ingotLevels:[41,47,47,49,10,45,17,46],maxTargetLevel:7000,discardedAscensions:52,maxLevelEver:9485,
  oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5
};

assert.equal(M.nextAscensionRequirement(input.ascensionCount),5e17);
assert.equal(M.totalCoreForAscension(20)-M.coreBundleCost(input.currentCoreLevels),159222419);
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.plan,'synchronized A20 state must produce a plan');
assert.deepEqual(result.plan.core,[28,31,28,9,18]);
assert.equal(M.slowdownLevel(result.plan.slowdown),17);
assert.ok(result.plan.oneShotRatio>1);
const roadmap=M.optimizeIngotUpgrades(input,result,M.DEFAULT_MEASUREMENTS,192);
assert.equal(roadmap.steps.length,0,'already purchased Ingot upgrades should not be undone or repurchased');
assert.deepEqual(roadmap.targetLevels,input.ingotLevels);
console.log(JSON.stringify({core:result.plan.core,slowdownLevel:M.slowdownLevel(result.plan.slowdown),targetLevel:result.plan.targetLevel,totalEta:result.plan.totalEta,oneShotRatio:result.plan.oneShotRatio},null,2));
