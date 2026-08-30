importScripts('ascension-model.js'+self.location.search);

const model=self.CrushAscensionOptimizer;

function bestPlan(rows,key){
  let best=null,bestRow=null;
  for(const row of rows){const plan=row.result&&row.result[key];if(!plan)continue;if(!best||plan.totalEta<best.totalEta-1e-9||(Math.abs(plan.totalEta-best.totalEta)<1e-9&&plan.interactionClicks<best.interactionClicks)){best=plan;bestRow=row}}
  return {plan:best,row:bestRow};
}

function mergeAscensionShards(rows){
  const fixed=bestPlan(rows.filter(x=>x.kind==='fixed'),'fixedPlan'),manual=bestPlan(rows.filter(x=>x.kind==='manual'),'manualPlan'),fixedPlan=fixed.plan,manualPlan=manual.plan,recommendedMode=manualPlan&&(!fixedPlan||manualPlan.totalEta<fixedPlan.totalEta-1e-9)?'manual':'fixed',selected=recommendedMode==='manual'?manualPlan:fixedPlan,source=recommendedMode==='manual'?manual.row:fixed.row;
  const sourceResult=source&&source.result||{},alternatives=[];
  for(const row of rows){const r=row.result;if(!r)continue;const primary=row.kind==='fixed'?r.fixedPlan:r.manualPlan;if(primary&&primary!==selected)alternatives.push(primary);for(const alt of r.nearAlternatives||[])alternatives.push(alt)}
  const seen=new Set(),nearAlternatives=selected?alternatives.filter(x=>x&&x.totalEta<=selected.totalEta*1.005+1e-9).filter(x=>{const k=(x.core||[]).join(',')+'|'+(x.prestigeCore||[]).join(',')+'|'+x.slowdown;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>a.totalEta-b.totalEta||a.interactionClicks-b.interactionClicks).slice(0,8):[];
  return {result:{...sourceResult,plan:selected,fixedPlan,manualPlan,recommendedMode,nearAlternatives,parallelSearch:true,parallelShardCount:rows.length},source};
}

function childTask(kind,input,measurements,id,extra){
  return new Promise((resolve,reject)=>{
    const worker=new Worker(self.location.href),timer=setTimeout(()=>{worker.terminate();reject(new Error('Ascension shard timed out'))},120000);
    worker.onmessage=e=>{const m=e.data||{};if(m.id!==id)return;if(m.type==='error'){clearTimeout(timer);worker.terminate();reject(new Error(m.error));return}if(m.type==='shard-result'){clearTimeout(timer);resolve({kind,worker,result:m.result,extra});}};
    worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(new Error(e.message||'Ascension shard worker error'))};
    worker.postMessage({type:'optimize-shard',id,modelRevision:model.MODEL_REVISION,input,measurements});
  });
}

function roadmapTask(row,input,measurements,result,maxIngotSteps,id){
  return new Promise((resolve,reject)=>{
    const worker=row.worker,timer=setTimeout(()=>reject(new Error('Ingot roadmap shard timed out')),120000);
    worker.onmessage=e=>{const m=e.data||{};if(m.id!==id)return;if(m.type==='error'){clearTimeout(timer);reject(new Error(m.error));return}if(m.type==='roadmap-result'){clearTimeout(timer);resolve(m.ingotPlan)}};
    worker.postMessage({type:'roadmap-shard',id,modelRevision:model.MODEL_REVISION,input,measurements,result,maxIngotSteps});
  });
}

function roadmapFinalInput(input,roadmap){
  const post=roadmap&&roadmap.postBootstrapState||input||{};
  return {...post,objective:'ascensionEta',normalAutoUnlocked:true,heldIngots:Number(roadmap&&roadmap.finalHeld)||0,totalIngotsEarned:Number(roadmap&&roadmap.finalTotalIngotsEarned)||0,prestigeCount:Math.max(0,Math.floor(Number(roadmap&&roadmap.finalPrestigeCount)||0)),currentCoreLevels:Array.isArray(roadmap&&roadmap.finalCurrentCoreLevels)?roadmap.finalCurrentCoreLevels.slice():post.currentCoreLevels,currentSlowdownLevel:roadmap&&roadmap.finalCurrentSlowdownLevel,ingotLevels:Array.isArray(roadmap&&roadmap.targetLevels)?roadmap.targetLevels.slice():(post.ingotLevels||[]).slice(),nextRequirement:Number.isFinite(Number(post.nextRequirement))?Number(post.nextRequirement):model.nextAscensionRequirement(post.ascensionCount)};
}

