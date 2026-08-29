importScripts('ascension-model.js'+self.location.search);

self.onmessage=function(event){
  const msg=event.data||{},id=msg.id;
  if(msg.type!=='optimize')return;
  try{
    const model=self.CrushAscensionOptimizer,goal=msg.goal||msg.input&&msg.input.goal||'ascension',modelRevision=model&&model.MODEL_REVISION;
    if(msg.modelRevision&&modelRevision!==msg.modelRevision){
      self.postMessage({type:'error',id,modelRevision,error:`Optimizer asset revision mismatch: page=${msg.modelRevision}, worker=${modelRevision||'unknown'}`});
      return;
    }
    if(goal==='ranking'){
      const result=model.optimizeRanking(msg.input||{},msg.measurements||[]);
      self.postMessage({type:'result',id,goal,result,modelRevision});
      const ingotPlan=model.optimizeRankingIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||24);
      self.postMessage({type:'ingot',id,goal,ingotPlan,modelRevision});
      return;
    }
    if(goal==='singularity'){
      const result=model.optimizeSingularity(msg.input||{},msg.measurements||[]);
      self.postMessage({type:'result',id,goal,result,modelRevision});
      return;
    }
    const result=model.optimizeAscension(msg.input||{},msg.measurements||[]);
    self.postMessage({type:'result',id,goal,result,modelRevision});
    const ingotPlan=model.optimizeIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||192);
    self.postMessage({type:'ingot',id,goal,ingotPlan,modelRevision});
  }catch(error){
    self.postMessage({type:'error',id,modelRevision:self.CrushAscensionOptimizer&&self.CrushAscensionOptimizer.MODEL_REVISION,error:String(error&&error.stack||error)});
  }
};
