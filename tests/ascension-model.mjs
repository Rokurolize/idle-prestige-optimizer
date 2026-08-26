import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

assert.equal(M.totalCoreForAscension(7),2186);
assert.equal(M.nextAscensionRequirement(7),10_000_000_000);
assert.equal(M.maxCoreLevel(1,2186),11);
assert.equal(M.coreCost(1,11),2047);
assert.equal(M.prestigeGain(460,9),40_023_552);
assert.equal(M.prestigeGain(460,11),160_094_208);
assert.equal(M.ingotEffect(4,10),1);
assert.equal(M.ingotEffect(4,11),1,'Gem chance is capped at 1.0%');
assert.equal(M.ingotEffect(6,17),0,'Stall duration reaches zero at Lv17');
assert.equal(M.NORMAL_AUTO_UNLOCK_COST,300);
assert.equal(M.expectedTerminalPerTop(1),1);
assert.ok(Math.abs(M.expectedTerminalPerTop(5)-((.45+1.6)/.85))<1e-12);
assert.ok(Math.abs(M.expectedTerminalPerTop(15)-M.TERMINAL_ORES_PER_TOP)<1e-9);
assert.equal(M.baseOreValue(1),M.EARLY_ORE_VALUE[0]);
assert.equal(M.baseOreHp(30),M.EARLY_ORE_HP[29]);
assert.equal(M.OUTER_DAMAGE_FACTOR,.55);

const cal=M.fitCalibration(M.DEFAULT_MEASUREMENTS);
assert.ok(cal.physicalCap>=9&&cal.physicalCap<=13,`unexpected contact saturation asymptote ${cal.physicalCap}`);
// High-level progression must stay finite in log space. The old implementation
// overflowed required EXP at Lv2302 and accidentally made ~Lv2288 look optimal.
assert.ok(Number.isFinite(M.requiredExpLog10(6000)));
assert.ok(Number.isFinite(M.baseOreValueLog10(6000)));
assert.ok(Number.isFinite(M.baseOreHpLog10(6000)));
const highCore=[22,23,19,9,11],highIngot=[45,45,44,46,0,41,17,40];
const highCurve=M.simulateCurve({maxTarget:4000,core:highCore,ingot:highIngot,slowdown:1e7,physicalCap:cal.physicalCap,totalIngotsEarned:M.inferTotalIngotsEarned(15.01e12,highIngot,true)});
assert.ok(Number.isFinite(highCurve.times[2400])&&highCurve.times[2400]>0,'Lv2400 must remain simulatable');
assert.ok(Number.isFinite(highCurve.times[3500])&&highCurve.times[3500]>highCurve.times[2400],'high-level time curve must remain monotone and finite');
const highInput={objective:'ascensionEta',ascensionCount:15,totalCore:M.totalCoreForAscension(15),heldIngots:15.01e12,totalIngotsEarned:M.inferTotalIngotsEarned(15.01e12,highIngot,true),prestigeCount:11,normalAutoUnlocked:true,ingotLevels:highIngot,maxTargetLevel:4000,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,manualClickRate:4};
const highResult=M.optimizeAscension(highInput,M.DEFAULT_MEASUREMENTS);
assert.ok(highResult.plan&&highResult.plan.targetLevel>2302,`high-level optimizer must search past the old overflow wall, got ${highResult.plan&&highResult.plan.targetLevel}`);
assert.ok(Number.isFinite(highResult.plan.seconds)&&Number.isFinite(highResult.plan.eta));
assert.equal(highResult.plan.timingValidated,false,'A15 high-level AP is still an empirical extrapolation without same-config measurements');

assert.ok(cal.rmse<1.5,`calibration RMSE too large: ${cal.rmse}`);
for(const row of M.DEFAULT_MEASUREMENTS){
  const curve=M.simulateCurve({maxTarget:row.targetLevel,core:row.core,ingot:row.ingot,slowdown:row.slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:row.totalIngotsEarned});
  const predicted=cal.intercept+cal.scale*curve.times[row.targetLevel];
  assert.ok(Math.abs(predicted-row.seconds)<2,`${row.label}: predicted ${predicted}, observed ${row.seconds}`);
}

