import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

// A22 screenshots taken four wall-clock seconds apart show 146 normal-upgrade
// purchases, i.e. an effective ~36.5 successful purchase opportunities/s while
// the factory is busy. VRCW AutomationManager can buy only one normal upgrade
// per Update after its 0.01 s gate; unused Update opportunities are not banked.
// The screenshots' DPS is also consistent with the VRCW Damage Boost ×2 path.
// The old optimizer drained all affordable upgrades once per game level, producing
// [9655,3214,3833,...] at Lv5617 and hiding the observed HP/DPS wall.
const core=[27,34,29,9,21];
const ingot=[0,58,0,49,0,45,17,46];
const observedNormal=[5618,1871,2223];
const observedDpsLog=560+Math.log10(1.44);
const observedHpLog=561+Math.log10(3.83);
const observedCrushSeconds=Math.pow(10,observedHpLog-observedDpsLog);
const totalIngotsEarned=M.inferTotalIngotsEarned(1.68e18,ingot,true);
const normalAutoUpdatesPerSecond=36.5;
const damageBoostMultiplier=2;
const cal=M.fitCalibration(M.DEFAULT_MEASUREMENTS,normalAutoUpdatesPerSecond);
const curve=M.simulateCurve({
  // simulateCurve's final DPS/HP sample is maxTarget-1, so 5618 samples Lv5617.
  maxTarget:5618,
  core,
  ingot,
  slowdown:1e17,
  physicalCap:cal.physicalCap,
  totalIngotsEarned,
  damageBoostMultiplier,
  normalAutoUpdatesPerSecond,
  normalAutoCalibration:cal
});

assert.ok(cal.physicalCap>=15&&cal.physicalCap<=17,`unexpected finite-Auto physical cap ${cal.physicalCap}`);
assert.ok(cal.scale>.6&&cal.scale<.7,`unexpected finite-Auto timing scale ${cal.scale}`);
assert.ok(cal.rmse<5,`finite-Auto calibration RMSE too large: ${cal.rmse}`);
assert.equal(cal.normalAutoUpdatesPerSecond,normalAutoUpdatesPerSecond);
assert.ok(curve.autoPurchases>9000&&curve.autoPurchases<10300,`unexpected A22 auto purchases ${curve.autoPurchases}`);

for(let i=0;i<3;i++){
  assert.ok(curve.normalAtTarget[i]<[7000,2500,3000][i],`${M.NORMAL.names[i]} is still in the old over-purchase regime: ${curve.normalAtTarget[i]}`);
  assert.ok(Math.abs(curve.normalAtTarget[i]-observedNormal[i])<=[20,10,10][i],`${M.NORMAL.names[i]} misses observed A22 level: model=${curve.normalAtTarget[i]} observed=${observedNormal[i]}`);
}

assert.ok(curve.hpSmallLogAtTarget>curve.dpsLogAtTarget,`Lv5617 HP/DPS wall disappeared: DPS=${curve.dpsLogAtTarget} HP=${curve.hpSmallLogAtTarget}`);
const modeledCrushSeconds=Math.pow(10,curve.hpSmallLogAtTarget-curve.dpsLogAtTarget);
assert.ok(modeledCrushSeconds>20&&modeledCrushSeconds<40,`Lv5617 per-ore crush time should be tens of seconds, got ${modeledCrushSeconds}`);
assert.ok(Math.abs(Math.log10(modeledCrushSeconds/observedCrushSeconds))<.12,`Lv5617 wall strength mismatch: model=${modeledCrushSeconds}s observed=${observedCrushSeconds}s`);
assert.ok(Math.abs(curve.dpsLogAtTarget-observedDpsLog)<.2,`Lv5617 DPS misses observed by >1.6x: model log=${curve.dpsLogAtTarget} observed log=${observedDpsLog}`);
assert.ok(Math.abs(curve.hpSmallLogAtTarget-observedHpLog)<.15,`Lv5617 HP misses observed by >1.4x: model log=${curve.hpSmallLogAtTarget} observed log=${observedHpLog}`);
assert.ok(curve.dpsKillRateAtTarget<curve.contactRateAtTarget/5,`Lv5617 damage service must be the bottleneck: damage=${curve.dpsKillRateAtTarget} contact=${curve.contactRateAtTarget}`);
assert.ok(curve.queuePressure[5618]>1,'HP/DPS wall must create queue pressure in the progression objective');

// VRCW OreSpawner subtracts the temporary Damage Boost from its HP-cap DPS.
// With normal Auto disabled the exact same upgrade state must therefore gain
// log10(2) live DPS while spawned HP is unchanged.
const unboosted=M.simulateCurve({maxTarget:200,core,ingot,slowdown:1e17,physicalCap:cal.physicalCap,totalIngotsEarned,normalAutoEnabled:false,damageBoostMultiplier:1});
const boosted=M.simulateCurve({maxTarget:200,core,ingot,slowdown:1e17,physicalCap:cal.physicalCap,totalIngotsEarned,normalAutoEnabled:false,damageBoostMultiplier:2});
assert.ok(Math.abs((boosted.dpsLogAtTarget-unboosted.dpsLogAtTarget)-Math.log10(2))<1e-12);
assert.ok(Math.abs(boosted.hpSmallLogAtTarget-unboosted.hpSmallLogAtTarget)<1e-12);

// e560 values overflow JavaScript Number, so the diagnostic anchor must accept
// authoritative log10 inputs rather than collapsing them to zero/Infinity.
const anchor=M.deriveDpsCalibration({level:5617,core,ingot,slowdown:1e17,totalIngotsEarned,dpsLog10:observedDpsLog,hpSmallLog10:observedHpLog,damageBoostMultiplier,normalAutoUpdatesPerSecond},cal.physicalCap,cal);
assert.ok(Number.isFinite(anchor.calibration)&&anchor.calibration>0,'log-domain DPS anchor must remain finite');
assert.ok(Number.isFinite(anchor.hpCalibration)&&anchor.hpCalibration>0,'log-domain HP anchor must remain finite');

console.log(JSON.stringify({
  calibration:{physicalCap:cal.physicalCap,intercept:cal.intercept,scale:cal.scale,rmse:cal.rmse},
  normalAtTarget:curve.normalAtTarget,
  observedNormal,
  autoPurchases:curve.autoPurchases,
  dpsLog:curve.dpsLogAtTarget,
  observedDpsLog,
  hpSmallLog:curve.hpSmallLogAtTarget,
  observedHpLog,
  modeledCrushSeconds,
  observedCrushSeconds,
  dpsKillRate:curve.dpsKillRateAtTarget,
  contactRate:curve.contactRateAtTarget,
  queuePressure:curve.queuePressure[5618],
  anchor:{dpsCalibration:anchor.calibration,hpCalibration:anchor.hpCalibration}
},null,2));
