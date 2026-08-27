import assert from 'node:assert/strict';
import M from '../ascension-model.js';

assert.equal(M.LEGACY_REQUIRED_ASCENSIONS,10);
assert.equal(M.COMPRESSION_UNLOCK_DISCARDED,50);
assert.equal(M.ASCENSION_MAX_COUNT,500);
assert.equal(M.COMPRESSION_INGOT_DENOMINATOR,11113200);
assert.equal(M.legacyStartIngot(28),43904);
assert.equal(M.legacyStartIngot(50),250000);
assert.equal(M.legacyStartIngot(293),50000000);
assert.equal(M.legacyStartIngot(500),50000000);
assert.equal(M.compressionUnlocked(49),false);
assert.equal(M.compressionUnlocked(50),true);

const late=M.compressionRarityState(100,1,100);
assert.ok(Math.abs(late.pBomb-.0015)<1e-12);
assert.ok(Math.abs(late.pGem-.009985)<1e-12);
assert.ok(Math.abs(late.pOri-.988515)<1e-12);
assert.ok(Math.abs(M.compressionRarityValueMultiplier(100,1,100)-197.9042)<1e-9);
assert.equal(M.compressionExpectedIngotPerOre(1,100,1,100),1);
assert.ok(Math.abs(M.compressionExpectedIngotPerOre(11113200,100,1,100)-197.9042)<1e-9);

const route=M.optimizeLegacyPartitions({
  discardedAscensions:28,
  currentAscension:0,
  unlockDiscarded:50,
  maxLegacyTarget:50,
  ascensionCost:a=>100/(a+1),
  continuationCost:()=>0
});
assert.deepEqual(route.legacyTargets,[22]);
assert.equal(route.unlockDiscarded,50);

for(const terminalSalesPerSecond of [15.75,M.THEORETICAL_TERMINAL_SALES_RATE]){
  const prep=M.optimizeCompressionPreparation({discardedAscensions:50,terminalSalesPerSecond,rarePercent:100,gemLevel:10,totalCrushLog:0,bestLevel:9000});
  assert.deepEqual(prep.overlap.extraLegacyCycles,[20]);
  assert.deepEqual(prep.sequential.extraLegacyCycles,[20]);
  assert.equal(prep.overlap.finalCycleDiscarded,70);
  assert.equal(prep.afterA500LegacyDiscarded,570);
  assert.equal(prep.observableBestLevel,26621);
  assert.equal(prep.levelTarget,26621);
  assert.equal(prep.levelPush.expLevel,930);
  assert.equal(prep.levelPush.rareValueLevel,925);
  assert.ok(prep.levelPush.seconds>0);
}

assert.ok(M.maxCoreLevel(0,M.totalCoreForAscension(500))>52);

console.log('singularity v76 model regression: PASS');
