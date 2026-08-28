import assert from 'node:assert/strict';
import M from '../ascension-model.js';

const toPrestige=M.coreReallocationPlan([4,0,4,3,3],[0,6,0,0,0]);
assert.equal(toPrestige.method,'reset-all','reset-all should beat 20 individual level changes');
assert.equal(toPrestige.levelClicks,6);
assert.equal(toPrestige.actionClicks,2,'Reset All + Apply are two action clicks');
assert.equal(toPrestige.clicks,8);

const backToRun=M.coreReallocationPlan([0,6,0,0,0],[4,0,4,3,3]);
assert.equal(backToRun.method,'reset-all');
assert.equal(backToRun.levelClicks,14);
assert.equal(backToRun.clicks,16);

const slow=M.slowdownReallocationPlan(4,2);
assert.equal(slow.toLevel,1);
assert.equal(slow.levelClicks,3);
assert.equal(slow.clicks,4,'Slowdown Lv4→Lv1 is three level clicks plus Apply');

const ops=M.ascensionInteractionPlan([4,0,4,3,3],[0,6,0,0,0],25,4);
assert.equal(ops.clicks,635,'25 manual Prestige runs should count reset/rebuild, two Prestige buttons, and the final Ascend click');
assert.equal(ops.seconds,158.75);

const after=M.afterAscensionState({ascensionCount:4,discardedAscensions:28,heldIngots:5e7,prestigeCount:25,normalAutoUnlocked:true,ingotLevels:[20,22,13,16,10,15,17,15],maxLevelEver:405});
assert.equal(after.ascensionCount,5);
assert.equal(after.heldIngots,43904,'normal Ascension must re-grant Legacy start Ingots from cumulative discarded Ascensions');
assert.equal(after.prestigeCount,0);
assert.equal(after.normalAutoUnlocked,false);
assert.deepEqual(after.ingotLevels,Array(8).fill(0));
assert.equal(after.maxLevelEver,405,'best Level survives Ascension');

const input={objective:'ascensionEta',ascensionCount:4,totalCore:80,heldIngots:2650,totalIngotsEarned:43908,prestigeCount:0,currentCoreLevels:[0,6,0,0,0],currentSlowdownLevel:4,normalAutoUnlocked:true,ingotLevels:[0,13,0,15,0,0,0,0],maxTargetLevel:3000,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5};
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.manualPlan&&result.fixedPlan);
assert.deepEqual(result.manualPlan.prestigeCore.slice(0,1),[0],'Prestige-only allocation must not waste clicks/stars on income');
assert.equal(result.manualPlan.prestigeCore[1],result.absoluteMaxIngotLevel);
assert.ok(result.manualPlan.interactionClicks>result.fixedPlan.interactionClicks,'manual reallocation should expose its extra human work');
assert.ok(result.manualPlan.totalEta>=result.manualPlan.eta,'interaction-adjusted ETA must include operation time');
assert.ok(['manual','fixed'].includes(result.recommendedMode));

const req=M.nextAscensionRequirement(4);
const almostDone=M.optimizeAscension({...input,totalCore:M.totalCoreForAscension(4),heldIngots:req-1,totalIngotsEarned:req,prestigeCount:0,ingotLevels:Array(8).fill(0),maxTargetLevel:1000,oneShotMargin:0,strictOneShot:false,currentCoreLevels:[0,0,0,0,0],currentSlowdownLevel:0},M.DEFAULT_MEASUREMENTS);
assert.equal(almostDone.recommendedMode,'fixed','when Ingot gain is no longer the bottleneck, avoiding Core reallocation should win');
assert.deepEqual(almostDone.fixedPlan.core,almostDone.fixedPlan.prestigeCore,'fixed plan must not add pointless Prestige-time Core clicks');

console.log(JSON.stringify({toPrestige,backToRun,slow,ops,after:{ascensionCount:after.ascensionCount,heldIngots:after.heldIngots},fixed:{eta:result.fixedPlan.eta,totalEta:result.fixedPlan.totalEta,clicks:result.fixedPlan.interactionClicks},manual:{core:result.manualPlan.core,prestigeCore:result.manualPlan.prestigeCore,eta:result.manualPlan.eta,totalEta:result.manualPlan.totalEta,clicks:result.manualPlan.interactionClicks},recommendedMode:result.recommendedMode,almostDone:{mode:almostDone.recommendedMode,core:almostDone.fixedPlan.core,clicks:almostDone.fixedPlan.interactionClicks}},null,2));
