(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CrushAscensionOptimizer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // CRUSH FACTORY IDLE v1.0.4 / VRCW asset 71.
  // Deterministic constants are copied from the serialized GameBalanceConfig.
  const TERMINAL_ORES_PER_TOP=4.78640776699;
  const BASE_GAME_DPS=0.73245; // existing site's displayed-DPS normalization; user calibration remains available.
  const AUTO_PRESTIGE_INTERVAL=1;

  const NORMAL={
    baseCost:[50,14,75000,50000,3000,1200,1500,400],
    costRate:[1.2,1.73,1.58,2,2,1.45,1.25,1.4],
    base:[10,2,1,0,9.81,4,1,1],
    per:[1,2,.05,.5,.5,1,.015,.1],
    quad:[0,.1,0,0,0,0,0,0],
    unlock:[1,1,11,1,1,5,8,3],
    max:[Infinity,Infinity,Infinity,200,30,8,10,30]
  };
  const INGOT={
    names:['精錬収益','経験値効率','破砕力増強','供給増強','ジェム確率','レア鉱石価値','ストール復帰','オリハルコン率'],
    baseCost:[1,1,1,1,10,50,1,50],
    per:[.1,.1,.1,.1,.1,.1,.06,1],
    quad:[4.6,.6,4.6,.05596620908130939,0,0,0,0],
    optimizerCap:[64,64,64,64,10,64,17,100]
  };
  const CORE_NAMES=['収入倍率','インゴット倍率','破壊力倍率','コスト減','供給加速'];
  const CORE_FEED_NEXT_COST=[2,8,16,64,128,1080,2160,8000,20000,40000,200000,500000,1000000,5000000,8000000,60000000,100000000,200000000,1000000000,1500000000,10000000000,25000000000,50000000000,250000000000,300000000000,3000000000000,5000000000000,30000000000000,60000000000000,120000000000000,600000000000000,1000000000000000,6000000000000000,10000000000000000,20000000000000000,150000000000000000,300000000000000000,1500000000000000000,2500000000000000000,15000000000000000000,30000000000000000000,60000000000000000000,300000000000000000000,500000000000000000000,4000000000000000000000,6000000000000000000000];
  const CORE_FEED_CUM=[0];
  for(const c of CORE_FEED_NEXT_COST)CORE_FEED_CUM.push(CORE_FEED_CUM[CORE_FEED_CUM.length-1]+c);
  const SPECIAL_PREFIX=[1,2,4,6,10,100,1000,2000,10000];
  const SLOWDOWN=[...SPECIAL_PREFIX];
  for(let p=5;p<=45;p++)SLOWDOWN.push(Math.pow(10,p));
  const CORE_FEED=SLOWDOWN.slice();
  const ASCENSION_INGOT_REQ=[250,50000,500000,5000000,50000000,250000000,2500000000,10000000000,50000000000,350000000000,800000000000,6000000000000,20000000000000,80000000000000,400000000000000,2000000000000000,5000000000000000,7000000000000000,30000000000000000,90000000000000000,500000000000000000,2000000000000000000,5000000000000000000,20000000000000000000,70000000000000000000,300000000000000000000,900000000000000000000,4000000000000000000000,20000000000000000000000,5e22,3e23,8e23,3e24,9e24,4e25];

  const DEFAULT_INGOT_LEVELS=[24,29,24,29,10,23,17,23];
  const DEFAULT_CORE=[6,9,7,5,6];
  const DEFAULT_MEASUREMENTS=[
    {targetLevel:460,seconds:38,slowdown:2000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×2K Lv460'},
    {targetLevel:695,seconds:51.21,slowdown:2000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×2K Lv695'},
    {targetLevel:995,seconds:73,slowdown:2000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×2K Lv995'},
    {targetLevel:460,seconds:59.4,slowdown:10000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×10K Lv460'}
  ];

  function finite(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function pow10(log){if(log>300)return 1e300;if(log<-300)return 0;return Math.pow(10,log)}
  function totalCoreForAscension(a){a=Math.max(0,Math.floor(finite(a)));return Math.pow(3,a)-1}
  function nextAscensionRequirement(a){a=Math.max(0,Math.floor(finite(a)));if(a<ASCENSION_INGOT_REQ.length)return ASCENSION_INGOT_REQ[a];const over=a-(ASCENSION_INGOT_REQ.length-1);return ASCENSION_INGOT_REQ[ASCENSION_INGOT_REQ.length-1]*Math.pow(3.55,over)}

  function coreCost(index,level){
    level=Math.max(0,Math.floor(finite(level)));
    if(level===0)return 0;
    if(index===0||index===1||index===3)return Math.pow(2,level)-1;
    if(index===2)return 2*(Math.pow(2,level)-1);
    if(index===4)return level<CORE_FEED_CUM.length?CORE_FEED_CUM[level]:Infinity;
    return Infinity;
  }
  function maxCoreLevel(index,budget){
    budget=Math.max(0,finite(budget));let lo=0,hi=index===4?CORE_FEED_CUM.length-1:52;
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(coreCost(index,mid)<=budget)lo=mid;else hi=mid-1}return lo;
  }
  function coreEffect(index,level){
    level=Math.max(0,Math.floor(finite(level)));
    if(index===0||index===1)return Math.pow(2,level);
    if(index===2)return 1+level;
    if(index===3)return Math.max(.1,1-.1*level);
    if(index===4)return CORE_FEED[Math.min(level,CORE_FEED.length-1)]||CORE_FEED[CORE_FEED.length-1];
    return 1;
  }
  function coreBundleCost(levels){return levels.reduce((s,l,i)=>s+coreCost(i,l),0)}

  function ingotEffect(index,level){
    level=Math.max(0,Math.floor(finite(level)));
    const per=INGOT.per[index],q=INGOT.quad[index],v=per*level+per*q*level*level;
    if(index<=3||index===5)return 1+v;
    if(index===4)return Math.min(1,.1*level); // displayed percentage points; scene cap is 1.0%.
    if(index===6)return Math.max(0,1-v);
    if(index===7)return Math.min(100,level); // percentage points.
    return 1;
  }
  function ingotNextCost(index,level){return Math.ceil(INGOT.baseCost[index]*Math.pow(2,Math.max(0,Math.floor(finite(level)))))}
  function ingotCumulativeCost(index,level){level=Math.max(0,Math.floor(finite(level)));return INGOT.baseCost[index]*(Math.pow(2,level)-1)}
  function ingotBundleCost(levels){return levels.reduce((s,l,i)=>s+ingotCumulativeCost(i,l),0)}
  function normalEffect(index,level){level=Math.max(0,Math.floor(finite(level)));return NORMAL.base[index]+NORMAL.per[index]*level+NORMAL.per[index]*NORMAL.quad[index]*level*level}
  function requiredExp(level){let r=8*Math.pow(1.36,level);if(level<10)r/=5-.4*level;return r}
  function prestigeBase(level){if(level<50)return 0;return level-49+(level>100?.6*Math.pow(level-100,2):0)}
  function prestigeGain(level,coreIngotLevel){return Math.max(level>=50?1:0,Math.floor(prestigeBase(level)*coreEffect(1,coreIngotLevel)))}
  function prestigePermanent(totalEarned){return 1+.1*Math.sqrt(Math.max(0,finite(totalEarned)))}

  function buyNormalAuto(cash,levels,gameLevel,costReduction){
    let guard=0;
    for(;;){
      let best=-1,bestCost=Infinity;
      for(let i=0;i<8;i++){
        if(gameLevel<NORMAL.unlock[i]||levels[i]>=NORMAL.max[i])continue;
        const c=Math.ceil(NORMAL.baseCost[i]*Math.pow(NORMAL.costRate[i],levels[i])*costReduction);
        if(c<bestCost){bestCost=c;best=i}
      }
      if(best<0||bestCost>cash||++guard>5000)return cash;
      cash-=bestCost;levels[best]++;
    }
  }

  function rarityState(normalLevels,ingotLevels){
    const r=clamp(.005*normalLevels[3],0,1),g=ingotEffect(4,ingotLevels[4])/100,o=ingotEffect(7,ingotLevels[7])/100;
    return {
      pNormal:(1-g)*(1-r),
      pRare:(1-g)*r*(1-o),
      pGem:g,
      pOri:(1-g)*r*o
    };
  }

  function dpsLog10(normalLevels,ingotLevels,coreLevels,totalEarned,dpsCalibration=1){
    const speed=Math.max(1e-30,normalEffect(0,normalLevels[0]));
    const power=Math.max(1e-30,normalEffect(1,normalLevels[1]));
    const reducer=Math.max(1e-30,normalEffect(2,normalLevels[2]));
    const gravity=Math.max(1e-30,normalEffect(4,normalLevels[4]));
    const spikes=Math.max(1e-30,normalEffect(5,normalLevels[5]));
    const rpm=Math.max(1,speed/reducer);
    const hitsPerSec=(rpm/60)*spikes*Math.pow(gravity/9.81,.7);
    const prestige=prestigePermanent(totalEarned);
    const damageBase=power*Math.pow(reducer,2.26)*ingotEffect(2,ingotLevels[2])*prestige;
    return Math.log10(BASE_GAME_DPS*Math.max(1e-12,dpsCalibration))+Math.log10(Math.max(1e-30,hitsPerSec))+coreEffect(2,coreLevels[2])*Math.log10(Math.max(1e-30,damageBase));
  }

  function simulateCurve(opts){
    const target=Math.max(50,Math.floor(finite(opts.maxTarget,1500)));
    const core=(opts.core||DEFAULT_CORE).map(x=>Math.max(0,Math.floor(finite(x))));
    const ingot=(opts.ingot||DEFAULT_INGOT_LEVELS).map(x=>Math.max(0,Math.floor(finite(x))));
    const slowdown=Math.max(1,finite(opts.slowdown,1));
    const physicalCap=Math.max(.05,finite(opts.physicalCap,17));
    const totalEarned=Math.max(0,finite(opts.totalIngotsEarned,0));
    const dpsCalibration=Math.max(1e-9,finite(opts.dpsCalibration,1));
    const costReduction=coreEffect(3,core[3]),coreFeed=coreEffect(4,core[4]);
    const ingotFeed=ingotEffect(3,ingot[3]),expMult=ingotEffect(1,ingot[1]),refining=ingotEffect(0,ingot[0]),coreIncome=coreEffect(0,core[0]);
    const prestige=prestigePermanent(totalEarned),normalLevels=[0,0,0,0,0,0,0,0];
    const times=new Float64Array(target+1),minOneShot=new Float64Array(target+1),worstOneShotLevel=new Int32Array(target+1),queuePressure=new Float64Array(target+1),normalAtTarget=[];
    let cash=0,rawSeconds=0,minShot=Infinity,worst=1,lastPressure=0;
    times[1]=0;minOneShot[1]=Infinity;
    for(let L=1;L<target;L++){
      cash=buyNormalAuto(cash,normalLevels,L,costReduction);
      const feed=normalEffect(7,normalLevels[7]);
      const topSpawn=.6*feed*ingotFeed*coreFeed/slowdown;
      const terminalSupply=topSpawn*TERMINAL_ORES_PER_TOP;
      const dpsLog=dpsLog10(normalLevels,ingot,core,totalEarned,dpsCalibration);
      const hpSmallLog=Math.log10(1.3888888888888888)+L*Math.log10(1.25)+Math.log10(slowdown);
      const rarity=rarityState(normalLevels,ingot),avgOriHp=1+4*rarity.pOri;
      const dpsKillRate=pow10(dpsLog-hpSmallLog)/avgOriHp;
      const processed=Math.max(1e-12,Math.min(terminalSupply,physicalCap,dpsKillRate));
      const req=requiredExp(L),baseValue=.13888888888888887*Math.pow(1.35,L)*slowdown,rareValue=ingotEffect(5,ingot[5]);
      const workNormal=Math.min(1,baseValue*.125*expMult/req);
      const workRare=Math.min(1,baseValue*10*rareValue*.125*expMult/req);
      const workGem=Math.min(1,baseValue*20*rareValue*.125*expMult/req);
      const workOri=Math.min(1,baseValue*200*rareValue*.125*expMult/req);
      const useful=rarity.pNormal*workNormal+rarity.pRare*workRare+rarity.pGem*workGem+rarity.pOri*workOri;
      rawSeconds+=1/Math.max(1e-12,processed*useful);
      times[L+1]=rawSeconds;
      const tier=L>=15?2:(L>=5?1:0),hpLargestNormalLog=hpSmallLog+tier*Math.log10(1.7),shot=pow10(dpsLog-hpLargestNormalLog);
      if(shot<minShot){minShot=shot;worst=L}
      minOneShot[L+1]=minShot;worstOneShotLevel[L+1]=worst;
      lastPressure=terminalSupply/Math.max(1e-12,Math.min(physicalCap,dpsKillRate));queuePressure[L+1]=lastPressure;

      // EXP is based on pre-income base value.  This is the cash represented by the
      // amount of base value required to fill the level, plus the exact level reward.
      // Overshoot only increases real cash, so this is deliberately conservative.
      const baseValueNeeded=req/(.125*expMult);
      cash+=baseValueNeeded*(prestige*refining*coreIncome)+2*req;
    }
    for(const n of normalLevels)normalAtTarget.push(n);
    return {times,minOneShot,worstOneShotLevel,queuePressure,normalAtTarget,rawSeconds};
  }

  function linearFit(xs,ys){
    const n=xs.length;if(!n)return {intercept:0,scale:1,mse:Infinity};
    const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
    let cov=0,varx=0;for(let i=0;i<n;i++){cov+=(xs[i]-mx)*(ys[i]-my);varx+=(xs[i]-mx)*(xs[i]-mx)}
    let scale=varx>1e-12?cov/varx:1;scale=Math.max(.01,scale);let intercept=Math.max(0,my-scale*mx);
    const mse=xs.reduce((s,x,i)=>{const d=intercept+scale*x-ys[i];return s+d*d},0)/n;
    return {intercept,scale,mse};
  }

  function fitCalibration(measurements){
    const rows=(measurements||[]).filter(m=>finite(m.targetLevel)>=50&&finite(m.seconds)>0&&finite(m.slowdown)>=1&&Array.isArray(m.core)&&Array.isArray(m.ingot));
    if(rows.length<2)return {physicalCap:17,intercept:7,scale:1.115,rmse:NaN,count:rows.length,source:'default'};
    let best=null;
    // The user's A7 queue observation says ×2K is near saturation.  A dense search
    // over the physically meaningful event-cap range lets measured route times set
    // the unknown contact/Unity throughput instead of inventing it.
    for(let cap=4;cap<=60;cap+=.25){
      const xs=[],ys=[];
      for(const m of rows){
        const curve=simulateCurve({maxTarget:Math.floor(m.targetLevel),core:m.core,ingot:m.ingot,slowdown:m.slowdown,physicalCap:cap,totalIngotsEarned:finite(m.totalIngotsEarned,0),dpsCalibration:finite(m.dpsCalibration,1)});
        xs.push(curve.times[Math.floor(m.targetLevel)]);ys.push(finite(m.seconds));
      }
      const fit=linearFit(xs,ys),candidate={physicalCap:cap,...fit};
      if(!best||candidate.mse<best.mse)best=candidate;
    }
    return {...best,rmse:Math.sqrt(best.mse),count:rows.length,source:'measurements'};
  }

  function calibratedSeconds(raw,cal){return Math.max(.01,finite(cal.intercept,0)+Math.max(.01,finite(cal.scale,1))*raw)}
  function actualAutoCycle(seconds){return Math.max(AUTO_PRESTIGE_INTERVAL,Math.ceil(seconds/AUTO_PRESTIGE_INTERVAL)*AUTO_PRESTIGE_INTERVAL)}

  function dominates(a,b){
    const ae=[coreEffect(0,a.core[0]),coreEffect(2,a.core[2]),coreEffect(3,a.core[3]),coreEffect(4,a.core[4])],be=[coreEffect(0,b.core[0]),coreEffect(2,b.core[2]),coreEffect(3,b.core[3]),coreEffect(4,b.core[4])];
    return ae[0]>=be[0]&&ae[1]>=be[1]&&ae[2]<=be[2]&&ae[3]>=be[3]&&(ae[0]>be[0]||ae[1]>be[1]||ae[2]<be[2]||ae[3]>be[3]);
  }
  function paretoCoreCandidates(totalCore,ingotLevel){
    const fixed=coreCost(1,ingotLevel),budget=totalCore-fixed;if(budget<0)return [];
    const frontier=[];
    const maxFeed=maxCoreLevel(4,budget);
    for(let feed=0;feed<=maxFeed;feed++){
      const cf=coreCost(4,feed);if(cf>budget)break;
      for(let cost=0;cost<=9;cost++){
        const cc=coreCost(3,cost);if(cf+cc>budget)break;
        const remaining=budget-cf-cc,maxDamage=maxCoreLevel(2,remaining);
        for(let damage=0;damage<=maxDamage;damage++){
          const cd=coreCost(2,damage),income=maxCoreLevel(0,remaining-cd),core=[income,ingotLevel,damage,cost,feed],used=coreBundleCost(core),cand={core,used,left:totalCore-used};
          let skip=false;for(const f of frontier)if(dominates(f,cand)){skip=true;break}if(skip)continue;
          for(let i=frontier.length-1;i>=0;i--)if(dominates(cand,frontier[i]))frontier.splice(i,1);
          frontier.push(cand);
        }
      }
    }
    return frontier;
  }

  function nearestSlowdownIndex(value){
    value=Math.max(1,finite(value,1));let best=0,bestD=Infinity;
    for(let i=0;i<SLOWDOWN.length;i++){const d=Math.abs(Math.log(SLOWDOWN[i])-Math.log(value));if(d<bestD){bestD=d;best=i}}
    return best;
  }
  function slowdownCandidates(core,ingot,physicalCap){
    const numerator=.6*4*ingotEffect(3,ingot[3])*coreEffect(4,core[4])*TERMINAL_ORES_PER_TOP;
    const balance=numerator/Math.max(.1,physicalCap*1.05),idx=nearestSlowdownIndex(balance),set=new Set([1]);
    for(let d=-6;d<=5;d++){const i=idx+d;if(i>=0&&i<SLOWDOWN.length)set.add(SLOWDOWN[i])}
    return [...set].sort((a,b)=>a-b);
  }

  function evaluateCurve(curve,core,cal,input){
    const req=Math.max(0,finite(input.nextRequirement)),held=Math.max(0,finite(input.heldIngots)),pcount=Math.max(0,Math.floor(finite(input.prestigeCount))),oneShot=Math.max(0,finite(input.oneShotMargin,1)),strict=input.strictOneShot!==false;
    const maxTarget=curve.times.length-1;let best=null;
    for(let L=50;L<=maxTarget;L++){
      const shot=curve.minOneShot[L];if(strict&&shot<oneShot)continue;
      const seconds=actualAutoCycle(calibratedSeconds(curve.times[L],cal)),gain=prestigeGain(L,core[1]);if(!(gain>0))continue;
      const byIngots=req<=held?0:Math.ceil((req-held)/gain),byPrestige=Math.max(0,25-pcount),runs=Math.max(byIngots,byPrestige),eta=runs*seconds,rate=gain/seconds;
      const row={targetLevel:L,seconds,gain,runs,eta,rate,oneShotRatio:shot,worstOneShotLevel:curve.worstOneShotLevel[L],queuePressure:curve.queuePressure[L]};
      if(!best||row.eta<best.eta-1e-9||(Math.abs(row.eta-best.eta)<1e-9&&row.rate>best.rate))best=row;
    }
    return best;
  }

  function optimizeFixedCore(input,core,ingot,cal,slowdowns){
    let best=null;const maxTarget=Math.max(100,Math.floor(finite(input.maxTargetLevel,2200)));
    for(const slowdown of slowdowns||slowdownCandidates(core,ingot,cal.physicalCap)){
      const curve=simulateCurve({maxTarget,core,ingot,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:input.dpsCalibration});
      const ev=evaluateCurve(curve,core,cal,input);if(!ev)continue;const row={core:core.slice(),ingot:ingot.slice(),slowdown,...ev,normalAtTarget:curve.normalAtTarget};
      if(!best||row.eta<best.eta-1e-9||(Math.abs(row.eta-best.eta)<1e-9&&row.rate>best.rate))best=row;
    }
    return best;
  }

  function optimizeAscension(input,measurements){
    const a=Math.max(0,Math.floor(finite(input.ascensionCount,7))),totalCore=Math.max(0,finite(input.totalCore,totalCoreForAscension(a))),ingot=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x))));
    const cal=fitCalibration(measurements),base={...input,ascensionCount:a,totalCore,nextRequirement:finite(input.nextRequirement,nextAscensionRequirement(a)),ingotLevels:ingot};
    const absoluteMax=maxCoreLevel(1,totalCore);let selected=null,selectedFrontier=0,selectedIngotLevel=absoluteMax,backedOff=0;
    for(let il=absoluteMax;il>=0&&!selected;il--){
      const frontier=paretoCoreCandidates(totalCore,il);selectedFrontier=frontier.length;
      for(const cand of frontier){
        const row=optimizeFixedCore(base,cand.core,ingot,cal);
        if(!row)continue;row.coreUsed=cand.used;row.coreLeft=cand.left;row.frontierCount=frontier.length;
        if(!selected||row.eta<selected.eta-1e-9||(Math.abs(row.eta-selected.eta)<1e-9&&row.rate>selected.rate))selected=row;
      }
      if(selected){selectedIngotLevel=il;backedOff=absoluteMax-il}
    }
    return {plan:selected,calibration:cal,ascensionCount:a,totalCore,nextRequirement:base.nextRequirement,absoluteMaxIngotLevel:absoluteMax,selectedIngotLevel,backedOff,frontierCount:selectedFrontier};
  }

  function etaContinuous(req,held,rate){return Math.max(0,req-held)/Math.max(1e-12,rate)}
  function canOptimizeIngot(index,level){return level<INGOT.optimizerCap[index]}
  function optimizeIngotUpgrades(input,ascensionResult,measurements,maxSteps=64){
    const plan=ascensionResult&&ascensionResult.plan;if(!plan)return {steps:[],targetLevels:(input.ingotLevels||Array(8).fill(0)).slice(),spent:0};
    const cal=ascensionResult.calibration||fitCalibration(measurements),levels=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),req=ascensionResult.nextRequirement;
    let held=Math.max(0,finite(input.heldIngots)),simWait=0,spent=0,current=optimizeFixedCore({...input,nextRequirement:req},plan.core,levels,cal,[plan.slowdown]),steps=[];
    if(!current)return {steps,targetLevels:levels,spent};
    for(let step=0;step<maxSteps;step++){
      const remaining=Math.max(0,req-held),baseEta=etaContinuous(req,held,current.rate);let best=null;
      for(let i=0;i<8;i++){
        if(!canOptimizeIngot(i,levels[i]))continue;
        const cost=ingotNextCost(i,levels[i]);if(!(cost>0)||cost>req*.45)continue;
        const next=levels.slice();next[i]++;
        const candidate=optimizeFixedCore({...input,nextRequirement:req},plan.core,next,cal,[plan.slowdown]);if(!candidate)continue;
        let eta;
        if(cost<=held)eta=etaContinuous(req,held-cost,candidate.rate);
        else eta=(cost-held)/Math.max(1e-12,current.rate)+req/Math.max(1e-12,candidate.rate);
        const improvement=(baseEta-eta)/Math.max(1e-9,baseEta);
        if(improvement>.001&&(!best||eta<best.eta))best={index:i,cost,next,candidate,eta,improvement};
      }
      if(!best)break;
      const buyAt=Math.max(best.cost,held),wait=best.cost<=held?0:(best.cost-held)/Math.max(1e-12,current.rate);
      simWait+=wait;if(best.cost<=held)held-=best.cost;else held=0;spent+=best.cost;
      levels[best.index]++;current=best.candidate;
      steps.push({index:best.index,name:INGOT.names[best.index],level:levels[best.index],cost:best.cost,buyAt,waitSeconds:wait,improvement:best.improvement,effect:ingotEffect(best.index,levels[best.index]),targetLevel:current.targetLevel,rate:current.rate});
      if(spent>req*.35)break;
    }
    return {steps,targetLevels:levels.slice(),spent,simulatedWaitSeconds:simWait,finalRate:current.rate,finalTargetLevel:current.targetLevel,finalCycleSeconds:current.seconds};
  }

  function formatNumber(v){
    v=finite(v);const a=Math.abs(v);if(a>=1e21)return v.toExponential(3);if(a>=1e12)return (v/1e12).toFixed(a>=1e14?1:2)+'T';if(a>=1e9)return (v/1e9).toFixed(a>=1e11?1:2)+'B';if(a>=1e6)return (v/1e6).toFixed(a>=1e8?1:2)+'M';if(a>=1e3)return (v/1e3).toFixed(a>=1e5?1:2)+'K';return Number(v.toPrecision(5)).toString();
  }

  return {
    TERMINAL_ORES_PER_TOP,NORMAL,INGOT,CORE_NAMES,CORE_FEED,SLOWDOWN,ASCENSION_INGOT_REQ,DEFAULT_INGOT_LEVELS,DEFAULT_CORE,DEFAULT_MEASUREMENTS,
    totalCoreForAscension,nextAscensionRequirement,coreCost,maxCoreLevel,coreEffect,coreBundleCost,ingotEffect,ingotNextCost,ingotCumulativeCost,ingotBundleCost,normalEffect,requiredExp,prestigeBase,prestigeGain,prestigePermanent,
    simulateCurve,fitCalibration,paretoCoreCandidates,slowdownCandidates,optimizeFixedCore,optimizeAscension,optimizeIngotUpgrades,formatNumber
  };
});
