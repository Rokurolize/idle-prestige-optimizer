import assert from 'node:assert/strict';
import M from '../ascension-model.js';

// r80 instantiated GameBalanceConfig values from the scene, not Udon constructor defaults.
assert.equal(M.BASE_SPAWN_INTERVAL,1.6666666);
assert.equal(M.MIN_SPAWN_RATE,.01);
assert.equal(M.MIN_SPAWN_INTERVAL,.05);
assert.equal(M.MAX_TOP_SPAWN_RATE,20);
assert.equal(M.NORMAL_AUTO_UNLOCK_COST,300);
assert.equal(M.BOOST_MULTIPLIER,2);
assert.equal(M.BOMB_RARITY_CHANCE,.0015);
assert.equal(M.BOMB_DANGER_MULTIPLIER,2);
assert.equal(M.INSTANCE_BONUS_PER_PLAYER,.03);
assert.equal(M.INSTANCE_BONUS_MAX_MULTIPLIER,1.5);

// UpgradeManager keeps Normal Upgrade costs in log space; there is no integer ceil.
const upgradeCost=10**M.normalNextCostLog10(1,1,1);
assert.ok(Math.abs(upgradeCost-14*1.73)<1e-10,`unexpected normal cost ${upgradeCost}`);

// OreSpawner.GetSpawnInterval = max(.05, baseSpawnInterval / max(.01, rate)).
const spawn=M.topSpawnRate([0,0,0,0,0],Array(8).fill(0),1,1);
assert.ok(Math.abs(spawn.raw-1/1.6666666)<1e-12);
assert.ok(Math.abs(spawn.actual-spawn.raw)<1e-12);
assert.equal(M.topSpawnRate([0,0,0,0,45],Array(8).fill(0),4,1).actual,20);

// InstanceBonusManager uses floor(playerCount / 1) steps, including the local player.
assert.equal(M.instanceBonusMultiplier(1),1.03);
assert.equal(M.instanceBonusMultiplier(9),1.27);
assert.equal(M.instanceBonusMultiplier(17),1.5);
assert.equal(M.instanceBonusMultiplier(100),1.5);

// Bomb is rolled before Gem/Rare/Ori and removes that spawn from the ordinary-sale pool.
const rarity=M.rarityState([0,0,0,200,0,0,0,0],[0,0,0,0,10,0,0,50],{bombUnlocked:true,dangerEnabled:false});
assert.ok(Math.abs(rarity.pBomb-.0015)<1e-15);
assert.ok(Math.abs(rarity.pSale-.9985)<1e-15);
assert.ok(Math.abs(rarity.pGem-.009985)<1e-12);
assert.ok(Math.abs(rarity.pRare-.4942575)<1e-12);
assert.ok(Math.abs(rarity.pOri-.4942575)<1e-12);
assert.ok(Math.abs(rarity.pBomb+rarity.pNormal+rarity.pRare+rarity.pGem+rarity.pOri-1)<1e-12);
assert.equal(M.rarityState(Array(8).fill(0),Array(8).fill(0),{bombUnlocked:true,dangerEnabled:true}).pBomb,.003);

const baseStats=M.targetOreStats({level:100,normalLevels:Array(8).fill(0),coreLevels:[0,0,0,0,0],ingotLevels:Array(8).fill(0),slowdown:1,physicalCap:15.75,instancePlayerCount:1});
const bombStats=M.targetOreStats({level:100,normalLevels:Array(8).fill(0),coreLevels:[0,0,0,0,0],ingotLevels:Array(8).fill(0),slowdown:1,physicalCap:15.75,instancePlayerCount:1,bombUnlocked:true});
assert.ok(Math.abs(bombStats.terminalSupply/baseStats.terminalSupply-.9985)<1e-12);
const incomeBoostStats=M.targetOreStats({level:100,normalLevels:Array(8).fill(0),coreLevels:[0,0,0,0,0],ingotLevels:Array(8).fill(0),slowdown:1,physicalCap:15.75,instancePlayerCount:1,incomeBoostActive:true});
assert.ok(Math.abs((incomeBoostStats.expectedIncomePerTerminalLog-baseStats.expectedIncomePerTerminalLog)-Math.log10(2))<1e-12);
const twoPlayerStats=M.targetOreStats({level:100,normalLevels:Array(8).fill(0),coreLevels:[0,0,0,0,0],ingotLevels:Array(8).fill(0),slowdown:1,physicalCap:15.75,instancePlayerCount:2});
assert.ok(Math.abs((twoPlayerStats.expectedIncomePerTerminalLog-baseStats.expectedIncomePerTerminalLog)-Math.log10(1.06/1.03))<1e-12);

