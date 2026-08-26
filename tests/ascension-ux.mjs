import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const M=require('../ascension-model.js');

// VRCW CrushFactory.LogNumberUtil.Format / FormatPlain.
assert.equal(M.formatNumber(0),'0');
assert.equal(M.formatNumber(999.99),'999.99');
assert.equal(M.formatNumber(1000),'1K');
assert.equal(M.formatNumber(1.23e6),'1.23M');
assert.equal(M.formatNumber(1e12),'1T');
assert.equal(M.formatNumber(1e15),'1.00e15');
assert.equal(M.formatNumber(3e20),'3.00e20');
assert.equal(M.parseNumber('1.23K'),1230);
assert.equal(M.parseNumber('1T'),1e12);
assert.equal(M.parseNumber('3.00e20'),3e20);

// Auto-locked Ascensions should have an immediate low-cognitive-load action,
// not require the full planner before the player can do anything useful.
const quick=M.quickStartAdvice({ascensionCount:22,totalCore:M.totalCoreForAscension(22),heldIngots:0,normalAutoUnlocked:false});
assert.equal(quick.coreIngotLevel,9);
assert.equal(quick.targetLevel,50);
assert.equal(quick.gainAtLevel50,512);
assert.equal(quick.runs,1);
assert.equal(M.quickStartAdvice({ascensionCount:22,totalCore:M.totalCoreForAscension(22),heldIngots:300,normalAutoUnlocked:false}).ready,true);

// Rare Value may not be recommended before Stall Recovery is MAX. This is a
// strategic prerequisite because VRCW index 6 directly shortens the crusher's
// gem-stall hold/ramp and is the only Ingot upgrade with a real MAX condition.
const levels=[0,26,0,20,0,0,0,0],held=5e8;
const input={ascensionCount:7,totalCore:2186,heldIngots:held,totalIngotsEarned:M.inferTotalIngotsEarned(held,levels,true),prestigeCount:3,normalAutoUnlocked:true,ingotLevels:levels,maxTargetLevel:1400,oneShotMargin:1,strictOneShot:true,dpsCalibration:1,hpCalibration:1,normalAutoUpdatesPerSecond:36.5};
const result=M.optimizeAscension(input,M.DEFAULT_MEASUREMENTS);
const roadmap=M.optimizeIngotUpgrades(input,result,M.DEFAULT_MEASUREMENTS,3);
const rareStep=roadmap.steps.findIndex(s=>s.index===5);
const stallStep=roadmap.steps.findIndex(s=>s.index===6&&s.level===17);
assert.ok(rareStep>=0,'fixture should recommend Rare Value');
assert.ok(stallStep>=0&&stallStep<rareStep,'Stall Recovery MAX must precede Rare Value');
assert.equal(roadmap.targetLevels[6],17);
assert.equal(M.ingotEffect(6,17),.01,'VRCW Crusher clamps MAX stall duration to 1%');
assert.equal(roadmap.steps[stallStep].strategicPrerequisite,true);

console.log(JSON.stringify({format:M.formatNumber(3e20),quickStart:quick,roadmapSteps:roadmap.steps.map(s=>({name:s.name,from:s.fromLevel,to:s.level,strategic:!!s.strategicPrerequisite}))},null,2));
