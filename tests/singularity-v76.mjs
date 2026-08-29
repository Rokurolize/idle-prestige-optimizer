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
assert.ok(Math.abs(late.pGem-.01)<1e-12);
assert.ok(Math.abs(late.pOri-.99)<1e-12);
assert.ok(Math.abs(late.pRare)<1e-12);
assert.ok(Math.abs(late.pNormal)<1e-12);
assert.ok(Math.abs(M.compressionRarityValueMultiplier(100,1,100)-198.2)<1e-9);
assert.equal(M.compressionExpectedIngotPerOre(1,100,1,100),1);
assert.ok(Math.abs(M.compressionExpectedIngotPerOre(11113200,100,1,100)-198.2)<1e-9);
assert.equal(M.nextAscensionRequirement(35),2e26);
assert.equal(M.nextAscensionRequirement(42),9e30);
assert.equal(M.nextAscensionRequirement(43),4e30);
assert.equal(M.nextAscensionRequirement(99),9.9e63);

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

for(const [terminalSalesPerSecond,extra,finalDiscarded,afterA500,observable] of [[15.75,20,70,570,26621],[M.THEORETICAL_TERMINAL_SALES_RATE,19,69,569,26624]]){
  const prep=M.optimizeCompressionPreparation({discardedAscensions:50,terminalSalesPerSecond,rarePercent:100,gemLevel:10,totalCrushLog:0,bestLevel:9000});
  assert.deepEqual(prep.overlap.extraLegacyCycles,[extra]);
  assert.equal(prep.overlap.finalCycleDiscarded,finalDiscarded);
  assert.equal(prep.afterA500LegacyDiscarded,afterA500);
  assert.equal(prep.observableBestLevel,observable);
  assert.equal(prep.levelTarget,observable);
  assert.equal(prep.levelPush.expLevel,940);
  assert.equal(prep.levelPush.rareValueLevel,935);
  assert.ok(Number.isFinite(prep.levelPush.seconds)&&prep.levelPush.seconds>0);
}

assert.ok(M.maxCoreLevel(0,M.totalCoreForAscension(500))>52);

const switchPlan=M.optimizeCompressionSwitchPlan({
  ascensionCount:0,
  discardedAscensions:52,
  maxLevelEver:9485,
  normalAutoUnlocked:true,
  dpsCalibration:1,
  hpCalibration:1,
  manualClickRate:4,
  uiClickRate:4,
  normalAutoUpdatesPerSecond:36.5
},M.DEFAULT_MEASUREMENTS,{probeLimit:8,roadmapSteps:32});
assert.equal(switchPlan.switchAscension,2);
assert.equal(switchPlan.verifiedThrough,6);
assert.equal(switchPlan.certifiedThrough,499);
assert.deepEqual(switchPlan.rows.map(x=>x.preferred),['off','off','on','on','on','on','on']);
assert.ok(switchPlan.rows[0].offEta<switchPlan.rows[0].onEta);
assert.ok(switchPlan.rows[1].offEta<switchPlan.rows[1].onEta);
assert.ok(switchPlan.rows[2].onEta<switchPlan.rows[2].offEta);

console.log('singularity r80 model regression: PASS');
