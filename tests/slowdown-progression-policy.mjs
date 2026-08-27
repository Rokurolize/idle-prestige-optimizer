import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

// A4 live state reported by the player. At maximum Normal Feed this setup only
// keeps the game's 20 top-ore/s cap at Slowdown Lv1 (x2): Lv2/3/4 fall to
// 13.53 / 9.02 / 5.41 top ores/s. In the non-cap/non-floor region, spawn rate
// falls inversely with Slowdown while per-ore value/EXP rises linearly, so a
// higher Slowdown cannot improve ideal progression throughput and can only lose
// to EXP overflow, extra HP, or lower supply.
const input={
  objective:'ascensionEta',ascensionCount:4,totalCore:80,heldIngots:2650,
  totalIngotsEarned:43908,prestigeCount:0,normalAutoUnlocked:true,
  ingotLevels:[0,13,0,15,0,0,0,0],maxTargetLevel:3000,
  oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,
  manualClickRate:4,normalAutoUpdatesPerSecond:36.5
};
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.manualPlan,'A4 should have a manual-Core plan');
assert.equal(result.manualPlan.maxSupplyCappedSlowdown,2);
assert.equal(result.manualPlan.slowdown,2,'Ascension progression must not prefer a mid-band Slowdown after leaving the 20/s cap');
assert.equal(result.manualPlan.topSpawnAtTarget,20);
console.log(JSON.stringify({slowdown:result.manualPlan.slowdown,topSpawn:result.manualPlan.topSpawnAtTarget,eta:result.manualPlan.eta,core:result.manualPlan.core},null,2));
