import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const v6=require('../v6-model.js');

const upgrades={
  speed:{name:'Speed',value:10,cost:10,step:1,stepDelta:0,growth:1.2,unlock:1,cap:null},
  power:{name:'Power',value:2,cost:10,step:2,stepDelta:0,growth:2,unlock:1,cap:null},
  reducer:{name:'Reducer',value:1,cost:1e9,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null},
  rare:{name:'Rare',value:0,cost:1e9,step:.5,stepDelta:0,growth:2,unlock:1,cap:null},
  gravity:{name:'Gravity',value:9.81,cost:1e9,step:.5,stepDelta:0,growth:2,unlock:1,cap:null},
  spikeCount:{name:'Spike Count',value:4,cost:1e9,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12},
  spikeSize:{name:'Spike Size',value:1,cost:1e9,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15},
  feed:{name:'Feed',value:1,cost:1e9,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4}
};
const permanent={prestigeCash:1,prestigeDmg:1,refining:1,crush:1,expEff:1,ingots:0};
const snap=(at,runId,level,dps,ups=upgrades,type='state')=>({at,runId,type,level,cash:1000,dps,dpsCalibration:1,permanent,upgrades:JSON.parse(JSON.stringify(ups))});

const log=[];
log.push(snap(0,1,10,1));
log.push({...snap(100000,1,11,1,upgrades,'exp_full_level_up'),detail:{from:10,to:11,durationMs:100000,exactTiming:true}});

const run2Start=200000;
log.push(snap(run2Start,2,10,1));
const upgraded=JSON.parse(JSON.stringify(upgrades));
upgraded.power.value=4;
const beforeState={upgrades,permanent,dps:1,dpsCalibration:1,settings:{}};
const afterState={upgrades:upgraded,permanent,dps:2,dpsCalibration:1,settings:{}};
const rateRatio=v6.expPotential(afterState,v6.throughputContext(afterState))/v6.expPotential(beforeState,v6.throughputContext(beforeState));
const tailSeconds=50/rateRatio;
const run2End=run2Start+50000+tailSeconds*1000;
log.push({...snap(run2Start+50000,2,10,2,upgraded,'purchase'),detail:{key:'power',from:2,to:4,cost:10}});
log.push({...snap(run2End,2,11,2,upgraded,'exp_full_level_up'),detail:{from:10,to:11,durationMs:50000+tailSeconds*1000,exactTiming:true}});

const w1=v6.inferCompletedLevelWork(log,[],1,10,{});
const w2=v6.inferCompletedLevelWork(log,[],2,10,{});
const model=v6.buildWorkModel(log,[],3,{});
const prior=model.prior(10);
const replay=v6.walkForwardReplay({actionLog:log,observations:[],settings:{}});
const run2Replay=replay.find(x=>x.runId===2&&x.level===10);

const pass=Math.abs(w1.work-w2.work)/w1.work<1e-9&&Math.abs(prior.mid-w1.work)/w1.work<1e-9&&run2Replay&&run2Replay.workPrior.count===1&&Math.abs(run2Replay.workRatio-1)<1e-9;
console.log(JSON.stringify({w1:w1.work,w2:w2.work,prior,run2Replay,pass}));
if(!pass)process.exit(1);