// User-reported A9 state: GetSpawnInterval's 0.05 s floor means exactly 20 top ores/s
// at ×1K, while ×2K must be 10.328.../s.  This regression guards the bug where
// the optimizer treated the fitted terminal-contact cap as the spawn cap.
const a9Core=[9,14,9,8,6],a9Ingot=[0,31,0,29,0,0,17,0];
const spawn1k=M.topSpawnRate(a9Core,a9Ingot,4,1000),spawn2k=M.topSpawnRate(a9Core,a9Ingot,4,2000);
assert.ok(Math.abs(spawn1k.raw-20.65621964097149)<1e-9);
assert.equal(spawn1k.actual,20);
assert.ok(Math.abs(spawn2k.actual-10.328109820485745)<1e-9);

// At Lv1292 with Rare Rate maxed and EXP Lv31, Rare Value Lv0 -> Lv7 is not
// overflow-clipped: it raises useful EXP per processed terminal ore by exactly 70%.
const rare0=M.expectedUsefulExpPerTerminal(1292,1000,200,a9Ingot);
const rare7Levels=a9Ingot.slice();rare7Levels[5]=7;
const rare7=M.expectedUsefulExpPerTerminal(1292,1000,200,rare7Levels);
assert.ok(rare0.workRare<1&&rare7.workRare<1);
assert.ok(Math.abs(rare7.useful/rare0.useful-1.7)<1e-12);

// DPS anchors must be able to recover a known multiplicative calibration.
const anchorCurve=M.simulateCurve({maxTarget:601,core:a9Core,ingot:a9Ingot,slowdown:1000,physicalCap:cal.physicalCap,totalIngotsEarned:1e9,dpsCalibration:1});
const syntheticObserved=Math.pow(10,anchorCurve.dpsLogAtTarget)*.25;
const anchor=M.deriveDpsCalibration({level:600,core:a9Core,ingot:a9Ingot,slowdown:1000,totalIngotsEarned:1e9,dps:syntheticObserved},cal.physicalCap);
assert.ok(Math.abs(anchor.calibration-.25)<1e-9,`DPS anchor calibration=${anchor.calibration}`);

// Ascension bootstrap: with Core Ingot Lv9, the first Lv50+ Prestige already
// yields >=512▲, enough to pay the 300▲ Normal Upgrade Auto unlock.  The model
// must spend exactly 300, carry the remainder forward, and count the Prestige.
const bootInput={normalAutoUnlocked:false,heldIngots:0,totalIngotsEarned:0,prestigeCount:0,maxTargetLevel:300,oneShotMargin:0,strictOneShot:false,dpsCalibration:1,hpCalibration:1};
const bootCore=[0,9,0,0,0],bootIngot=Array(8).fill(0);
const boot=M.planNormalAutoBootstrap(bootInput,bootCore,bootIngot,cal,1);
assert.ok(boot&&boot.needed&&boot.prestigePerformed,'bootstrap should require one Prestige');
assert.ok(boot.targetLevel>=50&&boot.gain>=300);
assert.equal(boot.cost,300);
assert.equal(boot.heldAfter,boot.gain-300);
assert.equal(boot.postState.prestigeCount,1);
assert.equal(boot.postState.totalIngotsEarned,boot.gain);
assert.equal(boot.postState.normalAutoUnlocked,true);
const bootFromHeld=M.planNormalAutoBootstrap({...bootInput,heldIngots:350},bootCore,bootIngot,cal,1);
assert.equal(bootFromHeld.prestigePerformed,false);
assert.equal(bootFromHeld.heldAfter,50);

const input={ascensionCount:7,totalCore:2186,heldIngots:0,totalIngotsEarned:2e9,prestigeCount:0,maxTargetLevel:1400,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,ingotLevels:M.DEFAULT_INGOT_LEVELS.slice()};
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.plan,'optimizer should return a feasible A7 plan');
assert.equal(result.selectedIngotLevel,11,'A7 must retain the maximum feasible Core Ingot level');
assert.equal(result.backedOff,0);
assert.equal(result.plan.core[1],11);
assert.ok(M.coreBundleCost(result.plan.core)<=2186);
assert.ok(result.plan.oneShotRatio>=1);
assert.ok(M.SLOWDOWN.includes(result.plan.slowdown));
assert.ok(result.plan.targetLevel>=50&&result.plan.targetLevel<=1400);
assert.ok(result.plan.gain>0&&result.plan.seconds>0&&result.plan.eta>0);

