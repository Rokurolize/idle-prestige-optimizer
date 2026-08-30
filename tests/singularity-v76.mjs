import assert from 'node:assert/strict';
import M from '../ascension-model.js';

assert.match(M.MODEL_REVISION,/^r82-runtime-/);
assert.equal(M.LEGACY_REQUIRED_ASCENSIONS,10);
assert.equal(M.COMPRESSION_UNLOCK_DISCARDED,50);
assert.equal(M.ASCENSION_MAX_COUNT,500);
assert.equal(M.COMPRESSION_INGOT_DENOMINATOR,555660);
assert.equal(M.BOMB_RARITY_CHANCE,.002);
assert.equal(M.legacyStartIngot(28),43904);
assert.equal(M.legacyStartIngot(50),250000);
assert.equal(M.legacyStartIngot(293),50000000);
assert.equal(M.legacyStartIngot(500),50000000);
assert.equal(M.compressionUnlocked(49),false);
assert.equal(M.compressionUnlocked(50),true);

const locked=9485,discarded=52;
const expectedE=Math.pow(10,locked/7500)/185*Math.sqrt(discarded/50)+locked/1805+.04*discarded;
assert.ok(Math.abs(M.compressionE(locked,discarded)-expectedE)<1e-12);
assert.ok(M.compressionE(locked+1000,discarded)>expectedE);

assert.equal(M.SLOWDOWN.length-1,46);
assert.equal(M.SLOWDOWN.at(-1),1e42);
assert.equal(M.CORE_FEED.length-1,56);
assert.equal(M.CORE_FEED.at(-1),1e52);
assert.deepEqual([M.INGOT.optimizerCap[4],M.INGOT.optimizerCap[6],M.INGOT.optimizerCap[7]],[10,17,100]);
assert.equal(M.ingotEffect(4,10),1);
assert.equal(M.ingotEffect(4,11),1);
assert.equal(M.ingotEffect(7,100),100);
assert.equal(M.ingotEffect(7,101),100);
assert.equal(M.ingotEffect(6,17),.01);

const late=M.compressionRarityState(100,1,100);
assert.ok(Math.abs(late.pGem-.01)<1e-12);
assert.ok(Math.abs(late.pOri-.99)<1e-12);
assert.ok(Math.abs(late.pRare)<1e-12);
assert.ok(Math.abs(late.pNormal)<1e-12);
assert.ok(Math.abs(M.compressionRarityValueMultiplier(100,1,100)-198.2)<1e-9);
assert.equal(M.compressionExpectedIngotPerOre(1,100,1,100),1);
assert.ok(Math.abs(M.compressionExpectedIngotPerOre(555660,100,1,100)-198.2)<1e-9);

const legacy=M.afterLegacyState({ascensionCount:10,discardedAscensions:52,maxLevelEver:12000,compressionLockedLevel:9485,heldIngots:9e30,totalIngotsEarned:8e20,prestigeMultiplier:9000,prestigeCount:44,ingotLevels:Array(8).fill(50),currentCoreLevels:[1,2,3,4,5],currentSlowdownLevel:46});
assert.equal(legacy.ascensionCount,0);
assert.equal(legacy.discardedAscensions,62);
assert.equal(legacy.compressionLockedLevel,12000,'Legacy captures the live best Level');
assert.equal(legacy.heldIngots,M.legacyStartIngot(62));
assert.equal(legacy.totalIngotsEarned,0);
assert.equal(legacy.prestigeMultiplier,1);
assert.equal(legacy.prestigeCount,0);
assert.deepEqual(legacy.ingotLevels,Array(8).fill(0));
assert.deepEqual(legacy.currentCoreLevels,[0,0,0,0,0]);
assert.equal(legacy.currentSlowdownLevel,0);

const statVolC=80;
assert.ok(Math.abs(M.compressionVolumeLog(statVolC)-(statVolC+Math.log10(M.ORE_VOLUME)))<1e-12);
assert.equal(M.compressionVolumeLog(null),-Infinity);
const targetStat=M.COMPRESSION_VOLUME_TARGET_LOG-Math.log10(M.ORE_VOLUME);
assert.equal(M.observableUniverseReady(targetStat),true);
assert.equal(M.observableUniverseReady(targetStat-.1),false);
const futureLow=M.observableUniverseCrushPlan(targetStat-5,5,20),futureHigh=M.observableUniverseCrushPlan(targetStat-5,10,20);
assert.ok(futureLow.seconds>futureHigh.seconds,'only future crushes benefit from a higher active Compression E');
assert.equal(futureLow.currentStatLog,targetStat-5,'stored statVolC must be preserved without adding current E');

