import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const v6=require('../v6-model.js');

const text=`DPS 110.6K
Small ore value (with mult)
 Normal $175.77M
 Rare $1.76B
 Epic $3.52B
 Orichalcum $35.15B
EXP efficiency x1.16
Feed rate 2.4 /s
Feed rate (small) 11.49 /s
Ore HP
 Small 2.21M
 Medium 3.76M
 Large 6.39M
Crush rate 0.4 /s (last 10s)`;
const o=v6.makeObservedTelemetry(text,{feedUpgrade:4,dps:110600});
const pass=o.feedRate===2.4&&o.feedSmallRate===11.49&&o.crushRate===0.4&&Math.abs(o.oreHpSmall-2210000)<1&&Math.abs(o.oreValues.normal-175770000)<1&&Math.abs(o.oreValues.orichalcum-35150000000)<1;
console.log(JSON.stringify({o,pass}));
if(!pass)process.exit(1);
