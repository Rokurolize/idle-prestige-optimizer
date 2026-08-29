import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

// VRCW GameBalanceConfig.perkSlowdownMultiplierTable has 46 entries and
// PerkManager exposes them as UI levels 1..46; level 0 is the no-slowdown state.
assert.equal(M.SLOWDOWN.length,47,'model should contain no-slowdown plus exactly 46 game slowdown levels');
assert.equal(M.SLOWDOWN[46],1e42,'UI Slowdown Lv46 must be the VRCW maximum x1e42');
assert.equal(M.slowdownLevel(1e42),46);
assert.equal(M.slowdownLevel(1e43),-1,'nonexistent Slowdown Lv47 must not be modeled');
assert.equal(M.coreEffect(4,46),1e42,'Core Feed Lv46 must retain the matching VRCW multiplier table endpoint');

const core=[41,0,39,9,26];
const ingot=[66,68,64,68,0,61,17,62];
const feed=M.normalEffect(7,30);

// Preserve the observed normal-range game rates while matching the instantiated
// r80 scene's baseSpawnInterval=1.6666666 and minimum effective rate=0.01.
assert.ok(Math.abs(M.topSpawnRate(core,ingot,feed,1e23).actual-8.082906342323644)<1e-12);
assert.ok(Math.abs(M.topSpawnRate(core,ingot,feed,1e24).actual-0.8082906342323645)<1e-12);
assert.ok(Math.abs(M.topSpawnRate(core,ingot,feed,1e25).actual-0.08082906342323644)<1e-12);
assert.ok(Math.abs(M.topSpawnRate(core,ingot,feed,1e42).actual-0.00600000024000001)<1e-15,'r80 extreme slowdown floor follows 0.01 / 1.6666666');

console.log(JSON.stringify({
  slowdownMaxLevel:M.SLOWDOWN.length-1,
  slowdownMaxMultiplier:M.SLOWDOWN.at(-1),
  observedRange:[1e23,1e24,1e25].map(s=>M.topSpawnRate(core,ingot,feed,s).actual),
  extremeFloor:M.topSpawnRate(core,ingot,feed,1e42).actual
},null,2));
