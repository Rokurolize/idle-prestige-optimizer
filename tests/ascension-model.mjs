import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

assert.equal(M.totalCoreForAscension(7),2186);
assert.equal(M.nextAscensionRequirement(7),10_000_000_000);
assert.equal(M.maxCoreLevel(1,2186),11);
assert.equal(M.coreCost(1,11),2047);
assert.equal(M.prestigeGain(460,9),40_023_552);
assert.equal(M.prestigeGain(460,11),160_094_208);
assert.equal(M.ingotEffect(4,10),1);
assert.equal(M.ingotEffect(4,11),1,'Gem chance is capped at 1.0%');
assert.equal(M.ingotEffect(6,17),0,'Stall duration reaches zero at Lv17');

const cal=M.fitCalibration(M.DEFAULT_MEASUREMENTS);
assert.ok(cal.physicalCap>=15&&cal.physicalCap<=20,`unexpected physical cap ${cal.physicalCap}`);
assert.ok(cal.rmse<1.5,`calibration RMSE too large: ${cal.rmse}`);
for(const row of M.DEFAULT_MEASUREMENTS){
  const curve=M.simulateCurve({maxTarget:row.targetLevel,core:row.core,ingot:row.ingot,slowdown:row.slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:row.totalIngotsEarned});
  const predicted=cal.intercept+cal.scale*curve.times[row.targetLevel];
  assert.ok(Math.abs(predicted-row.seconds)<2,`${row.label}: predicted ${predicted}, observed ${row.seconds}`);
}

const input={ascensionCount:7,totalCore:2186,heldIngots:0,totalIngotsEarned:2e9,prestigeCount:0,maxTargetLevel:1400,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,ingotLevels:M.DEFAULT_INGOT_LEVELS.slice()};
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.plan,'optimizer should return a feasible A7 plan');
assert.equal(result.selectedIngotLevel,11,'A7 must retain the maximum feasible Core Ingot level');
assert.equal(result.backedOff,0);
assert.equal(result.plan.core[1],11);
assert.ok(M.coreBundleCost(result.plan.core)<=2186);
assert.ok(result.plan.oneShotRatio>=1);
assert.ok(M.SLOWDOWN.includes(result.plan.slowdown));
assert.ok(result.plan.targetLevel>=50&&result.plan.targetLevel<=1400);
assert.ok(result.plan.gain>0&&result.plan.seconds>0&&result.plan.eta>0);

const fresh={...input,totalIngotsEarned:0,ingotLevels:Array(8).fill(0)};
const freshResult=M.optimizeAscension(fresh,M.DEFAULT_MEASUREMENTS);
const ingotPlan=M.optimizeIngotUpgrades(fresh,freshResult,M.DEFAULT_MEASUREMENTS,24);
assert.ok(ingotPlan.steps.length>0,'fresh Ascension should produce an Ingot purchase plan');
assert.ok(ingotPlan.targetLevels.some((v,i)=>v>fresh.ingotLevels[i]));

console.log(JSON.stringify({
  calibration:{physicalCap:cal.physicalCap,rmse:cal.rmse},
  a7:{core:result.plan.core,slowdown:result.plan.slowdown,targetLevel:result.plan.targetLevel,seconds:result.plan.seconds,gain:result.plan.gain},
  freshFirst:ingotPlan.steps[0]
},null,2));