const fresh={...input,totalIngotsEarned:0,ingotLevels:Array(8).fill(0)};
const freshResult=M.optimizeAscension(fresh,M.DEFAULT_MEASUREMENTS);
const ingotPlan=M.optimizeIngotUpgrades(fresh,freshResult,M.DEFAULT_MEASUREMENTS,24);
assert.ok(ingotPlan.steps.length>0,'fresh Ascension should produce an Ingot purchase roadmap');
assert.ok(ingotPlan.phases.length>0,'roadmap must expose phase-level Core/Slowdown/AP re-planning');
assert.ok(ingotPlan.targetLevels.some((v,i)=>v>fresh.ingotLevels[i]));
assert.ok(ingotPlan.steps[0].hourlyAfter>ingotPlan.steps[0].hourlyBefore,'purchase step should expose ▲/h contribution');
assert.ok(ingotPlan.plannedEta<ingotPlan.baselineEta,'roadmap must reduce modeled time to the Ascension Ingot requirement');
assert.equal(typeof ingotPlan.converged,'boolean');
assert.ok(ingotPlan.nodesEvaluated>0&&ingotPlan.replans>0,'roadmap must report lookahead search/re-planning work');
assert.ok(ingotPlan.steps.every(s=>Number.isInteger(s.prestigesBeforeBuy)&&s.prestigesBeforeBuy>=0),'Ingot purchases must be funded by whole Prestige runs');
assert.ok(ingotPlan.phases.every(p=>Number.isInteger(p.prestigesDuring)&&p.prestigesDuring>=0),'phases must expose Prestige counts');
for(const phase of ingotPlan.phases){
  assert.equal(phase.core.length,5);
  assert.ok(phase.changes.length>0);
  assert.ok(phase.rateAfter>0&&phase.targetLevel>=50);
}

const alreadyBuiltResult=M.optimizeAscension({...input,objective:'ingotRate'},M.DEFAULT_MEASUREMENTS);
const alreadyBuiltPlan=M.optimizeIngotUpgrades({...input,objective:'ingotRate'},alreadyBuiltResult,M.DEFAULT_MEASUREMENTS,24);
assert.ok(alreadyBuiltPlan.plannedEta<=alreadyBuiltPlan.baselineEta+1e-6);

const freshLocked={...fresh,normalAutoUnlocked:false,maxTargetLevel:700,strictOneShot:true,oneShotMargin:1};
const freshLockedResult=M.optimizeAscension(freshLocked,M.DEFAULT_MEASUREMENTS);
assert.ok(freshLockedResult.plan&&freshLockedResult.plan.bootstrap.needed);
assert.ok(freshLockedResult.plan.bootstrap.prestigePerformed);
assert.equal(freshLockedResult.plan.bootstrap.cost,300);
assert.equal(freshLockedResult.plan.runs,freshLockedResult.plan.steadyRuns+1);
assert.ok(typeof freshLockedResult.strictFallback==='boolean');
assert.equal(freshLockedResult.plan.bootstrap.manualNormalPurchases,true);
assert.ok(freshLockedResult.plan.bootstrap.manualPurchases>0);
assert.equal(freshLockedResult.plan.bootstrap.manualNormalLevels.length,8);

console.log(JSON.stringify({
  calibration:{physicalCap:cal.physicalCap,rmse:cal.rmse},
  a7:{core:result.plan.core,slowdown:result.plan.slowdown,targetLevel:result.plan.targetLevel,seconds:result.plan.seconds,gain:result.plan.gain},
  bootstrap:{targetLevel:boot.targetLevel,actualPrestigeLevel:boot.actualPrestigeLevel,gain:boot.gain,heldAfter:boot.heldAfter},
  freshFirst:ingotPlan.steps[0]
},null,2));

// Goal UI does not ask for _totalIngotsEarned. It is exactly reconstructable
// during an Ascension from visible held Ingots + Ingot Upgrade spend + 300▲ Auto unlock.
const inferredLevels=[3,2,1,0,0,0,0,0];
assert.equal(M.inferTotalIngotsEarned(1234,inferredLevels,true),1234+M.ingotBundleCost(inferredLevels)+300);
assert.equal(M.inferTotalIngotsEarned(1234,inferredLevels,false),1234+M.ingotBundleCost(inferredLevels));

