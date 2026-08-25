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
    const result=model.optimizeAscension(msg.input||{},msg.measurements||[]);
    self.postMessage({type:'result',id,goal,result});
    const ingotPlan=model.optimizeIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||64);
    let futureResult=null;
    if(ingotPlan&&ingotPlan.targetLevels&&result&&result.plan){
      const afterBootstrap=ingotPlan.postBootstrapState||msg.input||{};
      const futureInput={...afterBootstrap,normalAutoUnlocked:true,ingotLevels:ingotPlan.targetLevels.slice(),heldIngots:0};
      futureResult=model.optimizeAscension(futureInput,msg.measurements||[]);
    }
    self.postMessage({type:'ingot',id,goal,ingotPlan,futureResult});
  }catch(error){
    self.postMessage({type:'error',id,error:String(error&&error.stack||error)});
  }
};
