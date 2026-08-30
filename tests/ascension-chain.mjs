import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const input={ascensionCount:7,totalCore:M.totalCoreForAscension(7),heldIngots:0,totalIngotsEarned:0,prestigeCount:0,normalAutoUnlocked:false,ingotLevels:Array(8).fill(0),dpsCalibration:1,hpCalibration:1};
const result={ascensionCount:7,nextRequirement:1000,plan:{eta:20,prestigeSchedule:[],bootstrap:{postState:{...input,normalAutoUnlocked:true}}}};
const roadmap={targetLevels:[3,4,5,6,0,0,17,0],finalHeld:900,finalTotalIngotsEarned:1500,finalPrestigeCount:24,totalPlannedEta:120,postBootstrapState:{...input,normalAutoUnlocked:true},finalPrestigeSchedule:[{runs:1,gain:100,totalGain:100,seconds:10,totalSeconds:10}]};
const completion=M.completeAscensionState(input,result,roadmap);
assert.equal(completion.completed,true);
assert.equal(completion.eta,120);
assert.equal(completion.finalState.heldIngots,1000);
assert.equal(completion.finalState.totalIngotsEarned,1600);
assert.equal(completion.finalState.prestigeCount,25);
assert.deepEqual(completion.finalState.ingotLevels,roadmap.targetLevels);
assert.equal(completion.nextState.ascensionCount,8);
assert.equal(completion.nextState.totalCore,M.totalCoreForAscension(8));
assert.equal(completion.nextState.heldIngots,0);
assert.equal(completion.nextState.totalIngotsEarned,0);
assert.equal(completion.nextState.prestigeCount,0);
assert.equal(completion.nextState.normalAutoUnlocked,true,'optimizer product flow keeps normal Upgrade Auto permanently unlocked across Ascension sync');
assert.deepEqual(completion.nextState.ingotLevels,Array(8).fill(0));

assert.equal(M.ascensionSearchMaxLevel(18,Array(8).fill(0)),5000);
assert.equal(M.ascensionSearchMaxLevel(34,Array(8).fill(0)),9000);
const target=M.optimizeTargetLevel({...input,normalAutoUnlocked:true,totalIngotsEarned:1e6},120,M.DEFAULT_MEASUREMENTS);
assert.ok(target.plan&&Number.isFinite(target.plan.seconds)&&target.plan.seconds>0);
assert.equal(target.plan.targetLevel,120);
assert.equal(target.plan.core[1],0,'a no-Prestige target run must not spend Core on Ingot gain');
assert.ok(M.SLOWDOWN.includes(target.plan.slowdown));

console.log(JSON.stringify({completion:{eta:completion.eta,held:completion.finalState.heldIngots,prestigeCount:completion.finalState.prestigeCount},target:target.plan},null,2));