const push=M.compressionLevelPushPlan({ascensionCount:51,discardedAscensions:52,initialBestLevel:9485,compressionLockedLevel:9485,targetLevel:10000,totalCore:M.totalCoreForAscension(51),heldIngots:8.53e33,requiredIngots:2e35,terminalSalesPerSecond:15.75,rarePercent:100,gemLevel:10});
assert.equal(push.compressionLockedLevel,9485);
assert.equal(push.activeCompressionE,M.compressionE(9485,52),'pre-Legacy push must use the old locked E');
assert.equal(push.targetLevel,10000);
assert.ok(Number.isFinite(push.seconds)&&push.seconds>0);

const table=M.compressionFarmCoreTable(0,500);
assert.equal(table.length,501);
assert.equal(table[51].ascensionCount,51);
assert.equal(table[51].feedLevel,47);
assert.ok(table[51].maxFeedLevel>table[51].feedLevel);
assert.ok(M.coreBundleCost([78,79,79,9,47])<=M.totalCoreForAscension(51));
assert.equal(M.nextAscensionRequirement(51),2e35);

const floor=M.closedLoopFreshPrestigeFloor(M.DEFAULT_MEASUREMENTS,36.5);
assert.equal(floor.runSeconds,13);
assert.equal(floor.freshAscensionSeconds,325);
const legacyFloor=M.legacyCampaignLowerBound({ascensionCount:51,prestigeCount:4,normalAutoUpdatesPerSecond:36.5},M.DEFAULT_MEASUREMENTS);
assert.equal(legacyFloor.seconds,162500);
assert.equal(legacyFloor.postResetSeconds,162500);

const complete=M.optimizeClosedLoopA500Campaign({ascensionCount:500,discardedAscensions:52,maxLevelEver:9485,compressionLockedLevel:9485},M.DEFAULT_MEASUREMENTS);
assert.equal(complete.totalSeconds,0);
assert.equal(complete.firstAction,'complete');
assert.deepEqual(complete.actions,[]);
assert.equal(complete.legacySearchComplete,true);

const legacyWinning=M.optimizeClosedLoopA500Campaign({ascensionCount:10,discardedAscensions:50,maxLevelEver:100,compressionLockedLevel:100,campaignGoalAscension:20,campaignAscensionLowerBoundSeconds:1,campaignAscensionEdge:s=>({seconds:s.discardedAscensions>=60?1:1000,mode:'on'}),campaignPushTargets:[],campaignPushTargetsComplete:true},M.DEFAULT_MEASUREMENTS);
assert.equal(legacyWinning.firstAction,'legacy');
assert.equal(legacyWinning.legacyActions.length,1);
assert.equal(legacyWinning.finalDiscardedAscensions,60);
assert.equal(legacyWinning.totalSeconds,20);
assert.ok(legacyWinning.visitedStates<100,'A* fallback should not explode on a small exact campaign');

const pushWinning=M.optimizeClosedLoopA500Campaign({ascensionCount:10,discardedAscensions:50,maxLevelEver:100,compressionLockedLevel:100,campaignGoalAscension:20,campaignAscensionLowerBoundSeconds:1,campaignAscensionEdge:s=>({seconds:s.compressionLockedLevel>=200?1:1000,mode:'on'}),campaignPushTargets:[200],campaignPushTargetsComplete:true,campaignLevelPushCost:()=>2},M.DEFAULT_MEASUREMENTS);
assert.equal(pushWinning.firstAction,'push_legacy');
assert.equal(pushWinning.pushActions.length,1);
assert.equal(pushWinning.finalCompressionLockedLevel,200);
assert.equal(pushWinning.totalSeconds,22);

const highBestDefaultPush=M.optimizeClosedLoopA500Campaign({ascensionCount:10,discardedAscensions:50,maxLevelEver:18066,compressionLockedLevel:18066,campaignGoalAscension:20,campaignAscensionLowerBoundSeconds:1,campaignAscensionEdge:s=>({seconds:s.compressionLockedLevel>=19000?1:1000,mode:'on'}),campaignLevelPushCost:({targetLevel})=>targetLevel===19000?2:Infinity},M.DEFAULT_MEASUREMENTS);
assert.equal(highBestDefaultPush.firstAction,'push_legacy','default push search must continue above a live best greater than Lv10000');
assert.equal(highBestDefaultPush.pushActions[0].targetLevel,19000);
assert.equal(highBestDefaultPush.finalCompressionLockedLevel,19000);

const pushHarmful=M.optimizeClosedLoopA500Campaign({ascensionCount:10,discardedAscensions:50,maxLevelEver:100,compressionLockedLevel:100,campaignGoalAscension:20,campaignAscensionLowerBoundSeconds:1,campaignAscensionEdge:()=>({seconds:1,mode:'on'}),campaignPushTargets:[200],campaignPushTargetsComplete:true,campaignLevelPushCost:()=>1000},M.DEFAULT_MEASUREMENTS);
assert.equal(pushHarmful.firstAction,'ascend');
assert.equal(pushHarmful.pushActions.length,0);
assert.equal(pushHarmful.totalSeconds,10);

console.log('singularity r82 model regression: PASS');
