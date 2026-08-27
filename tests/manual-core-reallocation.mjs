import assert from 'node:assert/strict';
import M from '../ascension-model.js';

const input={
  objective:'ascensionEta',
  ascensionCount:2,
  totalCore:8,
  heldIngots:379500,
  totalIngotsEarned:423114,
  prestigeCount:0,
  normalAutoUnlocked:true,
  ingotLevels:[11,15,12,12,5,0,0,0],
  maxTargetLevel:3000,
  oneShotMargin:1,
  strictOneShot:true,
  dpsCalibration:1,
  damageBoostMultiplier:1,
  hpCalibration:1,
  manualClickRate:4,
  normalAutoUpdatesPerSecond:36.5
};

const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.fixedPlan,'fixed-Core plan must remain available');
assert.ok(result.manualPlan,'manual Core-reallocation plan must be available');
assert.ok(result.manualPlan.eta<result.fixedPlan.eta,'manual reallocation must beat the fixed-Core plan for the observed A2 state');
assert.equal(result.manualPlan.core[1],0,'run Core should not waste stars on Ingot multiplier');
assert.equal(result.manualPlan.prestigeCore[1],3,'Prestige-time Core should maximize Ingot multiplier');
assert.ok(result.manualPlan.prestigeSchedule.every(x=>Array.isArray(x.runCore)&&Array.isArray(x.prestigeCore)),'manual schedule must expose both allocations');
assert.equal(result.recommendedMode,'manual');

console.log(JSON.stringify({fixed:{core:result.fixedPlan.core,eta:result.fixedPlan.eta,target:result.fixedPlan.targetLevel},manual:{core:result.manualPlan.core,prestigeCore:result.manualPlan.prestigeCore,eta:result.manualPlan.eta,target:result.manualPlan.targetLevel}},null,2));
