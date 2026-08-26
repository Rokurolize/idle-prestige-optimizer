#!/usr/bin/env node
import os from 'node:os';
import fs from 'node:fs';
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

function arg(name,fallback){const i=process.argv.indexOf(`--${name}`);return i>=0&&process.argv[i+1]!==undefined?process.argv[i+1]:fallback}
function freshInput(a){return {objective:'ascensionEta',ascensionCount:a,totalCore:M.totalCoreForAscension(a),heldIngots:0,totalIngotsEarned:0,prestigeCount:0,normalAutoUnlocked:false,ingotLevels:Array(8).fill(0),maxTargetLevel:M.ascensionSearchMaxLevel(a,Array(8).fill(0)),oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,manualClickRate:4}}
function secondsText(v){if(!Number.isFinite(v))return '∞';if(v<60)return `${v.toFixed(1)}s`;if(v<3600)return `${(v/60).toFixed(1)}m`;if(v<86400)return `${(v/3600).toFixed(2)}h`;return `${(v/86400).toFixed(2)}d`}

function optimizeStage(spec){
  let input={...spec.input,ingotLevels:spec.input.ingotLevels.slice()},searchMax=Math.max(100,Math.floor(input.maxTargetLevel||M.ascensionSearchMaxLevel(input.ascensionCount,input.ingotLevels))),ascension,roadmap;
  for(let attempt=0;attempt<6;attempt++){
    input={...input,maxTargetLevel:searchMax};
    ascension=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
    if(!ascension.plan)throw new Error(`A${input.ascensionCount}: no Ascension plan at search max ${searchMax}`);
    roadmap=M.optimizeIngotUpgrades(input,ascension,M.DEFAULT_MEASUREMENTS,spec.maxIngotSteps);
    // A chain forecast is more sensitive to a clipped AP search than the
    // interactive page, so require a 100-level safety margin before accepting
    // a stage as interior to the search range.
    const edge=Math.max(ascension.plan.targetLevel||0,roadmap.finalTargetLevel||0)>=searchMax-100;
    if(!edge||searchMax>=10000)break;
    searchMax=Math.min(10000,searchMax+1000);
  }
  const completion=M.completeAscensionState(input,ascension,roadmap);
  if(!completion.completed)throw new Error(`A${input.ascensionCount}: modeled roadmap did not satisfy Ascension requirements`);
  const target=M.optimizeTargetLevel(completion.finalState,spec.targetLevel,M.DEFAULT_MEASUREMENTS);
  if(!target.plan)throw new Error(`A${input.ascensionCount}: no Lv${spec.targetLevel} target plan`);
  return {ascensionCount:input.ascensionCount,totalCore:input.totalCore,nextRequirement:ascension.nextRequirement,searchMaxLevel:searchMax,stageEta:completion.eta,ingotLevels:completion.finalState.ingotLevels,totalIngotsEarned:completion.finalState.totalIngotsEarned,heldIngots:completion.finalState.heldIngots,prestigeCount:completion.finalState.prestigeCount,roadmapSteps:roadmap.steps.length,roadmapPhases:roadmap.phases.length,roadmapStopReason:roadmap.stopReason,ascensionPlan:{core:roadmap.finalPlan.core,slowdown:roadmap.finalPlan.slowdown,targetLevel:roadmap.finalPlan.targetLevel,actualPrestigeLevel:roadmap.finalPlan.actualPrestigeLevel,prestigeSchedule:roadmap.finalPrestigeSchedule},targetPlan:target.plan};
}

if(!isMainThread){
  try{parentPort.postMessage({ok:true,row:optimizeStage(workerData)})}catch(error){parentPort.postMessage({ok:false,error:error.stack||String(error)})}
}else{
  let from=Number(arg('from',18)),to=Number(arg('to',34)),targetLevel=Number(arg('target',10000)),maxIngotSteps=Number(arg('max-ingot-steps',192)),concurrency=Math.max(1,Math.min(Number(arg('concurrency',Math.min(4,os.availableParallelism()))),os.availableParallelism())),diagnostic=arg('diagnostic',''),format=arg('format','table');
  let firstInput=null;
  if(diagnostic){const payload=JSON.parse(fs.readFileSync(diagnostic,'utf8'));firstInput=payload.optimizerInput||payload.input||payload;from=Math.floor(Number(firstInput.ascensionCount));}
  from=Math.max(0,Math.floor(from));to=Math.max(from,Math.floor(to));targetLevel=Math.max(1,Math.floor(targetLevel));maxIngotSteps=Math.max(1,Math.floor(maxIngotSteps));
  const specs=[];
  for(let a=from;a<=to;a++)specs.push({input:a===from&&firstInput?{...freshInput(a),...firstInput,objective:'ascensionEta',ascensionCount:a,totalCore:Number(firstInput.totalCore)||M.totalCoreForAscension(a),ingotLevels:(firstInput.ingotLevels||Array(8).fill(0)).slice()}:freshInput(a),targetLevel,maxIngotSteps});
  const rows=new Array(specs.length);let next=0,running=0,rejectRun;
  await new Promise((resolve,reject)=>{rejectRun=reject;const launch=()=>{while(running<concurrency&&next<specs.length){const index=next++,worker=new Worker(new URL(import.meta.url),{workerData:specs[index]});running++;worker.on('message',message=>{running--;if(!message.ok){reject(new Error(message.error));return}rows[index]=message.row;if(next>=specs.length&&running===0)resolve();else launch()});worker.on('error',reject)}};launch()});
  let cumulative=0;for(const row of rows){cumulative+=row.stageEta;row.cumulativeToMature=cumulative;row.totalToTarget=cumulative+row.targetPlan.seconds}
  if(format==='json'){console.log(JSON.stringify({from,to,targetLevel,maxIngotSteps,rows},null,2));process.exit(0)}
  console.log(`A${from}..A${to} / target Lv${targetLevel} / Ingot search ${maxIngotSteps} steps / concurrency ${concurrency}`);
  console.log('A\tAsc ETA\tCumulative\tLv10000\tTotal→10000\tIngot targets\tDeep Core\tSlowdown\tTiming');
  for(const row of rows)console.log([row.ascensionCount,secondsText(row.stageEta),secondsText(row.cumulativeToMature),secondsText(row.targetPlan.seconds),secondsText(row.totalToTarget),`[${row.ingotLevels.join(',')}]`,`[${row.targetPlan.core.join(',')}]`,`×${M.formatNumber(row.targetPlan.slowdown)}`,row.targetPlan.timingValidated?'measured':'extrapolated'].join('\t'));
  for(const threshold of [600,3600,7200]){const hit=rows.find(r=>r.targetPlan.seconds<=threshold);console.log(`${secondsText(threshold)} threshold: ${hit?`A${hit.ascensionCount} (${secondsText(hit.targetPlan.seconds)}, total ${secondsText(hit.totalToTarget)})`:'not reached'}`)}
}