// Instance bonus is an income multiplier, not EXP efficiency. EXP Boost is separate.
const noExpBoost=M.simulateCurve({maxTarget:1000,core:[0,0,0,0,0],ingot:Array(8).fill(0),slowdown:1,physicalCap:15.75,normalAutoEnabled:false,instancePlayerCount:1});
const manyPlayers=M.simulateCurve({maxTarget:1000,core:[0,0,0,0,0],ingot:Array(8).fill(0),slowdown:1,physicalCap:15.75,normalAutoEnabled:false,instancePlayerCount:10});
const expBoost=M.simulateCurve({maxTarget:1000,core:[0,0,0,0,0],ingot:Array(8).fill(0),slowdown:1,physicalCap:15.75,normalAutoEnabled:false,instancePlayerCount:1,expBoostActive:true});
assert.equal(manyPlayers.times[1000],noExpBoost.times[1000]);
assert.ok(expBoost.times[1000]<noExpBoost.times[1000],'EXP Boost must accelerate EXP progression');

// EconomyManager total Ingot and PrestigeManager total earned are distinct counters.
// The displayed Prestige multiplier is the authoritative way to recover the latter.
assert.equal(M.prestigeTotalIngotsEarnedFromMultiplier(6930),4801104100);
const userIngot=[0,44,45,0,0,39,17,39];
const economyTotal=M.inferTotalIngotsEarned(227700000000000,userIngot,true);
assert.ok(economyTotal>1e14);
assert.ok(economyTotal/M.prestigeTotalIngotsEarnedFromMultiplier(6930)>10000);

// Compression direct Ingots do not increase the Prestige permanent damage multiplier.
const compressionE=M.compressionE(9485,52),prestigeTotal=M.prestigeTotalIngotsEarnedFromMultiplier(6930),commonCurve={maxTarget:500,core:[15,25,22,9,12],ingot:userIngot,slowdown:1e5,physicalCap:15.75,totalIngotsEarned:prestigeTotal,dpsCalibration:1,hpCalibration:1,normalAutoEnabled:false};
const offCurve=M.simulateCurve({...commonCurve,compressionEnabled:false});
const onCurve=M.simulateCurve({...commonCurve,compressionEnabled:true,compressionE,compressionRequiredIngots:M.nextAscensionRequirement(16)});
assert.ok(onCurve.directIngotsAtTarget>0);
assert.equal(onCurve.prestigeTotalIngotsEarnedAtTarget,prestigeTotal);
assert.equal(onCurve.dpsLogAtTarget,offCurve.dpsLogAtTarget);

const after=M.afterAscensionState({ascensionCount:16,normalAutoUnlocked:true,discardedAscensions:52,heldIngots:1e15,totalIngotsEarned:prestigeTotal,prestigeMultiplier:6930,ingotLevels:userIngot});
assert.equal(after.heldIngots,M.legacyStartIngot(52));
assert.equal(after.totalIngotsEarned,0);
assert.equal(after.prestigeMultiplier,1);
assert.deepEqual(after.ingotLevels,Array(8).fill(0));

assert.equal(M.nextAscensionRequirement(99),9.9e63);
assert.equal(M.nextAscensionRequirement(100),Math.floor(9.9e63*3.55));

// The reported [28,31,28,9,18] Core allocation cannot exist at A19, but it fits A20
// with 159,222,419 Core left — matching the game screenshot's 159.22M. The game also
// shows the A20 requirement 5e17, so an A19 optimizer state is one Ascension behind.
const reportedCore=[28,31,28,9,18],reportedCoreCost=M.coreBundleCost(reportedCore);
assert.equal(reportedCoreCost,3327561981);
assert.ok(reportedCoreCost>M.totalCoreForAscension(19));
assert.equal(M.totalCoreForAscension(20)-reportedCoreCost,159222419);
assert.equal(M.nextAscensionRequirement(19),9e16);
assert.equal(M.nextAscensionRequirement(20),5e17);

// Regression for the reported A16 Compression wall: the former Lv4433 recommendation
// is physically impossible with the game-displayed Prestige multiplier x6.93K.
const cal=M.fitCalibration(M.DEFAULT_MEASUREMENTS,36.5);
const oldRecommendation=M.simulateCurve({maxTarget:4434,core:[15,25,22,9,12],ingot:userIngot,slowdown:1e6,physicalCap:cal.physicalCap,totalIngotsEarned:prestigeTotal,dpsCalibration:1,hpCalibration:1,compressionEnabled:true,compressionE,compressionRequiredIngots:M.nextAscensionRequirement(16),normalAutoEnabled:true,normalAutoUpdatesPerSecond:36.5,normalAutoCalibration:cal,instancePlayerCount:1,bombUnlocked:true});
assert.ok(oldRecommendation.minOneShot[4433]<1e-10,`old Lv4433 should be rejected, got one-shot ${oldRecommendation.minOneShot[4433]}`);

console.log('r80 runtime audit regression: PASS');