async function parallelAscension(msg){
  const rawInput={...(msg.input||{})},input={...rawInput,nextRequirement:Number.isFinite(Number(rawInput.nextRequirement))?Number(rawInput.nextRequirement):model.nextAscensionRequirement(rawInput.ascensionCount)},measurements=msg.measurements||[],id=msg.id,totalCore=Math.max(0,Number(input.totalCore)||model.totalCoreForAscension(input.ascensionCount));
  // Fixed-Core is latency critical. The default exact search has at most three
  // independent Core-Ingot bands, so evaluate those bands concurrently when there
  // is more than one. This preserves the same candidate set as optimizeAscension;
  // it changes wall-clock latency only, not the winner or pruning semantics.
  const fixedLevels=model.fixedCoreIngotSearchLevels(input,totalCore);let fixedOnly,fixedRows=[];
  if(fixedLevels.length>1&&fixedLevels.length<=4&&!input.exhaustiveCoreIngotSearch&&!input.fixedCoreCandidates&&!input.fixedCoreCandidate){
    fixedRows=await Promise.all(fixedLevels.map(level=>childTask('fixed',{...input,skipManual:true,fixedCoreIngotLevels:[level],disableCoreIngotBandPruning:true,disableParallel:true},measurements,id,{level})));
    fixedOnly=mergeAscensionShards(fixedRows).result;
    for(const row of fixedRows)row.worker.terminate();
  }else fixedOnly=model.optimizeAscension({...input,skipManual:true,disableParallel:true},measurements);
  const fixedRow={kind:'fixed',result:fixedOnly},fixedPending={...fixedOnly,manualPending:true,manualPrunedByLowerBound:false,manualLowerBound:null};
  // The complete fixed-Core result is useful immediately. Do not make the user wait
  // for the independent manual-Core lower-bound proof before painting it; that proof
  // can update the strategy verdict in a later message.
  self.postMessage({type:'result',id,goal:'ascension',result:fixedPending,modelRevision:model.MODEL_REVISION,partial:true});
  const manualBound=model.manualCoreEtaLowerBound(input,measurements,fixedOnly.calibration,input.ingotLevels||[],totalCore,fixedOnly.fixedPlan&&fixedOnly.fixedPlan.totalEta),manualPruned=!!(fixedOnly.fixedPlan&&manualBound.eta>=fixedOnly.fixedPlan.totalEta-1e-9),fixedResult={...fixedOnly,manualPending:!manualPruned,manualPrunedByLowerBound:manualPruned,manualLowerBound:manualBound};
  if(manualPruned)self.postMessage({type:'manual',id,goal:'ascension',result:fixedResult,modelRevision:model.MODEL_REVISION});

  // The fixed-Core purchase roadmap is the next latency-critical answer. Compute it
  // before spawning the manual-Core shard fan-out so those background workers cannot
  // steal CPU from the user's purchase recommendation.
  let fixedRoadmap=null;
  try{fixedRoadmap=model.optimizeIngotUpgrades({...input,skipManual:true},fixedResult,measurements,Number(msg.maxIngotSteps)||192);self.postMessage({type:'ingot',id,goal:'ascension',ingotPlan:fixedRoadmap,modelRevision:model.MODEL_REVISION,partial:true})}catch(error){/* fixed recommendation remains usable */}

  const manualFrontier=manualPruned?[]:model.paretoCoreCandidates(totalCore,0),manualTasks=[];
  for(let index=0;index<manualFrontier.length;index++)manualTasks.push(childTask('manual',{...input,skipFixed:true,manualCoreShard:{index},disableParallel:true},measurements,id,{index}));
  const manualPromise=manualPruned?Promise.resolve(fixedResult):Promise.all(manualTasks).then(async manualRows=>{
    const merged=mergeAscensionShards([fixedRow,...manualRows]),fullResult={...merged.result,manualPending:false};
    self.postMessage({type:'manual',id,goal:'ascension',result:fullResult,modelRevision:model.MODEL_REVISION});
    if(merged.result.recommendedMode==='manual'&&merged.source){
      try{const ingotPlan=await roadmapTask(merged.source,input,measurements,fullResult,Number(msg.maxIngotSteps)||192,id);self.postMessage({type:'ingot',id,goal:'ascension',ingotPlan,modelRevision:model.MODEL_REVISION})}catch(error){/* fixed roadmap remains usable */}
    }
    for(const row of manualRows)row.worker.terminate();
    return fullResult;
  });
  await Promise.allSettled([manualPromise]);
  if(fixedRoadmap&&fixedRoadmap.finalStrategyPending){
    try{
      const finalResult=model.optimizeAscension(roadmapFinalInput(input,fixedRoadmap),measurements);
      self.postMessage({type:'roadmap-strategy',id,goal:'ascension',result:finalResult,modelRevision:model.MODEL_REVISION});
    }catch(error){/* the fast fixed roadmap remains usable */}
  }
}

self.onmessage=async function(event){
  const msg=event.data||{},id=msg.id;
  try{
    const goal=msg.goal||msg.input&&msg.input.goal||'ascension',modelRevision=model&&model.MODEL_REVISION;
    if(msg.modelRevision&&modelRevision!==msg.modelRevision){self.postMessage({type:'error',id,modelRevision,error:`Optimizer asset revision mismatch: page=${msg.modelRevision}, worker=${modelRevision||'unknown'}`});return}
    if(msg.type==='optimize-shard'){
      const result=model.optimizeAscension(msg.input||{},msg.measurements||[]);self.postMessage({type:'shard-result',id,result,modelRevision});return;
    }
    if(msg.type==='roadmap-shard'){
      const ingotPlan=model.optimizeIngotUpgrades(msg.input||{},msg.result||{},msg.measurements||[],Number(msg.maxIngotSteps)||192);self.postMessage({type:'roadmap-result',id,ingotPlan,modelRevision});return;
    }
    if(msg.type!=='optimize')return;
    if(goal==='ranking'){
      const result=model.optimizeRanking(msg.input||{},msg.measurements||[]);self.postMessage({type:'result',id,goal,result,modelRevision});const ingotPlan=model.optimizeRankingIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||24);self.postMessage({type:'ingot',id,goal,ingotPlan,modelRevision});return;
    }
    if(goal==='singularity'){
      const result=model.optimizeSingularity(msg.input||{},msg.measurements||[]);self.postMessage({type:'result',id,goal,result,modelRevision});return;
    }
    if(msg.input&&msg.input.disableParallel){
      const result=model.optimizeAscension(msg.input||{},msg.measurements||[]);self.postMessage({type:'result',id,goal,result,modelRevision});const ingotPlan=model.optimizeIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||192);self.postMessage({type:'ingot',id,goal,ingotPlan,modelRevision});return;
    }
    await parallelAscension(msg);
  }catch(error){self.postMessage({type:'error',id,modelRevision:model&&model.MODEL_REVISION,error:String(error&&error.stack||error)});}
};
