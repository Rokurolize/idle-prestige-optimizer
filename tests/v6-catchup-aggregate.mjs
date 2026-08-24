import assert from 'node:assert/strict';
import v6 from '../v6-model.js';

const settings={reducerExponent:1.25,gravityExponent:.715};
const actionLog=[
  {
    at:100000,
    runId:6,
    type:'catchup_sync',
    level:64,
    observationQuality:'aggregate',
    detail:{fromLevel:58,toLevel:64,elapsedMs:1122000,aggregateOnly:true,trainablePerLevel:false,playMode:'active'}
  },
  {
    at:105000,
    runId:6,
    type:'exp_full_level_up',
    level:65,
    observationQuality:'state_only',
    upgrades:{speed:50,power:420.2,reducer:2.4,rare:10,gravity:21.31,spikeCount:12,spikeSize:1.15,feed:4},
    permanent:{prestigeCash:1.5,prestigeDmg:1.5,refining:5.44,crush:5.44,expEff:1.44,ingots:8},
    detail:{from:64,to:65,durationMs:5000,exactTiming:false,timingQuality:'partial'}
  }
];

const model=v6.buildWorkModel(actionLog,[],7,settings);
assert.equal(model.aggregateConstraints.length,1);
assert.deepEqual(model.aggregateConstraints[0],{
  runId:6,fromLevel:58,toLevel:64,elapsedSeconds:1122,playMode:'active',observationQuality:'aggregate',trainablePerLevel:false,at:100000
});
assert.equal(model.prior(60).count,0,'aggregate catch-up must not become a fake per-level prior');
assert.equal(model.prior(64).count,0,'partial post-catch-up EXP timing must not train level work');
assert.equal(v6.walkForwardReplay({actionLog,observations:[],settings}).length,0,'partial catch-up completion must not enter replay metrics');

console.log(JSON.stringify({aggregate:model.aggregateConstraints[0],prior60:model.prior(60),pass:true}));
