import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

// A16 diagnostic from 2026-08-28. The initial Ascension solve has both fixed
// and manual Core strategies. The roadmap has no Ingot purchases, so promoting
// its final result must not make the fixed strategy disappear from the UI.
const input={
  objective:'ascensionEta',
  ascensionCount:16,
  totalCore:43046720,
  heldIngots:2970000000000,
  totalIngotsEarned:74438258558137,
  prestigeCount:7,
  currentCoreLevels:[20,23,20,9,13],
  currentSlowdownLevel:14,
  normalAutoUnlocked:true,
  ingotLevels:[44,43,43,43,18,38,17,38],
  maxTargetLevel:4500,
  discardedAscensions:28,
  maxLevelEver:9485,
  oneShotMargin:1,
  strictOneShot:true,
  dpsCalibration:1,
  hpCalibration:1,
  manualClickRate:4,
  uiClickRate:4,
  normalAutoUpdatesPerSecond:36.5
};

const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.fixedPlan,'fixture must have a fixed-Core strategy before roadmap promotion');
assert.ok(result.manualPlan,'fixture must have a manual-Core strategy before roadmap promotion');
assert.equal(result.recommendedMode,'manual');

const roadmap=M.optimizeIngotUpgrades(input,result,M.DEFAULT_MEASUREMENTS,192);
assert.equal(roadmap.steps.length,0,'fixture should remain a no-purchase roadmap');
assert.ok(roadmap.finalFixedPlan,'roadmap final state must preserve a fixed-Core alternative');
assert.ok(roadmap.finalManualPlan,'roadmap final state must preserve a manual-Core alternative');
assert.equal(roadmap.finalRecommendedMode,'manual');
assert.deepEqual(roadmap.finalFixedPlan.core,result.fixedPlan.core);
assert.deepEqual(roadmap.finalManualPlan.core,result.manualPlan.core);

// A roadmap that actually buys upgrades must also expose strategies computed
// for the purchased final Ingot state, not stale pre-purchase alternatives.
const purchaseLevels=[0,26,0,20,0,0,0,0],purchaseHeld=5e8,purchaseInput={ascensionCount:7,totalCore:2186,heldIngots:purchaseHeld,totalIngotsEarned:M.inferTotalIngotsEarned(purchaseHeld,purchaseLevels,true),prestigeCount:3,currentCoreLevels:[0,0,0,0,0],currentSlowdownLevel:0,normalAutoUnlocked:true,ingotLevels:purchaseLevels,maxTargetLevel:1400,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,includeFinalManualStrategy:true};
const purchaseResult=M.optimizeAscension(purchaseInput,M.DEFAULT_MEASUREMENTS),purchaseRoadmap=M.optimizeIngotUpgrades(purchaseInput,purchaseResult,M.DEFAULT_MEASUREMENTS,3);
assert.ok(purchaseRoadmap.steps.length>0,'purchase fixture must exercise a changed final Ingot state');
assert.ok(purchaseRoadmap.finalFixedPlan&&purchaseRoadmap.finalManualPlan);
assert.deepEqual(purchaseRoadmap.finalFixedPlan.ingot,purchaseRoadmap.targetLevels);
assert.deepEqual(purchaseRoadmap.finalManualPlan.ingot,purchaseRoadmap.targetLevels);

console.log(JSON.stringify({
  recommended:roadmap.finalRecommendedMode,
  fixedCore:roadmap.finalFixedPlan.core,
  manualCore:roadmap.finalManualPlan.core,
  steps:roadmap.steps.length,
  purchasedFinalLevels:purchaseRoadmap.targetLevels
},null,2));
