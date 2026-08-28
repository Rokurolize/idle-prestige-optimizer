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

const highCapital={objective:'ascensionEta',ascensionCount:10,totalCore:M.totalCoreForAscension(10),heldIngots:755230000000,totalIngotsEarned:878442660921,prestigeCount:18,currentCoreLevels:[13,15,11,9,8],currentSlowdownLevel:8,normalAutoUnlocked:true,ingotLevels:[33,36,33,34,16,27,17,28],maxTargetLevel:3600,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5};
const reducedHigh=M.optimizeAscension(highCapital,M.DEFAULT_MEASUREMENTS),exhaustiveHigh=M.optimizeAscension({...highCapital,exhaustiveCoreIngotSearch:true},M.DEFAULT_MEASUREMENTS);
assert.ok(reducedHigh.plan&&exhaustiveHigh.plan);
for(const key of ['strategyMode','slowdown','targetLevel','actualPrestigeLevel','totalEta'])assert.deepEqual(reducedHigh.plan[key],exhaustiveHigh.plan[key],`reduced Core-Ingot search must preserve high-capital ${key}`);
assert.deepEqual(reducedHigh.plan.core,exhaustiveHigh.plan.core);
assert.deepEqual(reducedHigh.plan.prestigeCore,exhaustiveHigh.plan.prestigeCore);

const a7={objective:'ascensionEta',ascensionCount:7,totalCore:2186,heldIngots:0,totalIngotsEarned:2e9,prestigeCount:0,currentCoreLevels:[0,0,0,0,0],currentSlowdownLevel:0,normalAutoUnlocked:true,ingotLevels:M.DEFAULT_INGOT_LEVELS.slice(),maxTargetLevel:1400,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5};
const reducedA7=M.optimizeAscension(a7,M.DEFAULT_MEASUREMENTS),exhaustiveA7=M.optimizeAscension({...a7,exhaustiveCoreIngotSearch:true},M.DEFAULT_MEASUREMENTS);
assert.equal(reducedA7.plan.totalEta,exhaustiveA7.plan.totalEta);
assert.deepEqual(reducedA7.plan.core,exhaustiveA7.plan.core);
assert.deepEqual(reducedA7.plan.prestigeCore,exhaustiveA7.plan.prestigeCore);
assert.equal(reducedA7.plan.slowdown,exhaustiveA7.plan.slowdown);

console.log(JSON.stringify({cacheReuse:cachedA===cachedB,plan:{core:wide.plan.core,prestigeCore:wide.plan.prestigeCore,slowdown:wide.plan.slowdown,targetLevel:wide.plan.targetLevel,totalEta:wide.plan.totalEta},coreIngotReduction:{a7:reducedA7.plan.totalEta,highCapital:reducedHigh.plan.totalEta}},null,2));