// The next-Ascension goal uses the visible current Prestige counter because
// Ingots arrive only at Prestige and Ascension requires both held Ingots and 25P.
const etaInput={...input,objective:'ascensionEta',prestigeCount:0,totalIngotsEarned:M.inferTotalIngotsEarned(0,input.ingotLevels,true)};
const etaResult=M.optimizeAscension(etaInput,M.DEFAULT_MEASUREMENTS);
assert.ok(etaResult.plan&&etaResult.plan.runs>=25);
const etaInput24={...etaInput,prestigeCount:24};
const etaResult24=M.optimizeAscension(etaInput24,M.DEFAULT_MEASUREMENTS);
assert.ok(etaResult24.plan&&etaResult24.plan.runs>=1);
assert.ok(etaResult24.plan.runs<=etaResult.plan.runs,'having 24/25 Prestige must not require more remaining runs');

// High-Ascension fresh reset: one full Prestige can finance tens of Ingot levels.
// The roadmap must see through that capital jump instead of stopping after a few
// individually-greedy purchases (the old A17 bug stopped around EXP5/Crush3).
const a17Fresh={objective:'ascensionEta',ascensionCount:17,totalCore:M.totalCoreForAscension(17),heldIngots:0,totalIngotsEarned:0,prestigeCount:0,normalAutoUnlocked:false,ingotLevels:Array(8).fill(0),maxTargetLevel:4750,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,manualClickRate:4};
const a17FreshResult=M.optimizeAscension(a17Fresh,M.DEFAULT_MEASUREMENTS);
const a17Road=M.optimizeIngotUpgrades(a17Fresh,a17FreshResult,M.DEFAULT_MEASUREMENTS,192);
assert.ok(a17Road.steps.some(s=>s.bulk&&s.level>=30),`A17 roadmap must contain a bulk capital jump: ${JSON.stringify(a17Road.targetLevels)}`);
assert.ok(a17Road.targetLevels[1]>=30,'A17 fresh EXP target should reach the tens-of-levels regime after the first full Prestige');
assert.ok(a17Road.plannedEta<a17Road.baselineEta,'A17 bulk roadmap must beat holding the reset Ingot state');

// Selected slowdown and the maximum slowdown that still preserves the 20/s spawn
// cap are intentionally different concepts. With the user's A17 high-Ingot state,
// a Core Feed Lv15 near-tie can preserve 20/s through ×100B even when the strict
// ETA winner chooses a smaller slowdown for packet-granularity reasons.
const a17HighIngot=[44,47,46,46,0,41,17,41];
const a17High={...a17Fresh,heldIngots:0,prestigeCount:0,normalAutoUnlocked:false,ingotLevels:a17HighIngot,totalIngotsEarned:M.inferTotalIngotsEarned(0,a17HighIngot,false)};
const a17HighResult=M.optimizeAscension(a17High,M.DEFAULT_MEASUREMENTS);
assert.ok(a17HighResult.plan.maxSupplyCappedSlowdown>=1e10);
assert.ok(a17HighResult.nearAlternatives.some(a=>a.core[4]>=15&&a.maxSupplyCappedSlowdown>=1e11),'A17 near-optimal alternatives should expose the Feed15 / ×100B supply-cap headroom');

// Overnight ranking is a distinct goal: no Prestige during the sleep run, hence
// Core Ingot must be zero and the optimizer maximizes the end-of-window score.
const rankingInput={ascensionCount:7,totalCore:2186,heldIngots:1e6,normalAutoUnlocked:true,ingotLevels:M.DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:M.inferTotalIngotsEarned(1e6,M.DEFAULT_INGOT_LEVELS,true),afkHours:8,dpsCalibration:1,hpCalibration:1,manualClickRate:4};
const ranking=M.optimizeRanking(rankingInput,M.DEFAULT_MEASUREMENTS);
assert.ok(ranking.plan,'ranking optimizer should return a plan');
assert.equal(ranking.plan.core[1],0,'ranking deep run must not waste Core on Ingot multiplier');
assert.ok(ranking.plan.level>50);
assert.ok(ranking.plan.expectedScoreLog>=ranking.plan.normalScoreLog);
assert.ok(M.SLOWDOWN.includes(ranking.plan.slowdown));
