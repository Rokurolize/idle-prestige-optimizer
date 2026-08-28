import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const curveOpts={maxTarget:700,core:[4,0,4,3,3],ingot:[0,13,0,15,0,0,0,0],slowdown:2,physicalCap:15.75,totalIngotsEarned:43908,dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,normalAutoEnabled:true,normalAutoUpdatesPerSecond:36.5,normalAutoCalibration:M.fitCalibration(M.DEFAULT_MEASUREMENTS)};
const cachedA=M.simulateCurve(curveOpts),cachedB=M.simulateCurve(curveOpts),uncached=M.simulateCurve({...curveOpts,cache:false});
assert.strictEqual(cachedA,cachedB,'identical physical curve inputs should reuse the cached curve object');
assert.notStrictEqual(cachedA,uncached,'cache:false must still force an independent physical simulation');
for(const level of [50,258,416,699]){
  assert.equal(cachedA.times[level],uncached.times[level],`cached time must be exact at Lv${level}`);
  assert.equal(cachedA.topSpawnRates[level],uncached.topSpawnRates[level],`cached supply must be exact at Lv${level}`);
  assert.equal(cachedA.dpsKillRates[level],uncached.dpsKillRates[level],`cached kill rate must be exact at Lv${level}`);
}

const base={objective:'ascensionEta',ascensionCount:4,totalCore:M.totalCoreForAscension(4),heldIngots:2650,totalIngotsEarned:43908,prestigeCount:0,currentCoreLevels:[0,6,0,0,0],currentSlowdownLevel:4,normalAutoUnlocked:true,ingotLevels:[0,13,0,15,0,0,0,0],oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5};
const wide=M.optimizeAscension({...base,maxTargetLevel:3000},M.DEFAULT_MEASUREMENTS),tight=M.optimizeAscension({...base,maxTargetLevel:1200},M.DEFAULT_MEASUREMENTS);
assert.ok(wide.plan&&tight.plan);
for(const key of ['strategyMode','slowdown','targetLevel','actualPrestigeLevel','totalEta'])assert.deepEqual(wide.plan[key],tight.plan[key],`mathematically sufficient target bound must preserve ${key}`);
assert.deepEqual(wide.plan.core,tight.plan.core);
assert.deepEqual(wide.plan.prestigeCore,tight.plan.prestigeCore);
assert.deepEqual(wide.plan.prestigeSchedule,tight.plan.prestigeSchedule);

console.log(JSON.stringify({cacheReuse:cachedA===cachedB,plan:{core:wide.plan.core,prestigeCore:wide.plan.prestigeCore,slowdown:wide.plan.slowdown,targetLevel:wide.plan.targetLevel,totalEta:wide.plan.totalEta}},null,2));
