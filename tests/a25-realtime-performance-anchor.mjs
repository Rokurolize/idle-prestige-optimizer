import assert from 'node:assert/strict';
import M from '../ascension-model.js';

// 2026-08-30 screenshots under ordinary (non-recording) play:
// Lv1707 at 04:03:24.799 and Lv1829 at 04:03:30.364 => 122 levels / 5.565 s.
// The same screenshots establish A25 (next requirement 3e20), Core
// [36,39,36,9,23] with about 3.5B unspent, Slowdown Lv23, Compression E=6.42,
// Danger ON, all three 2x Shop boosts active, and the listed Ingot upgrades.
const observedSeconds=5.565;
const core=[36,39,36,9,23];
const ingot=[61,53,56,53,10,54,17,55];
const totalCore=M.totalCoreForAscension(25);
assert.equal(M.nextAscensionRequirement(25),3e20);
assert.equal(totalCore-M.coreBundleCost(core),3499593381);

const cal=M.fitCalibration(M.DEFAULT_MEASUREMENTS,36.5);
const common={
  core,ingot,slowdown:M.SLOWDOWN[23],physicalCap:cal.physicalCap,
  totalIngotsEarned:M.prestigeTotalIngotsEarnedFromMultiplier(276.2e6),
  dpsCalibration:1,damageBoostMultiplier:2,hpCalibration:1,
  compressionEnabled:true,compressionE:M.compressionE(9485,52),compressionRequiredIngots:3e20,
  bombUnlocked:true,dangerEnabled:true,instancePlayerCount:1,
  incomeBoostActive:true,expBoostActive:true,
  normalAutoEnabled:true,normalAutoUpdatesPerSecond:36.5,normalAutoCalibration:cal
};
const curve=M.simulateCurve({maxTarget:1830,...common});
const predictedSeconds=cal.scale*(curve.times[1829]-curve.times[1707]);
const relativeError=Math.abs(predictedSeconds-observedSeconds)/observedSeconds;
assert.ok(relativeError<0.05,`normal-play Lv1707→1829 timing drifted: observed=${observedSeconds}, predicted=${predictedSeconds}`);

// The debug panel showed destruction throughput around the mid-70s/s in this
// configuration. Direct Compression Ingots use that destruction event stream,
// while level/EXP timing remains governed by terminal-sale processing.
const input={
  goal:'ascension',objective:'ascensionEta',ascensionCount:25,totalCore,
  heldIngots:1.01e20,totalIngotsEarned:common.totalIngotsEarned,prestigeMultiplier:276.2e6,prestigeCount:40,
  currentCoreLevels:core,currentSlowdownLevel:23,compressionEnabled:true,compressionDestroyRate:74.5,
  normalAutoUnlocked:true,bombUnlocked:true,dangerEnabled:true,instancePlayerCount:1,
  incomeBoostActive:true,expBoostActive:true,ingotLevels:ingot,maxTargetLevel:10000,
  discardedAscensions:52,maxLevelEver:9485,oneShotMargin:1,strictOneShot:true,
  dpsCalibration:1,damageBoostMultiplier:2,hpCalibration:1,
  manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,skipManual:true
};
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.fixedPlan);
assert.deepEqual(result.fixedPlan.core,core);
assert.equal(M.slowdownLevel(result.fixedPlan.slowdown),23);
assert.ok(result.fixedPlan.prestigeSchedule.some(x=>x.directIngotGain>0));
assert.ok(result.fixedPlan.prestigeSchedule.reduce((s,x)=>s+x.runs*x.directIngotGain,0)>0);

console.log(JSON.stringify({
  normalPlayTiming:{observedSeconds,predictedSeconds,relativeError,levelsPerSecond:122/observedSeconds},
  fixedPlan:{core:result.fixedPlan.core,slowdownLevel:M.slowdownLevel(result.fixedPlan.slowdown),targetLevel:result.fixedPlan.targetLevel,totalEta:result.fixedPlan.totalEta,totalRuns:result.fixedPlan.totalRuns}
},null,2));
