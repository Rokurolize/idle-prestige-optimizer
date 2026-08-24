import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const v6=require('../v6-model.js');

const now=1_000_000;
const upgrades={
  speed:{name:'Speed',value:10,cost:300,step:5,stepDelta:0,growth:2,unlock:1,cap:null},
  power:{name:'Power',value:2,cost:1e12,step:2,stepDelta:0,growth:2,unlock:1,cap:null},
  reducer:{name:'Reducer',value:1,cost:1e12,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null},
  rare:{name:'Rare',value:0,cost:1e12,step:.5,stepDelta:0,growth:2,unlock:1,cap:null},
  gravity:{name:'Gravity',value:9.81,cost:1e12,step:.5,stepDelta:0,growth:2,unlock:1,cap:null},
  spikeCount:{name:'Spike Count',value:4,cost:1e12,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12},
  spikeSize:{name:'Spike Size',value:1,cost:1e12,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15},
  feed:{name:'Feed',value:1,cost:1e12,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4}
};
const permanent={prestigeCash:1,prestigeDmg:1,refining:1,crush:1,expEff:1,ingots:0};
const settings={reducerExponent:1.25,gravityExponent:.715};
const dps=v6.displayedDps({upgrades,permanent,settings,dpsCalibration:1});
const log=[];
let at=0;
for(let level=10;level<50;level++){
  const start=at;
  log.push({at:start,runId:1,type:'level_start',level,cash:0,dps,dpsCalibration:1,permanent,upgrades});
  at+=100_000;
  log.push({at,runId:1,type:'exp_full_level_up',level:level+1,cash:0,dps,dpsCalibration:1,permanent,upgrades,detail:{from:level,to:level+1,durationMs:100_000,exactTiming:true}});
}
const currentStart=now-99_000;
log.push({at:currentStart,runId:2,type:'level_start',level:10,cash:0,dps,dpsCalibration:1,permanent,upgrades});

const state={level:10,cash:0,dps,dpsCalibration:1,permanent,settings,upgrades,ingots:0};
const plan=v6.planShadow({now,runId:2,state,cash:0,cashRate:1,levelStartedAt:currentStart,actionLog:log,observations:[],decisionLatency:2,resetCycleSeconds:NaN,campaign:{prestigeCount:0,prestigeGoal:25,ingots:0,ingotGoal:250}});
const laterPurchase=(plan.decisions||[]).find((d,i)=>i>0&&d.type==='purchase');
const pass=plan.status==='ok'&&plan.firstDecision&&plan.firstDecision.type==='level-up'&&!plan.first&&laterPurchase&&laterPurchase.key==='speed';
console.log(JSON.stringify({firstDecision:plan.firstDecision,laterPurchase,targetLevel:plan.targetLevel,saved:plan.savedSeconds,pass}));
if(!pass)process.exit(1);
