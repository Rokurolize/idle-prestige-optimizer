import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

const fixed={totalEta:2550,interactionClicks:90,core:[0,26,21,0,15],prestigeCore:[0,26,21,0,15],prestigeSchedule:[{runs:25,runCore:[0,26,21,0,15],prestigeCore:[0,26,21,0,15]}]};
const smallManual={totalEta:2520,interactionClicks:600,core:[0,0,22,0,16],prestigeCore:[0,26,22,0,15],prestigeSchedule:[{runs:11,runCore:[0,0,22,0,16],prestigeCore:[0,26,22,0,15]},{runs:14,runCore:[0,0,22,0,16],prestigeCore:[0,26,22,0,15]}]};
const middleManual={...smallManual,totalEta:2490};
const bigManual={...smallManual,totalEta:2250};

const workload=M.coreStrategyWorkload(smallManual);
assert.equal(workload.watchEvents,25);
assert.equal(workload.coreSwitches,49,'manual Core strategy should omit the final return-to-run switch');

const normalSmall=M.assessCoreStrategyPair(fixed,smallManual,'normal');
assert.equal(normalSmall.recommendation,'fixed','30 seconds must not outweigh 25 monitored manual interventions under normal play');
assert.equal(normalSmall.theoreticalSaving,30);
assert.ok(normalSmall.manualRiskBuffer>=100);

const normalMiddle=M.assessCoreStrategyPair(fixed,middleManual,'normal');
assert.equal(normalMiddle.recommendation,'either','a borderline saving should be surfaced as a player-style choice');
const normalBig=M.assessCoreStrategyPair(fixed,bigManual,'normal');
assert.equal(normalBig.recommendation,'manual','a large saving should still justify manual play');

const theoretical=M.assessCoreStrategyPair(fixed,smallManual,'theoretical');
assert.equal(theoretical.recommendation,'manual','theoretical mode must preserve pure ETA ordering');
assert.equal(theoretical.manualRiskBuffer,0);
assert.equal(M.assessCoreStrategyPair(null,smallManual,'idle').recommendation,'manual','the only available manual strategy must remain selectable');

const idle=M.assessCoreStrategyPair(fixed,bigManual,'idle');
assert.ok(['fixed','either','manual'].includes(idle.recommendation));
assert.ok(idle.manualThreshold>normalBig.manualThreshold,'idle-first mode must demand a larger manual advantage than normal mode');

const a16Input={objective:'ascensionEta',ascensionCount:16,totalCore:43046720,heldIngots:2970000000000,totalIngotsEarned:74438258558137,prestigeCount:7,currentCoreLevels:[20,23,20,9,13],currentSlowdownLevel:14,normalAutoUnlocked:true,ingotLevels:[44,43,43,43,18,38,17,38],maxTargetLevel:4500,discardedAscensions:28,maxLevelEver:9485,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5};
const a16=M.optimizeAscension(a16Input,M.DEFAULT_MEASUREMENTS),a16Normal=M.assessCoreStrategyPair(a16.fixedPlan,a16.manualPlan,'normal'),a16Theoretical=M.assessCoreStrategyPair(a16.fixedPlan,a16.manualPlan,'theoretical');
assert.equal(a16.recommendedMode,'manual','A16 theoretical optimizer should remain unchanged');
assert.equal(a16Normal.recommendation,'fixed','A16 41.75s manual edge must not override the stable fixed plan under normal play');
assert.equal(a16Theoretical.recommendation,'manual');
assert.equal(a16Normal.theoreticalSaving,41.75);
assert.equal(a16Normal.workload.watchEvents,18);

console.log(JSON.stringify({workload,normalSmall,normalMiddle,normalBig,theoretical,idle,a16:{fixed:a16.fixedPlan.totalEta,manual:a16.manualPlan.totalEta,theoreticalMode:a16.recommendedMode,normal:a16Normal,theoretical:a16Theoretical}},null,2));
