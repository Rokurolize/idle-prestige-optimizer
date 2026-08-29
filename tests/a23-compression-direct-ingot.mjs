import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),M=require('../ascension-model.js');

// Reported A23 state. The game debug panel showed 71.6 ore destructions/s while
// two recording-free screenshots showed Lv1707 at 04:03:24.799 and Lv1829 at
// 04:03:30.364: 122 levels in 5.565 real seconds. These measure two different
// things: direct▲ is awarded on each destruction, while level progression remains
// governed by the calibrated sale/EXP throughput.
const input={
  goal:'ascension',objective:'ascensionEta',ascensionCount:23,totalCore:M.totalCoreForAscension(23),
  heldIngots:2.14e18,totalIngotsEarned:M.prestigeTotalIngotsEarnedFromMultiplier(52.63e6),prestigeCount:0,
  currentCoreLevels:[31,36,33,9,20],currentSlowdownLevel:17,compressionEnabled:true,compressionDestroyRate:71.6,
  discardedAscensions:52,maxLevelEver:9485,normalAutoUnlocked:true,bombUnlocked:false,dangerEnabled:false,
  instancePlayerCount:1,incomeBoostActive:false,expBoostActive:false,ingotLevels:[55,57,55,55,10,48,17,49],
  maxTargetLevel:10000,nextRequirement:M.nextAscensionRequirement(23),oneShotMargin:1,strictOneShot:true,
  dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,
  skipManual:true
};
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS),observed=result.fixedPlan;
assert.ok(observed);
assert.equal(observed.core.join(','),'31,36,33,9,20');
assert.equal(M.slowdownLevel(observed.slowdown),18,'direct▲ should make the optimizer prefer the highest useful Slowdown before supply/DPS falls off');
assert.ok(observed.directIngotGain>observed.prestigeIngotGain,'deep Compression run should be direct▲-dominated in this A23 state');
assert.equal(observed.topSpawnAtTarget,20,'selected route should preserve the top-spawn cap');

const cal=result.calibration,curve=M.simulateCurve({
  maxTarget:1830,core:input.currentCoreLevels,ingot:input.ingotLevels,slowdown:M.SLOWDOWN[17],
  physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:1,hpCalibration:1,
  compressionEnabled:true,compressionE:M.compressionE(9485,52),compressionRequiredIngots:input.nextRequirement,
  compressionDestroyRate:71.6,normalAutoEnabled:true,normalAutoUpdatesPerSecond:36.5,normalAutoCalibration:cal
});
assert.equal(curve.directDestroyRateAtTarget,71.6,'debug-panel destruction throughput must cap direct▲ events');
assert.ok(curve.contactRateAtTarget<20,'ordinary sale/EXP timing must remain independently calibrated instead of being replaced by 71.6/s');
const predictedDelta=cal.scale*(curve.times[1829]-curve.times[1707]),observedDelta=5.565;
assert.ok(Math.abs(predictedDelta-observedDelta)/observedDelta<.08,`recording-free Lv1707→1829 pace should validate the separated model: predicted ${predictedDelta}s vs ${observedDelta}s`);
assert.ok(curve.compressionIngots[1829]>curve.compressionIngots[1707]);

const stale=M.optimizeAscension({...input,compressionDestroyRate:15.75},M.DEFAULT_MEASUREMENTS).fixedPlan;
assert.ok(stale&&observed.totalEta<stale.totalEta,`71.6/s direct▲ should beat the stale 15.75/s assumption: ${observed.totalEta} vs ${stale.totalEta}`);
console.log(JSON.stringify({plan:{core:observed.core,slowdownLevel:M.slowdownLevel(observed.slowdown),targetLevel:observed.targetLevel,totalEta:observed.totalEta,directIngotGain:observed.directIngotGain,prestigeIngotGain:observed.prestigeIngotGain},timing:{observedSeconds:observedDelta,predictedSeconds:predictedDelta,progressionContact:curve.contactRateAtTarget,directDestroyRate:curve.directDestroyRateAtTarget},staleEta:stale.totalEta},null,2));
