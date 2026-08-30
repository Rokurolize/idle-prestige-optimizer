import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),M=require('../ascension-model.js');

// The 2026-08-30 A29 trajectory was captured before r82 was analyzed. Keep it as a
// historical calibration reference, never as a multiplier that cancels r82's 20x
// direct-Ingot buff (compressionIngotTargetHours 20 -> 1).
assert.equal(M.R82_DEFAULT_DIRECT_FLOW_CALIBRATION,1);
assert.ok(Math.abs(M.PRE_R82_A29_DIRECT_FLOW_CALIBRATION-11.273903604026662)<1e-12);
assert.equal(M.COMPRESSION_INGOT_DENOMINATOR,555660);
assert.equal(M.AUTO_BUY_INTERVAL,.01);
assert.equal(M.effectiveAutoPurchasesPerSecond(36.5),36.5);
assert.equal(M.effectiveAutoPurchasesPerSecond(240),100);

const totalCore=M.totalCoreForAscension(29),farmCore=M.compressionFarmPriorityCore(totalCore);
assert.deepEqual(farmCore,[0,0,43,0,28]);
const historicalState={ascensionCount:29,requiredIngots:5e22,heldIngots:1.42e22,ingotLevels:[74,74,74,74,10,68,17,69],totalCore,normalAutoUpdatesPerSecond:36.5,directFlowCalibration:M.R82_DEFAULT_DIRECT_FLOW_CALIBRATION,autoMask:0};
const r82Harvest=M.optimizeCompressionAutoHarvest(historicalState);
assert.ok(r82Harvest.finishSeconds>20&&r82Harvest.finishSeconds<40,`r82 must use its own 1-hour reward, got ${r82Harvest.finishSeconds}s`);
assert.ok(r82Harvest.finishSeconds<53.147,'the pre-r82 53.147s observation must not be forced onto the 20x-buffed r82 reward model');
assert.equal(r82Harvest.slowdownLevel,28);
assert.equal(r82Harvest.autoPurchases.length,0);

const fresh={ascensionCount:29,requiredIngots:5e22,heldIngots:M.legacyStartIngot(52),ingotLevels:Array(8).fill(0),totalCore,normalAutoUpdatesPerSecond:36.5,directFlowCalibration:1};
const allAuto=M.optimizeCompressionAutoHarvest({...fresh,autoMask:255});
assert.ok(allAuto.bestStopSeconds<60);
assert.ok(allAuto.autoPurchases.length>100,'the policy must model high-frequency Ingot AUTO compounding');
assert.equal(allAuto.truncated,false,'default AUTO simulation must run to a real stop, not an arbitrary purchase horizon');
const searched=M.optimizeCompressionAutoHarvest(fresh);
assert.ok(searched.bestStopSeconds<allAuto.bestStopSeconds);
assert.equal(searched.autoMask,132,'Damage + Orichalcum wins this r82 direct-harvest state; Damage must remain in mask search');
assert.equal(searched.truncated,false);

// The 16-mask reduction is exact against all 256 masks when irrelevant upgrades are
// already capped. This catches accidental removal of Damage/Feed/Gem/Ori candidates.
const bruteFixture={ascensionCount:80,discardedAscensions:52,compressionLockedLevel:9485,maxLevelEver:9485,requiredIngots:1e50,heldIngots:9.99e49,ingotLevels:[1023,1023,1022,1022,9,1023,17,99],totalCore:M.totalCoreForAscension(80),normalAutoUpdatesPerSecond:36.5,directFlowCalibration:1};
let brute=null;for(let mask=0;mask<256;mask++){const row=M.simulateCompressionAutoHarvest({...bruteFixture,autoMask:mask});if(!brute||row.finishSeconds<brute.finishSeconds-1e-9)brute=row}
const reduced=M.optimizeCompressionAutoHarvest(bruteFixture);
assert.ok(Math.abs(reduced.finishSeconds-brute.finishSeconds)<1e-12);
assert.equal(reduced.autoMask,brute.autoMask);
const forcedTruncation=M.simulateCompressionAutoHarvest({...bruteFixture,autoMask:132,maxPurchases:0});
assert.equal(forcedTruncation.truncated,true,'an explicit artificial cap must be surfaced, never silently accepted');

// Current A500 tail: any Legacy resets A to 0. Even granting zero best-Level-push
// time and zero direct-Ingot wait, the mandatory 25-Prestige floor is slower than
// this feasible straight route, so every Legacy/push branch can be safely rejected.
const campaign=M.optimizeClosedLoopA500Campaign({ascensionCount:495,discardedAscensions:52,maxLevelEver:9485,compressionLockedLevel:9485,compressionEnabled:true,totalCore:M.totalCoreForAscension(495),heldIngots:M.legacyStartIngot(52),ingotLevels:Array(8).fill(0),prestigeCount:0,totalIngotsEarned:0,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1},M.DEFAULT_MEASUREMENTS);
assert.ok(campaign&&campaign.totalSeconds>0);
assert.equal(campaign.firstAction,'ascend');
assert.equal(campaign.actions.filter(x=>x.type==='ascend').length,5);
assert.equal(campaign.legacyActions.length,0);
assert.equal(campaign.legacyPrunedByLowerBound,true);
assert.equal(campaign.legacySearchComplete,true);
assert.ok(campaign.legacyLowerBoundSeconds>campaign.totalSeconds);
assert.match(campaign.legacyBestLevelScope,/every possible pushed level/);

console.log(JSON.stringify({farmCore,r82HarvestSeconds:r82Harvest.finishSeconds,allAuto:{seconds:allAuto.bestStopSeconds,purchases:allAuto.autoPurchases.length},searched:{seconds:searched.bestStopSeconds,mask:searched.autoMask,purchases:searched.autoPurchases.length},campaign:{seconds:campaign.totalSeconds,legacyLowerBound:campaign.legacyLowerBoundSeconds}},null,2));
