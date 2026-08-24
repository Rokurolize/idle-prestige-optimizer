#!/usr/bin/env node
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const v6=require('../v6-model.js');

const path=process.argv[2];
if(!path){
  console.error('usage: node tools/replay-v6.mjs <optimizer-action-log.json>');
  process.exit(2);
}
const payload=JSON.parse(fs.readFileSync(path,'utf8'));
const rows=v6.walkForwardReplay({
  actionLog:payload.actionLog||[],
  observations:payload.v6&&payload.v6.observations||[],
  settings:payload.settings||{reducerExponent:1.25,gravityExponent:.715}
});
const metrics=v6.replayMetrics(rows);
const worst=[...rows].sort((a,b)=>b.absLogError-a.absLogError).slice(0,12).map(r=>({runId:r.runId,level:r.level,observedSeconds:r.observedSeconds,predictedWork:r.predictedWork,realizedWork:r.realizedWork,ratio:r.workRatio,source:r.source,samples:r.workPrior.count}));
console.log(JSON.stringify({model:v6.VERSION,metrics,worst},null,2));
