importScripts('ascension-model.js');

self.onmessage=function(event){
  const msg=event.data||{},id=msg.id;
  if(msg.type!=='optimize')return;
  try{
    const model=self.CrushAscensionOptimizer,goal=msg.goal||msg.input&&msg.input.goal||'ascension';
    if(goal==='ranking'){
      const result=model.optimizeRanking(msg.input||{},msg.measurements||[]);
      self.postMessage({type:'result',id,goal,result});
      const ingotPlan=model.optimizeRankingIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||24);
      self.postMessage({type:'ingot',id,goal,ingotPlan});
      return;
    }
    if(goal==='singularity'){
      const result=model.optimizeSingularity(msg.input||{},msg.measurements||[]);
      self.postMessage({type:'result',id,goal,result});
      return;
    }
    const result=model.optimizeAscension(msg.input||{},msg.measurements||[]);
    self.postMessage({type:'result',id,goal,result});
    const ingotPlan=model.optimizeIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||192);
    self.postMessage({type:'ingot',id,goal,ingotPlan});
  }catch(error){
    self.postMessage({type:'error',id,error:String(error&&error.stack||error)});
  }
};
