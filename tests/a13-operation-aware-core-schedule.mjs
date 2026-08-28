import assert from 'node:assert/strict';
import M from '../ascension-model.js';

const input={
  objective:'ascensionEta',
  ascensionCount:13,
  totalCore:1594322,
  heldIngots:362,
  totalIngotsEarned:3234110507566,
  prestigeCount:25,
  currentCoreLevels:[18,0,18,9,12],
  currentSlowdownLevel:11,
  normalAutoUnlocked:true,
  ingotLevels:[0,41,11,36,0,31,17,34],
  maxTargetLevel:4100,
  oneShotMargin:1,
  strictOneShot:true,
  dpsCalibration:1,
  damageBoostMultiplier:1,
  hpCalibration:1,
  manualClickRate:4,
  uiClickRate:4,
  normalAutoUpdatesPerSecond:36.5,
};

const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.equal(result.recommendedMode,'manual');
assert.ok(result.manualPlan,'A13 diagnostic must have a manual plan');

// Independent exhaustive neighborhood check over Income 0..20, Damage 18..19,
// Cost 0..9, Feed 11..12, Prestige-Ingot 19..20 and Slowdown 1e7/1e8 finds
// [13,0,18,9,12] at 2543.25s. The optimizer must never return the old
// 2655.5-second physical-Pareto plan or a weaker point on that checked region.
assert.ok(result.manualPlan.totalEta<=2543.25+1e-9,
  `operation-aware manual plan must match or beat the checked 2543.25s boundary; got ${result.manualPlan.totalEta}`);
assert.deepEqual(result.manualPlan.core,[13,0,18,9,12]);
assert.equal(result.manualPlan.gameEta,2379);
assert.equal(result.manualPlan.interactionClicks,657);
assert.deepEqual(result.manualPlan.prestigeSchedule.map(x=>x.prestigeCore),[[13,20,17,9,11],[0,20,0,0,0]]);

console.log(JSON.stringify({
  totalEta:result.manualPlan.totalEta,
  gameEta:result.manualPlan.gameEta,
  interactionClicks:result.manualPlan.interactionClicks,
  runCore:result.manualPlan.core,
  prestigeCore:result.manualPlan.prestigeCore,
  slowdown:result.manualPlan.slowdown,
  schedule:result.manualPlan.prestigeSchedule,
},null,2));
