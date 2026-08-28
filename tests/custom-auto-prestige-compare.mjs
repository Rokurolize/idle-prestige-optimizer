import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const input={
  goal:'ascension',objective:'ascensionEta',ascensionCount:12,totalCore:531440,
  heldIngots:3040000000000,totalIngotsEarned:3107712975044,prestigeCount:2,
  currentCoreLevels:[16,0,16,9,11],currentSlowdownLevel:10,normalAutoUnlocked:true,
  ingotLevels:[0,35,30,34,0,28,17,25],maxTargetLevel:3500,
  oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,
  hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,
  nextRequirement:20000000000000,measurements:M.DEFAULT_MEASUREMENTS
};

const optimized=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS),plan=optimized.plan;
assert.ok(plan);
assert.equal(plan.totalEta,1818);
assert.deepEqual(plan.prestigeSchedule.map(x=>[x.targetLevel,x.runs]),[[2557,9],[50,14]]);
assert.equal(M.slowdownLevel(plan.slowdown),11);

const fixed2000=M.evaluateAutoPrestigeSetting(input,plan.core,input.ingotLevels,optimized.calibration,2000,plan.slowdown,plan.prestigeCore);
assert.equal(fixed2000.targetLevel,2000);
assert.equal(fixed2000.runs,23);
assert.equal(fixed2000.totalEta,2868);
assert.ok(fixed2000.totalEta>plan.totalEta);
assert.equal(fixed2000.admissible,true);

const fixed2557=M.evaluateAutoPrestigeSetting(input,plan.core,input.ingotLevels,optimized.calibration,2557,plan.slowdown,plan.prestigeCore);
assert.equal(fixed2557.runs,23);
assert.equal(fixed2557.totalEta,3512,'keeping the deep target for all 23 runs must expose the cost of not switching to Lv50 fillers');
assert.ok(fixed2557.totalEta>fixed2000.totalEta);

console.log(JSON.stringify({
  optimum:{eta:plan.totalEta,schedule:plan.prestigeSchedule.map(x=>({level:x.targetLevel,runs:x.runs})),slowdownLevel:M.slowdownLevel(plan.slowdown)},
  fixed2000:{eta:fixed2000.totalEta,penalty:fixed2000.totalEta-plan.totalEta,percent:(fixed2000.totalEta/plan.totalEta-1)*100},
  fixed2557:{eta:fixed2557.totalEta,penalty:fixed2557.totalEta-plan.totalEta}
},null,2));
