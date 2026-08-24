import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const v6=require('../v6-model.js');

const state={level:20,dpsCalibration:1,prestigeCash:1,prestigeDmg:1,refining:1,crush:1,expEff:1,settings:{reducerExponent:1.25,gravityExponent:.715},upgrades:{
  speed:{name:'Speed',value:10,cost:100,step:1,stepDelta:0,growth:2,unlock:1,cap:null},
  power:{name:'Power',value:2,cost:1e9,step:2,stepDelta:0,growth:2,unlock:1,cap:null},
  reducer:{name:'Reducer',value:1,cost:1e9,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null},
  rare:{name:'Rare',value:0,cost:1e9,step:.5,stepDelta:0,growth:2,unlock:1,cap:null},
  gravity:{name:'Gravity',value:9.81,cost:1e9,step:.5,stepDelta:0,growth:2,unlock:1,cap:null},
  spikeCount:{name:'Spike Count',value:4,cost:1e9,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12},
  spikeSize:{name:'Spike Size',value:1,cost:1e9,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15},
  feed:{name:'Feed',value:1,cost:1e9,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4}
}};
state.dps=v6.displayedDps(state);
const plan=v6.afkPlan({state,runId:1,cash:1000,cashRate:10,afkSeconds:3600,actionLog:[],observations:[]});
const pass=plan.status==='ok'&&plan.actions.length>0&&plan.actions[0].key==='speed'&&plan.terminalCash>plan.noPurchaseCash;
console.log(JSON.stringify({plan,pass}));
if(!pass)process.exit(1);
