import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const input={
  goal:'ascension',objective:'ascensionEta',ascensionCount:15,totalCore:14348906,
  heldIngots:3690000000000,totalIngotsEarned:146626511742147,prestigeCount:3,
  currentCoreLevels:[20,23,20,9,13],currentSlowdownLevel:14,normalAutoUnlocked:true,
  ingotLevels:[45,44,44,44,0,39,17,39],maxTargetLevel:4400,
  oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,
  hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5
};

const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.equal(result.plan.totalRuns,28,
  'Gem Lv0 must consider the 28-run AP boundary instead of choosing the 1-second-faster 29-run game-time schedule before operation cost');
assert.equal(result.plan.totalEta,6207.25,
  'schedule selection must minimize total ETA including Core-transition operations');

const roadmap=M.optimizeIngotUpgrades(input,result,M.DEFAULT_MEASUREMENTS,192);
assert.equal(roadmap.targetLevels[4],0,
  'Gem chance must remain Lv0 when the same 28-run schedule is already available without buying Gem');
assert.ok(!roadmap.steps.some(step=>step.index===4),
  'roadmap must not attribute an AP-boundary search discontinuity to Gem chance');

console.log(JSON.stringify({
  plan:{totalRuns:result.plan.totalRuns,totalEta:result.plan.totalEta,targetLevel:result.plan.targetLevel,prestigeSchedule:result.plan.prestigeSchedule.map(x=>({targetLevel:x.targetLevel,actualPrestigeLevel:x.actualPrestigeLevel,runs:x.runs,seconds:x.seconds,role:x.role}))},
  roadmap:{steps:roadmap.steps.map(x=>({index:x.index,from:x.fromLevel,to:x.level})),targetLevels:roadmap.targetLevels,plannedEta:roadmap.plannedEta}
},null,2));
