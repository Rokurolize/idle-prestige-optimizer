importScripts('ascension-model.js');

self.onmessage=function(event){
  const msg=event.data||{},id=msg.id;
  if(msg.type!=='optimize')return;
  try{
    const model=self.CrushAscensionOptimizer;
    const result=model.optimizeAscension(msg.input||{},msg.measurements||[]);
    const ingotPlan=model.optimizeIngotUpgrades(msg.input||{},result,msg.measurements||[],Number(msg.maxIngotSteps)||64);
    let futureResult=null;
    if(ingotPlan&&ingotPlan.targetLevels&&result&&result.plan){
      const futureInput={...(msg.input||{}),ingotLevels:ingotPlan.targetLevels.slice(),heldIngots:0};
      futureResult=model.optimizeAscension(futureInput,msg.measurements||[]);
    }
    self.postMessage({type:'result',id,result,ingotPlan,futureResult});
  }catch(error){
    self.postMessage({type:'error',id,error:String(error&&error.stack||error)});
  }
};
