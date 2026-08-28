import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const screenshot=M.calculateExpPaceBoundary({
  targetLevel:4280,
  slowdown:1e12,
  expEfficiencyMultiplier:127,
  rarePercent:100,
  rareValueMultiplier:5,
  gemPercent:1.8,
  orichalcumPercent:40,
  compressionE:0
});

assert.equal(screenshot.firstSlowGaugeLevel,4100,'Lv4100 gauge should be the first EXP-limited level for the screenshot fixture');
assert.equal(screenshot.safeAutoPrestigeLevel,4100,'Auto Prestige Lv4100 is the last target reached without consuming a slowed gauge');
assert.equal(screenshot.fullSpeedGaugeThroughLevel,4099);
assert.ok(screenshot.targetArrivalPaceFactor>1.75&&screenshot.targetArrivalPaceFactor<1.85,`Lv4280 arrival should be about 1.8x slower than the one-terminal-per-level plateau, got ${screenshot.targetArrivalPaceFactor}`);
assert.equal(screenshot.milestones.find(x=>x.factor===2).level,4339,'2x EXP pace boundary drifted');
assert.equal(screenshot.milestones.find(x=>x.factor===10).level,4702,'10x EXP pace boundary drifted');

const compressed=M.calculateExpPaceBoundary({...screenshot.input,targetLevel:4280,compressionE:1});
assert.ok(compressed.firstSlowGaugeLevel>screenshot.firstSlowGaugeLevel,'Compression value bonus should push the EXP overflow boundary later');

const notAllRare=M.calculateExpPaceBoundary({...screenshot.input,targetLevel:4280,rarePercent:99,compressionE:0});
assert.ok(notAllRare.firstSlowGaugeLevel<screenshot.firstSlowGaugeLevel,'a nonzero normal-ore chance should make expected EXP pace start falling earlier');

console.log(JSON.stringify({
  firstSlowGaugeLevel:screenshot.firstSlowGaugeLevel,
  safeAutoPrestigeLevel:screenshot.safeAutoPrestigeLevel,
  targetArrivalPaceFactor:screenshot.targetArrivalPaceFactor,
  milestones:screenshot.milestones,
  compressedBoundary:compressed.firstSlowGaugeLevel,
  ninetyNineRareBoundary:notAllRare.firstSlowGaugeLevel
},null,2));
