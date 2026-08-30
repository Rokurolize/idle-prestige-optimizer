import assert from 'node:assert/strict';
import M from '../ascension-model.js';

const inferred=M.ascensionFromRequirement(3.15e69);
assert.ok(inferred);
assert.equal(inferred.ascensionCount,109,'rounded 3.15e69 requirement should identify A109');
assert.ok(inferred.relativeError<0.001);
assert.equal(M.ascensionFromRequirement(1.12e70).ascensionCount,110);

const effects=[Math.pow(2,156),1,155,.1,1e52];
const core=M.coreLevelsFromEffects(effects);
assert.ok(core);
assert.deepEqual(core.levels,[156,0,154,9,56]);
assert.deepEqual(core.levels.map((level,i)=>M.coreEffect(i,level)),effects);

const base={ascensionCount:109,discardedAscensions:52,maxLevelEver:18066,compressionLockedLevel:9485,compressionEnabled:true,totalCore:M.totalCoreForAscension(109),heldIngots:M.legacyStartIngot(52),ingotLevels:Array(8).fill(0),prestigeCount:0,totalIngotsEarned:0,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1,strategyStyle:'normal'};
const optimized=M.optimizeClosedLoopAscensionPolicy(base,M.DEFAULT_MEASUREMENTS);
const retained=M.optimizeClosedLoopAscensionPolicy({...base,currentCoreLevels:[156,0,154,9,56],currentSlowdownLevel:46},M.DEFAULT_MEASUREMENTS);
assert.ok(optimized&&retained);
assert.equal(retained.totalSeconds,optimized.totalSeconds,'existing plateau Core must not lose ETA');
assert.equal(retained.coreRetained,true,'equal-ETA current Core should be retained to avoid pointless clicks');
assert.deepEqual(retained.gate.core,[156,0,154,9,56]);
assert.match(retained.policy[0],/現状維持/);

console.log(JSON.stringify({requirement:3.15e69,ascension:inferred.ascensionCount,modelRequirement:inferred.requirement,core:core.levels,totalSeconds:retained.totalSeconds,coreRetained:retained.coreRetained}));
