import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const base={
  level:4885,
  slowdown:1e20,
  coreLevels:[0,0,0,0,0],
  ingotLevels:Array(8).fill(0),
  totalIngotsEarned:0,
  dpsCalibration:1,
  hpCalibration:1,
  damageBoostMultiplier:1,
  physicalCap:15.75,
  targetKillSeconds:1,
  normalAutoUpdatesPerSecond:36.5,
  normalAutoCalibration:{scale:1}
};

const r=M.calculateRankingTarget(base);
assert.ok(r.off.hp.largeOrichalcum>494&&r.off.hp.largeOrichalcum<495,
  `Lv4885 / Slowdown 1e20 / no Normal upgrades should reproduce the observed e494-e495 wall, got e${r.off.hp.largeOrichalcum}`);
assert.deepEqual(r.off.normalLevels,Array(8).fill(0));
assert.ok(r.autoPurchaseCount>1000,'Auto ON comparison must actually project Normal purchases through the target level');
assert.ok(r.auto.liveDpsLog>r.off.liveDpsLog,'Auto ON should raise projected DPS');
assert.ok(r.autoSpendLog10>100,'the calculator should expose the large ranking-score opportunity cost of Auto purchases');
assert.ok(r.requiredDpsLog>r.off.hp.largeOrichalcum,'one-second self-consistent required DPS should exceed the spawned worst-case HP in this deep-wall fixture');
assert.equal(M.formatLog10(r.off.hp.largeOrichalcum).endsWith('e494'),true);

const compressed=M.calculateRankingTarget({...base,compressionE:12.5});
assert.ok(Math.abs((compressed.off.hp.largeOrichalcum-r.off.hp.largeOrichalcum)-12.5)<1e-9,'Compression E must add directly to spawned HP log');
assert.ok(Math.abs((compressed.requiredDpsLog-r.requiredDpsLog)-12.5)<1e-9,'Compression E must add directly to prepared-DPS requirement');
assert.ok(Math.abs((compressed.off.expectedIncomePerTerminalLog-r.off.expectedIncomePerTerminalLog)-12.5)<1e-9,'Compression E must add directly to ore value log');

const prepared=M.calculateRankingTarget({...base,liveDpsLogOverride:r.requiredDpsLog+2});
assert.ok(prepared.prepared,'direct displayed-DPS input must create a preparedness scenario');
assert.ok(prepared.preparedRequiredMarginLog>1.9,'prepared DPS should report its margin over the target requirement');

const customLevels=[100,40,50,25,10,4,5,12];
const custom=M.calculateRankingTarget({...base,customNormalLevels:customLevels});
assert.deepEqual(custom.custom.normalLevels,customLevels,'fixed/manual Normal levels must be comparable without enabling Auto');
assert.ok(custom.custom.liveDpsLog>r.off.liveDpsLog);

console.log(JSON.stringify({
  observedWall:{largeOrichalcum:M.formatLog10(r.off.hp.largeOrichalcum),log10:r.off.hp.largeOrichalcum},
  requiredOneSecond:M.formatLog10(r.requiredDpsLog),
  auto:{purchases:r.autoPurchaseCount,spend:M.formatLog10(r.autoSpendLog10),normalLevels:r.auto.normalLevels},
  compressionDelta:compressed.off.hp.largeOrichalcum-r.off.hp.largeOrichalcum
},null,2));
