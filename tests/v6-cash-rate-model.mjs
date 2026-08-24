import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const v6=require('../v6-model.js');

const upgrades={speed:10,power:2,reducer:1,gravity:9.81,spikeCount:4,spikeSize:1,feed:1,rare:0};
const permanent={prestigeCash:1,prestigeDmg:1,refining:1,crush:1,expEff:1,ingots:0};
const row=(at,runId,level,rate)=>({at,runId,type:'income_sync',level,cash:0,dps:1,dpsCalibration:1,permanent,upgrades,detail:{before:0,after:rate}});
const log=[row(1000,1,11,100),row(2000,1,11,120),row(3000,2,11,200)];
const model=v6.buildCashRateModel(log,3,{});
const target={level:11,dps:1,dpsCalibration:1,permanent,upgrades,settings:{}};
const f=model.forecast(11,target);
const pass=f.count===3&&f.rate===120&&f.source==='same-level cash history';
console.log(JSON.stringify({forecast:f,pass}));
if(!pass)process.exit(1);
