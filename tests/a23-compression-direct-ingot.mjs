import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),M=require('../ascension-model.js');

// Historical A23 debug-panel state. In r82 this observed destruction rate calibrates
// the current physical state; it must not become a hard ceiling on upgraded candidates.
const input={
  goal:'singularity',ascensionCount:23,totalCore:M.totalCoreForAscension(23),
  heldIngots:2.14e18,totalIngotsEarned:M.prestigeTotalIngotsEarnedFromMultiplier(52.63e6),prestigeCount:0,
  currentCoreLevels:[31,36,33,9,20],currentSlowdownLevel:17,compressionEnabled:true,compressionDestroyRate:71.6,
  discardedAscensions:52,maxLevelEver:9485,compressionLockedLevel:9485,normalAutoUnlocked:true,bombUnlocked:false,dangerEnabled:false,
  instancePlayerCount:1,incomeBoostActive:false,expBoostActive:false,ingotLevels:[55,57,55,55,10,48,17,49],
  nextRequirement:M.nextAscensionRequirement(23),dpsCalibration:1,damageBoostMultiplier:1,hpCalibration:1,
  manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5
};

const currentSlowdown=M.SLOWDOWN[input.currentSlowdownLevel],probe=M.compressionFarmSnapshot({...input,requiredIngots:input.nextRequirement,coreLevels:input.currentCoreLevels,ingotLevels:input.ingotLevels,normalFeed:4,slowdown:currentSlowdown,directFlowCalibration:1}),modeledCurrentDestroy=probe.terminalEvents*probe.ordinaryFraction*probe.damageRatio,expectedCalibration=Math.max(.05,Math.min(20,input.compressionDestroyRate/modeledCurrentDestroy));
const policy=M.optimizeClosedLoopAscensionPolicy(input,M.DEFAULT_MEASUREMENTS);
assert.ok(policy&&policy.gate);
assert.equal(policy.flowCalibrationSource,'current-crush-rate');
assert.ok(Math.abs(policy.directFlowCalibration-expectedCalibration)<1e-12,'debug-panel rate should calibrate the current state by ratio');
const deepRun=policy.gate.runs.find(x=>x.role==='harvest')||policy.gate.runs.at(-1),candidate=M.compressionFarmSnapshot({...input,requiredIngots:input.nextRequirement,totalCore:input.totalCore,coreLevels:deepRun.core,ingotLevels:policy.gate.ingotLevels,normalFeed:4,slowdown:deepRun.slowdown,directFlowCalibration:policy.directFlowCalibration}),uncalibratedCandidate=M.compressionFarmSnapshot({...input,requiredIngots:input.nextRequirement,totalCore:input.totalCore,coreLevels:deepRun.core,ingotLevels:policy.gate.ingotLevels,normalFeed:4,slowdown:deepRun.slowdown,directFlowCalibration:1});
assert.ok(candidate.terminalEvents>input.compressionDestroyRate,'an upgraded candidate may physically exceed the observed current-state destroy rate');
assert.equal(candidate.terminalEvents,M.THEORETICAL_TERMINAL_SALES_RATE,'candidate reaches the r82 terminal supply ceiling instead of being clamped to 71.6/s');
assert.ok(candidate.rate>0&&Number.isFinite(policy.totalSeconds));

const uncalibrated=M.optimizeClosedLoopAscensionPolicy({...input,compressionDestroyRate:0},M.DEFAULT_MEASUREMENTS);
assert.equal(uncalibrated.flowCalibrationSource,'r82-physical');
assert.equal(uncalibrated.directFlowCalibration,1);
assert.equal(uncalibratedCandidate.terminalEvents,candidate.terminalEvents,'calibration scales reward flow, not candidate physical supply');
assert.ok(uncalibratedCandidate.rate>candidate.rate,'the lower observed current-state ratio should carry to candidates without capping them');

console.log(JSON.stringify({observedDestroyRate:input.compressionDestroyRate,modeledCurrentDestroy,directFlowCalibration:policy.directFlowCalibration,candidateTerminalEvents:candidate.terminalEvents,candidateSlowdownLevel:deepRun.slowdownLevel,candidateCore:deepRun.core,totalSeconds:policy.totalSeconds},null,2));
