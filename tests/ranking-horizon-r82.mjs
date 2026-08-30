import assert from 'node:assert/strict';
import M from '../ascension-model.js';

// Exact A99 diagnostic exported from the public page before this fix. The old
// implementation silently clipped both the search horizon and result at Lv10000,
// even though the user had already reached Lv18066 in this state.
const input={ascensionCount:99,totalCore:M.totalCoreForAscension(99),heldIngots:6.5e63,ingotLevels:[218,218,217,217,10,212,17,100],totalIngotsEarned:M.prestigeTotalIngotsEarnedFromMultiplier(4.59e26),prestigeCount:0,afkHours:2,compressionEnabled:true,discardedAscensions:52,compressionLockedLevel:9485,maxLevelEver:9485,rankingMaxLevel:10000,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1,damageBoostMultiplier:1};
const result=M.optimizeRanking(input,M.DEFAULT_MEASUREMENTS);
assert.ok(result.plan,'ranking optimizer should return a plan');
assert.ok(result.plan.searchHorizonLevel>=18066,'historically reached Lv18066 must not sit beyond the search horizon');
assert.equal(result.plan.horizonTruncated,false,'2-hour ranking horizon should be fully covered');
assert.notEqual(result.plan.level,10000,'ranking result must not be silently clipped to the former Lv10000 horizon');
assert.ok(result.plan.level>10000,'this regression state should progress beyond Lv10000');
console.log(JSON.stringify({level:result.plan.level,searchHorizonLevel:result.plan.searchHorizonLevel,horizonTruncated:result.plan.horizonTruncated}));
