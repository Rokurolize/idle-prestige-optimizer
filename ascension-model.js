(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CrushAscensionOptimizer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // CRUSH FACTORY IDLE v1.0.4 / VRCW asset 71.
  // Deterministic constants are copied from the serialized GameBalanceConfig.
  const TERMINAL_ORES_PER_TOP=4.78640776699;
  const MAX_TOP_SPAWN_RATE=20;
  const AUTO_PRESTIGE_INTERVAL=1;
  const NORMAL_AUTO_UNLOCK_COST=300;
  const OUTER_DAMAGE_FACTOR=.55;
  const ORE_MAX_CRUSH_SECONDS=30;
  const EARLY_ORE_VALUE=[.34362900744795793,.7815852169404028,1.3105059329561746,1.8874439058471755,2.6336507240647125,4.334184788359374,6.739939118696889,8.64958853566101,12.614196244526408,17.902398308642,22.353805455655674,29.87797330570841,36.47543009067704,44.98144004030895,54.27695961817204,71.38908553339408,83.15713010178953,98.80675152551989,121.69951279637111,155.74190634993846,179.04792344125858,226.8861523027345,274.21650214110684,338.40610263604486,391.76187426309815,478.9543738264224,544.5730505335307,647.0168185774196,836.2705248334939,1128.965208525217];
  const EARLY_ORE_HP=[3.1817500689625735,6.700833478569984,10.403218616288283,13.873276162764121,17.9241842965422,27.312716109228543,39.32689740411166,46.73103549562652,63.102386425178636,82.92274317661239,95.87164000899627,118.64954280154458,134.11939945868374,153.14427918138173,171.10361290397313,208.37793555095277,224.74790357817605,247.26293639376246,281.99245297401126,334.1414682506974,355.68899086797006,417.335538934803,467.0326151928781,533.664181259924,572.0424810465383,647.5547612500976,681.733675505318,749.9812678778437,897.5484077181289,1121.9355096476613];

  const NORMAL={
    names:['回転速度','破砕力','減速比','レア鉱石率','重力','スパイク数','スパイクサイズ','供給速度'],
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
    optimizerCap:[1023,1023,1023,1023,10,1023,17,100]
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
  function log10Add(a,b){
    if(a===-Infinity)return b;if(b===-Infinity)return a;if(b>a){const t=a;a=b;b=t}
    const d=b-a;if(d<-16)return a;return a+Math.log10(1+Math.pow(10,d));
  }
  function log10Sub(a,b){
    if(b===-Infinity)return a;if(a===-Infinity||b>=a-1e-14)return -Infinity;
    const d=b-a;if(d<-16)return a;return a+Math.log10(1-Math.pow(10,d));
  }
  function fromLog10(log){return log>Math.log10(Number.MAX_VALUE)?Infinity:log<-323?0:Math.pow(10,log)}
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
  function inferTotalIngotsEarned(held,levels,normalAutoUnlocked=true){
    return Math.max(0,finite(held))+ingotBundleCost(levels||Array(8).fill(0))+(normalAutoUnlocked===false?0:NORMAL_AUTO_UNLOCK_COST);
  }
  function normalEffect(index,level){level=Math.max(0,Math.floor(finite(level)));return NORMAL.base[index]+NORMAL.per[index]*level+NORMAL.per[index]*NORMAL.quad[index]*level*level}
  function requiredExpLog10(level){
    level=Math.max(1,Math.floor(finite(level,1)));let log=Math.log10(8)+level*Math.log10(1.36);if(level<10)log-=Math.log10(5-.4*level);return log;
  }
  function requiredExp(level){return fromLog10(requiredExpLog10(level))}
  function baseOreValueLog10(level){level=Math.max(1,Math.floor(finite(level,1)));return level<=EARLY_ORE_VALUE.length?Math.log10(EARLY_ORE_VALUE[level-1]):Math.log10(.13888888888888887)+level*Math.log10(1.35)}
  function baseOreValue(level){return fromLog10(baseOreValueLog10(level))}
  function baseOreHpLog10(level){level=Math.max(1,Math.floor(finite(level,1)));return level<=EARLY_ORE_HP.length?Math.log10(EARLY_ORE_HP[level-1]):Math.log10(1.3888888888888888)+level*Math.log10(1.25)}
  function baseOreHp(level){return fromLog10(baseOreHpLog10(level))}
  function expectedTerminalPerTop(level){
    level=Math.max(1,Math.floor(finite(level,1)));const w=[.45,.4,.18],unlocked=[true,level>=5,level>=15];let total=0,expected=0;
    for(let i=0;i<3;i++)if(unlocked[i]){total+=w[i];expected+=w[i]*Math.pow(4,i)}
    return total>0?expected/total:1;
  }
  function prestigeBase(level){if(level<50)return 0;return level-49+(level>100?.6*Math.pow(level-100,2):0)}
  function prestigeGain(level,coreIngotLevel){return Math.max(level>=50?1:0,Math.floor(prestigeBase(level)*coreEffect(1,coreIngotLevel)))}
  function prestigePermanent(totalEarned){return 1+.1*Math.sqrt(Math.max(0,finite(totalEarned)))}

  function normalNextCostLog10(index,level,costReduction){
    const raw=Math.log10(NORMAL.baseCost[index])+level*Math.log10(NORMAL.costRate[index])+Math.log10(Math.max(1e-300,costReduction));
    // Preserve the game's integer ceiling exactly while costs are still representable
    // with useful integer precision; afterwards the logarithmic value is sufficient.
    if(raw<14)return Math.log10(Math.max(1,Math.ceil(Math.pow(10,raw))));
    return raw;
  }
  function buyNormalAutoLimited(cashLog,levels,gameLevel,costReduction,limit=Infinity){
    let guard=0,bought=0;
    for(;;){
      let best=-1,bestCostLog=Infinity;
      for(let i=0;i<8;i++){
        if(gameLevel<NORMAL.unlock[i]||levels[i]>=NORMAL.max[i])continue;
        const c=normalNextCostLog10(i,levels[i],costReduction);
        if(c<bestCostLog){bestCostLog=c;best=i}
      }
      if(best<0||bestCostLog>cashLog+1e-12||bought>=limit||++guard>5000)return {cashLog,bought};
      cashLog=log10Sub(cashLog,bestCostLog);levels[best]++;bought++;
    }
  }
  function buyNormalAuto(cashLog,levels,gameLevel,costReduction){return buyNormalAutoLimited(cashLog,levels,gameLevel,costReduction).cashLog}

  function rarityState(normalLevels,ingotLevels){
    const r=clamp(.005*normalLevels[3],0,1),g=ingotEffect(4,ingotLevels[4])/100,o=ingotEffect(7,ingotLevels[7])/100;
    return {
      pNormal:(1-g)*(1-r),
      pRare:(1-g)*r*(1-o),
      pGem:g,
      pOri:(1-g)*r*o
    };
  }

  function topSpawnRate(coreLevels,ingotLevels,normalFeed,slowdown){
    const effectiveRate=Math.max(.01,Math.max(0,finite(normalFeed,1))*ingotEffect(3,ingotLevels[3])*coreEffect(4,coreLevels[4])/Math.max(1,finite(slowdown,1)));
    const raw=.6*effectiveRate;
    return {raw,actual:Math.min(MAX_TOP_SPAWN_RATE,raw)};
  }
  function maxSupplyCappedSlowdown(coreLevels,ingotLevels,normalFeed=4){
    let best=1;
    for(const slowdown of SLOWDOWN){
      if(topSpawnRate(coreLevels,ingotLevels,normalFeed,slowdown).raw+1e-12>=MAX_TOP_SPAWN_RATE)best=slowdown;
      else if(slowdown>best)break;
    }
    return best;
  }

  function expectedUsefulExpPerTerminal(level,slowdown,normalRareLevel,ingotLevels){
    const rarity=rarityState([0,0,0,normalRareLevel,0,0,0,0],ingotLevels);
    const reqLog=requiredExpLog10(level),expMult=ingotEffect(1,ingotLevels[1]),rareValue=ingotEffect(5,ingotLevels[5]);
    const packetLog=baseOreValueLog10(level)+Math.log10(Math.max(1,finite(slowdown,1)))+Math.log10(.125*expMult);
    const work=(valueMultiplier)=>{const d=packetLog+Math.log10(Math.max(1e-300,valueMultiplier))-reqLog;return d>=0?1:(d<-323?0:Math.pow(10,d))};
    const workNormal=work(1);
    const workRare=work(10*rareValue);
    const workGem=work(20*rareValue);
    const workOri=work(200*rareValue);
    return {
      useful:rarity.pNormal*workNormal+rarity.pRare*workRare+rarity.pGem*workGem+rarity.pOri*workOri,
      workNormal,workRare,workGem,workOri,rarity
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
    return Math.log10(OUTER_DAMAGE_FACTOR*Math.max(1e-300,dpsCalibration))+Math.log10(Math.max(1e-300,hitsPerSec))+coreEffect(2,coreLevels[2])*Math.log10(Math.max(1e-300,damageBase));
  }

  function softCapHpLog(hpLog,capLog){
    const d=hpLog-capLog;if(!(d>0))return hpLog;if(d>12)return hpLog+Math.log10(.5);
    return capLog+Math.log10(1+.5*(Math.pow(10,d)-1));
  }

  function simulateCurve(opts){
    const target=Math.max(50,Math.floor(finite(opts.maxTarget,1500)));
    const core=(opts.core||DEFAULT_CORE).map(x=>Math.max(0,Math.floor(finite(x))));
    const ingot=(opts.ingot||DEFAULT_INGOT_LEVELS).map(x=>Math.max(0,Math.floor(finite(x))));
    const slowdown=Math.max(1,finite(opts.slowdown,1));
    const physicalCap=Math.max(.05,finite(opts.physicalCap,11));
    const totalEarned=Math.max(0,finite(opts.totalIngotsEarned,0));
    const dpsCalibration=Math.max(1e-300,finite(opts.dpsCalibration,1)),hpCalibration=Math.max(1e-300,finite(opts.hpCalibration,1));
    const costReduction=coreEffect(3,core[3]),coreFeed=coreEffect(4,core[4]);
    const ingotFeed=ingotEffect(3,ingot[3]),expMult=ingotEffect(1,ingot[1]),refining=ingotEffect(0,ingot[0]),coreIncome=coreEffect(0,core[0]);
    const prestige=prestigePermanent(totalEarned),normalAutoEnabled=opts.normalAutoEnabled!==false,manualMode=opts.normalAutoMode==='manual',manualClickRate=Math.max(.1,finite(opts.manualClickRate,4)),manualCal=opts.manualCalibration||null,normalLevels=[0,0,0,0,0,0,0,0];
    const times=new Float64Array(target+1),minOneShot=new Float64Array(target+1),worstOneShotLevel=new Int32Array(target+1),queuePressure=new Float64Array(target+1),topSpawnRates=new Float64Array(target+1),rawTopSpawnRates=new Float64Array(target+1),contactRates=new Float64Array(target+1),normalRareLevels=new Int16Array(target+1),normalAtTarget=[];
    let cashLog=-Infinity,rawSeconds=0,minShot=Infinity,worst=1,lastPressure=0,lastTopSpawn=0,lastRawTopSpawn=0,lastContactRate=0,lastDpsLog=-Infinity,lastHpSmallLog=-Infinity,lastHpLargeLog=-Infinity,manualClicks=0;
    times[1]=0;minOneShot[1]=Infinity;
    for(let L=1;L<target;L++){
      if(normalAutoEnabled){
        if(manualMode){
          const elapsed=manualCal?calibratedSeconds(rawSeconds,manualCal):rawSeconds,available=Math.max(0,Math.floor(elapsed*manualClickRate)-manualClicks),buy=buyNormalAutoLimited(cashLog,normalLevels,L,costReduction,available);cashLog=buy.cashLog;manualClicks+=buy.bought;
        }else cashLog=buyNormalAuto(cashLog,normalLevels,L,costReduction);
      }
      const feed=normalEffect(7,normalLevels[7]);
      const spawn=topSpawnRate(core,ingot,feed,slowdown),topSpawn=spawn.actual;
      const terminalPerTop=expectedTerminalPerTop(L),terminalSupply=topSpawn*terminalPerTop;
      const dpsLog=dpsLog10(normalLevels,ingot,core,totalEarned,dpsCalibration);
      const rawHpSmallLog=baseOreHpLog10(L),capHpSmallLog=dpsLog+Math.log10(ORE_MAX_CRUSH_SECONDS),hpSmallLog=softCapHpLog(rawHpSmallLog,capHpSmallLog)+Math.log10(slowdown)+Math.log10(hpCalibration);
      const rarity=rarityState(normalLevels,ingot),avgOriHp=1+4*rarity.pOri;
      const dpsKillRate=pow10(dpsLog-hpSmallLog)/avgOriHp;
      const contactRate=physicalCap*terminalSupply/(physicalCap+terminalSupply);
      const processed=Math.max(1e-12,Math.min(contactRate,dpsKillRate));
      const reqLog=requiredExpLog10(L),useful=expectedUsefulExpPerTerminal(L,slowdown,normalLevels[3],ingot).useful;
      rawSeconds+=1/Math.max(1e-12,processed*useful);
      times[L+1]=rawSeconds;
      const tier=L>=15?2:(L>=5?1:0),hpLargestNormalLog=hpSmallLog+tier*Math.log10(1.7),shot=pow10(dpsLog-hpLargestNormalLog);
      if(shot<minShot){minShot=shot;worst=L}
      minOneShot[L+1]=minShot;worstOneShotLevel[L+1]=worst;
      lastPressure=terminalSupply/Math.max(1e-12,Math.min(contactRate,dpsKillRate));queuePressure[L+1]=lastPressure;
      lastTopSpawn=topSpawn;lastRawTopSpawn=spawn.raw;lastContactRate=contactRate;
      topSpawnRates[L+1]=topSpawn;rawTopSpawnRates[L+1]=spawn.raw;contactRates[L+1]=contactRate;normalRareLevels[L+1]=normalLevels[3];
      lastDpsLog=dpsLog;lastHpSmallLog=hpSmallLog;lastHpLargeLog=hpLargestNormalLog;

      // EXP is based on pre-income base value.  This is the cash represented by the
      // amount of base value required to fill the level, plus the exact level reward.
      // Overshoot only increases real cash, so this is deliberately conservative.
      const incomeLog=reqLog-Math.log10(.125*expMult)+Math.log10(Math.max(1e-300,prestige*refining*coreIncome));
      const rewardLog=reqLog+Math.log10(2);
      cashLog=log10Add(cashLog,log10Add(incomeLog,rewardLog));
    }
    for(const n of normalLevels)normalAtTarget.push(n);
    return {times,minOneShot,worstOneShotLevel,queuePressure,topSpawnRates,rawTopSpawnRates,contactRates,normalRareLevels,normalAtTarget,rawSeconds,manualClicks,topSpawnAtTarget:lastTopSpawn,rawTopSpawnAtTarget:lastRawTopSpawn,contactRateAtTarget:lastContactRate,dpsLogAtTarget:lastDpsLog,hpSmallLogAtTarget:lastHpSmallLog,hpLargeLogAtTarget:lastHpLargeLog};
  }

  function deriveDpsCalibration(observation,physicalCap=11){
    const level=Math.max(1,Math.floor(finite(observation&&observation.level))),observedDps=Math.max(1e-300,finite(observation&&observation.dps));
    const core=(observation&&observation.core||DEFAULT_CORE).map(x=>Math.max(0,Math.floor(finite(x))));
    const ingot=(observation&&observation.ingot||DEFAULT_INGOT_LEVELS).map(x=>Math.max(0,Math.floor(finite(x))));
    const slowdown=Math.max(1,finite(observation&&observation.slowdown,1)),totalIngotsEarned=Math.max(0,finite(observation&&observation.totalIngotsEarned,0));
    const curve=simulateCurve({maxTarget:level+1,core,ingot,slowdown,physicalCap,totalIngotsEarned,dpsCalibration:1,hpCalibration:1});
    const observedLog=Math.log10(observedDps),delta=observedLog-curve.dpsLogAtTarget,calibration=pow10(delta);
    const observedHp=Math.max(0,finite(observation&&observation.hpSmall,0)),predictedHp=pow10(curve.hpSmallLogAtTarget);
    const hpCalibration=observedHp>0?observedHp/Math.max(1e-300,predictedHp):1;
    return {calibration,hpCalibration,level,predictedDps:pow10(curve.dpsLogAtTarget),observedDps,predictedHpSmall:predictedHp,observedHpSmall:observedHp,hpRatio:observedHp>0?predictedHp/observedHp:NaN,normalLevels:curve.normalAtTarget};
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
    if(rows.length<2)return {physicalCap:11,intercept:7,scale:.59,rmse:NaN,count:rows.length,source:'default'};
    let best=null;
    // The 20 top-ore/s spawn ceiling is exact.  This fitted value is instead the
    // asymptote of an empirical contact/physics saturation curve for terminal ore
    // events.  Supply above it still helps, with diminishing returns.
    for(let cap=4;cap<=60;cap+=.25){
      const xs=[],ys=[];
      for(const m of rows){
        const curve=simulateCurve({maxTarget:Math.floor(m.targetLevel),core:m.core,ingot:m.ingot,slowdown:m.slowdown,physicalCap:cap,totalIngotsEarned:finite(m.totalIngotsEarned,0),dpsCalibration:finite(m.dpsCalibration,1),hpCalibration:finite(m.hpCalibration,1)});
        xs.push(curve.times[Math.floor(m.targetLevel)]);ys.push(finite(m.seconds));
      }
      const fit=linearFit(xs,ys),candidate={physicalCap:cap,...fit};
      if(!best||candidate.mse<best.mse)best=candidate;
    }
    return {...best,rmse:Math.sqrt(best.mse),count:rows.length,source:'measurements'};
  }

  function calibratedSeconds(raw,cal){return Math.max(.01,finite(cal.intercept,0)+Math.max(.01,finite(cal.scale,1))*raw)}
  function actualAutoCycle(seconds){return Math.max(AUTO_PRESTIGE_INTERVAL,Math.ceil(seconds/AUTO_PRESTIGE_INTERVAL)*AUTO_PRESTIGE_INTERVAL)}
  function sameLevels(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>Math.floor(finite(v))===Math.floor(finite(b[i])))}
  function exactTimingMeasurements(measurements,core,ingot,slowdown){
    return (measurements||[]).filter(m=>finite(m.targetLevel)>=50&&finite(m.seconds)>0&&finite(m.slowdown)===finite(slowdown)&&sameLevels(m.core,core)&&sameLevels(m.ingot,ingot)).sort((a,b)=>a.targetLevel-b.targetLevel);
  }
  function timingResolver(curve,cal,core,ingot,slowdown,measurements){
    const points=exactTimingMeasurements(measurements,core,ingot,slowdown),modelAt=L=>calibratedSeconds(curve.times[Math.max(1,Math.min(curve.times.length-1,Math.floor(L)))],cal);
    const residual=points.map(p=>({level:Math.floor(p.targetLevel),r:finite(p.seconds)-modelAt(p.targetLevel)}));
    function correction(L){
      if(!residual.length)return 0;if(L<=residual[0].level)return residual[0].r;
      const last=residual[residual.length-1];if(L>=last.level)return last.r;
      let lo=0,hi=residual.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(residual[mid].level<=L)lo=mid;else hi=mid}
      const a=residual[lo],b=residual[hi],t=(L-a.level)/Math.max(1,b.level-a.level);return a.r+(b.r-a.r)*t;
    }
    const secondsAt=L=>Math.max(.01,modelAt(L)+correction(L));
    const levelAt=seconds=>{let lo=1,hi=curve.times.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(secondsAt(mid)<=seconds)lo=mid;else hi=mid-1}return lo};
    const minLevel=points.length?points[0].targetLevel:Infinity,maxLevel=points.length?points[points.length-1].targetLevel:-Infinity;
    return {points,secondsAt,levelAt,validated:points.length>=2,minLevel,maxLevel};
  }
  function levelAtCalibratedTime(curve,cal,seconds){
    let lo=1,hi=curve.times.length-1;
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(calibratedSeconds(curve.times[mid],cal)<=seconds)lo=mid;else hi=mid-1}
    return lo;
  }

  function planNormalAutoBootstrap(input,core,ingot,cal,slowdown){
    const held=Math.max(0,finite(input.heldIngots)),totalEarned=Math.max(0,finite(input.totalIngotsEarned)),pcount=Math.max(0,Math.floor(finite(input.prestigeCount)));
    const basePost={...input,normalAutoUnlocked:true};
    if(input.normalAutoUnlocked!==false)return {needed:false,prestigePerformed:false,seconds:0,gain:0,cost:0,postState:basePost};
    if(held>=NORMAL_AUTO_UNLOCK_COST){
      return {needed:true,prestigePerformed:false,seconds:0,gain:0,cost:NORMAL_AUTO_UNLOCK_COST,heldBefore:held,heldAfter:held-NORMAL_AUTO_UNLOCK_COST,postState:{...basePost,heldIngots:held-NORMAL_AUTO_UNLOCK_COST,totalIngotsEarned:totalEarned,prestigeCount:pcount}};
    }
    const maxTarget=Math.max(100,Math.floor(finite(input.maxTargetLevel,2200))),needed=NORMAL_AUTO_UNLOCK_COST-held;
    let guaranteedLevel=50;while(guaranteedLevel<maxTarget&&prestigeGain(guaranteedLevel,core[1])<needed)guaranteedLevel++;
    if(prestigeGain(guaranteedLevel,core[1])<needed)return null;
    const slowdowns=slowdown==null?[...new Set([...slowdownCandidates(core,ingot,cal.physicalCap,1),...slowdownCandidates(core,ingot,cal.physicalCap,4)])].sort((a,b)=>a-b):[Math.max(1,finite(slowdown,1))];
    // Before the 300▲ unlock the user is present and manually buys normal
    // upgrades.  One-shot is not a hard requirement here; actual DPS/HP kill
    // throughput is already part of simulateCurve.
    let best=null;
    for(const bootSlowdown of slowdowns){
      // Bootstrap is normally Lv50 in the progressed game.  Avoid simulating the
      // full steady-state target for every Core candidate: extend only far enough
      // to resolve the 1-second Auto Prestige poll overshoot exactly.
      let curve,end=Math.min(maxTarget,Math.max(128,guaranteedLevel+64));
      for(;;){
        curve=simulateCurve({maxTarget:end,core,ingot,slowdown:bootSlowdown,physicalCap:cal.physicalCap,totalIngotsEarned:totalEarned,dpsCalibration:input.dpsCalibration,hpCalibration:input.hpCalibration,normalAutoEnabled:true,normalAutoMode:'manual',manualClickRate:input.manualClickRate,manualCalibration:cal});
        const latestPoll=actualAutoCycle(calibratedSeconds(curve.times[Math.min(guaranteedLevel,end)],cal));
        if(end>=maxTarget||calibratedSeconds(curve.times[end],cal)>latestPoll)break;
        end=Math.min(maxTarget,Math.max(end+64,end*2));
      }
      for(let L=50;L<=guaranteedLevel;L++){
        const configuredReach=calibratedSeconds(curve.times[L],cal),seconds=actualAutoCycle(configuredReach),actualLevel=levelAtCalibratedTime(curve,cal,seconds);
        const shot=curve.minOneShot[actualLevel];
        const gain=prestigeGain(actualLevel,core[1]);if(gain<needed)continue;
        const manualCurve=simulateCurve({maxTarget:actualLevel+1,core,ingot,slowdown:bootSlowdown,physicalCap:cal.physicalCap,totalIngotsEarned:totalEarned,dpsCalibration:input.dpsCalibration,hpCalibration:input.hpCalibration,normalAutoEnabled:true,normalAutoMode:'manual',manualClickRate:input.manualClickRate,manualCalibration:cal});
        const manualNormalLevels=manualCurve.normalAtTarget.slice(),manualPurchases=manualCurve.manualClicks;
        const row={needed:true,prestigePerformed:true,manualNormalPurchases:true,manualNormalLevels,manualPurchases,core:core.slice(),slowdown:bootSlowdown,targetLevel:L,actualPrestigeLevel:actualLevel,configuredReachSeconds:configuredReach,seconds,gain,cost:NORMAL_AUTO_UNLOCK_COST,heldBefore:held,heldAfter:held+gain-NORMAL_AUTO_UNLOCK_COST,oneShotRatio:shot,worstOneShotLevel:curve.worstOneShotLevel[actualLevel]};
        if(!best||row.seconds<best.seconds-1e-9||(Math.abs(row.seconds-best.seconds)<1e-9&&row.targetLevel<best.targetLevel))best=row;
      }
    }
    if(!best)return null;
    best.postState={...basePost,heldIngots:best.heldAfter,totalIngotsEarned:totalEarned+best.gain,prestigeCount:pcount+1};
    return best;
  }

  function optimizeNormalAutoBootstrap(input,totalCore,ingot,cal){
    if(input.normalAutoUnlocked!==false||Math.max(0,finite(input.heldIngots))>=NORMAL_AUTO_UNLOCK_COST){
      return planNormalAutoBootstrap(input,[0,0,0,0,0],ingot,cal,1);
    }
    let best=null;const absoluteMax=maxCoreLevel(1,totalCore);
    for(let il=0;il<=absoluteMax;il++){
      for(const cand of paretoCoreCandidates(totalCore,il)){
        const b=planNormalAutoBootstrap(input,cand.core,ingot,cal);
        if(!b)continue;b.coreUsed=cand.used;b.coreLeft=cand.left;
        if(!best||b.seconds<best.seconds-1e-9||(Math.abs(b.seconds-best.seconds)<1e-9&&b.manualPurchases<best.manualPurchases))best=b;
      }
    }
    return best;
  }

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
  function slowdownCandidates(core,ingot,physicalCap,normalFeed=4){
    const topNumerator=.6*Math.max(1e-12,finite(normalFeed,4))*ingotEffect(3,ingot[3])*coreEffect(4,core[4]);
    const spawnBoundary=topNumerator/MAX_TOP_SPAWN_RATE;
    const contactBoundary=topNumerator*TERMINAL_ORES_PER_TOP/Math.max(.1,physicalCap);
    const indices=[nearestSlowdownIndex(spawnBoundary),nearestSlowdownIndex(contactBoundary)],set=new Set([1]);
    for(const idx of indices)for(let d=-6;d<=5;d++){const i=idx+d;if(i>=0&&i<SLOWDOWN.length)set.add(SLOWDOWN[i])}
    return [...set].sort((a,b)=>a-b);
  }

  function mergePrestigeSchedule(parts){
    const out=[];
    for(const part of parts||[]){
      if(!part||!(part.runs>0))continue;
      const last=out[out.length-1];
      if(last&&last.targetLevel===part.targetLevel&&last.actualPrestigeLevel===part.actualPrestigeLevel&&last.seconds===part.seconds&&last.gain===part.gain){
        last.runs+=part.runs;last.totalSeconds+=part.totalSeconds;last.totalGain+=part.totalGain;
      }else out.push({...part});
    }
    return out;
  }

  function prestigeScheduleFunding(policy,neededIngots){
    let need=Math.max(0,finite(neededIngots)),runs=0,seconds=0,gain=0;
    if(need<=0)return {complete:true,runs,seconds,gain};
    const schedule=policy&&Array.isArray(policy.prestigeSchedule)&&policy.prestigeSchedule.length?policy.prestigeSchedule:[{runs:Math.max(0,Math.floor(finite(policy&&policy.runs))),seconds:finite(policy&&policy.seconds),gain:finite(policy&&policy.gain)}];
    for(const part of schedule){
      if(need<=0)break;
      const perGain=Math.max(0,finite(part.gain)),perSeconds=Math.max(0,finite(part.seconds)),available=Math.max(0,Math.floor(finite(part.runs)));
      if(!(perGain>0)||available<=0)continue;
      const take=Math.min(available,Math.max(1,Math.ceil(need/perGain)));
      runs+=take;seconds+=take*perSeconds;gain+=take*perGain;need-=take*perGain;
    }
    return {complete:need<=0,runs,seconds,gain,remaining:Math.max(0,need)};
  }

  function evaluateCurve(curve,core,cal,input,timing=null){
    const req=Math.max(0,finite(input.nextRequirement)),held=Math.max(0,finite(input.heldIngots)),pcount=Math.max(0,Math.floor(finite(input.prestigeCount))),oneShot=Math.max(0,finite(input.oneShotMargin,1)),strict=input.strictOneShot!==false,objective=input.objective||'ascensionEta';
    const maxTarget=curve.times.length-1,options=[];
    for(let L=50;L<=maxTarget;L++){
      const configuredReach=timing?timing.secondsAt(L):calibratedSeconds(curve.times[L],cal),seconds=actualAutoCycle(configuredReach),actualLevel=timing?timing.levelAt(seconds):levelAtCalibratedTime(curve,cal,seconds);
      const shot=curve.minOneShot[actualLevel];if(strict&&shot<oneShot)continue;
      const gain=prestigeGain(actualLevel,core[1]);if(!(gain>0))continue;
      options.push({targetLevel:L,actualPrestigeLevel:actualLevel,configuredReachSeconds:configuredReach,seconds,gain,rate:gain/seconds,oneShotRatio:shot,worstOneShotLevel:curve.worstOneShotLevel[actualLevel],queuePressure:curve.queuePressure[actualLevel]});
    }
    if(!options.length)return null;
    if(objective==='ingotRate'){
      let best=null;
      for(const row of options)if(!best||row.rate>best.rate+1e-12||(Math.abs(row.rate-best.rate)<=Math.max(1,Math.abs(best.rate))*1e-12&&row.targetLevel<best.targetLevel))best=row;
      const need=Math.max(0,req-held),runs=need<=0?0:Math.ceil(need/Math.max(1,best.gain));
      return {...best,runs,eta:need/Math.max(1e-12,best.rate),prestigeSchedule:runs?mergePrestigeSchedule([{...best,runs,totalSeconds:runs*best.seconds,totalGain:runs*best.gain,role:'ingot'}]):[],totalRuns:runs,totalGain:runs*best.gain,firstRunGain:best.gain,firstRunSeconds:best.seconds};
    }

    const need=Math.max(0,req-held),minRuns=Math.max(0,25-pcount);
    if(need<=0&&minRuns<=0){
      const shallow=options.reduce((a,b)=>!a||b.seconds<a.seconds||(b.seconds===a.seconds&&b.targetLevel<a.targetLevel)?b:a,null);
      return {...shallow,runs:0,eta:0,rate:0,prestigeSchedule:[],totalRuns:0,totalGain:0,firstRunGain:0,firstRunSeconds:0};
    }

    // Fastest legal Prestige is the filler when the 25-Prestige gate is binding.
    // Higher Slowdown may make the same wall-clock poll reach a slightly different
    // actual level; among equal-time fillers keep the one with the larger gain.
    const shallow=options.reduce((a,b)=>!a||b.seconds<a.seconds||(b.seconds===a.seconds&&b.gain>a.gain)?b:a,null);
    const sortedByGain=options.slice().sort((a,b)=>a.gain-b.gain||a.seconds-b.seconds||a.targetLevel-b.targetLevel),suffixBest=new Array(sortedByGain.length);
    let suffix=null;
    for(let i=sortedByGain.length-1;i>=0;i--){const o=sortedByGain[i];if(!suffix||o.seconds<suffix.seconds||(o.seconds===suffix.seconds&&o.gain>suffix.gain))suffix=o;suffixBest[i]=suffix}
    function bestForGain(want){
      if(want<=0)return shallow;
      let lo=0,hi=sortedByGain.length-1;if(sortedByGain[hi].gain+1e-9<want)return null;
      while(lo<hi){const mid=(lo+hi)>>1;if(sortedByGain[mid].gain>=want)hi=mid;else lo=mid+1}
      return suffixBest[lo];
    }
    function scheduleCandidate(parts){
      const schedule=mergePrestigeSchedule(parts),runs=schedule.reduce((a,x)=>a+x.runs,0),eta=schedule.reduce((a,x)=>a+x.totalSeconds,0),totalGain=schedule.reduce((a,x)=>a+x.totalGain,0);
      if(runs<minRuns||totalGain+1e-6<need)return null;
      const primary=schedule.reduce((a,b)=>!a||b.targetLevel>a.targetLevel?b:a,null)||shallow;
      const minShot=schedule.reduce((a,x)=>Math.min(a,x.oneShotRatio),Infinity),worst=schedule.reduce((a,x)=>x.oneShotRatio<=a.ratio?{ratio:x.oneShotRatio,level:x.worstOneShotLevel}:a,{ratio:Infinity,level:1});
      return {...primary,runs,eta,rate:eta>0?totalGain/eta:0,prestigeSchedule:schedule,totalRuns:runs,totalGain,firstRunGain:schedule[0]?schedule[0].gain:0,firstRunSeconds:schedule[0]?schedule[0].seconds:0,oneShotRatio:minShot,worstOneShotLevel:worst.level};
    }
    let best=null;
    function consider(c){if(!c)return;if(!best||c.eta<best.eta-1e-9||(Math.abs(c.eta-best.eta)<1e-9&&c.rate>best.rate+1e-12))best=c}

    // When the 25-Prestige gate is binding, split the work into k deep runs that
    // earn the Ingots and (minRuns-k) fastest Lv50-ish count-only runs. This is the
    // key case that a single fixed Auto Prestige target cannot represent.
    if(minRuns>0){
      for(let k=0;k<=minRuns;k++){
        if(k===0){if(shallow.gain*minRuns+1e-6>=need)consider(scheduleCandidate([{...shallow,runs:minRuns,totalSeconds:minRuns*shallow.seconds,totalGain:minRuns*shallow.gain,role:'count'}]));continue}
        const fillerRuns=minRuns-k,deepNeed=Math.max(0,need-fillerRuns*shallow.gain),perDeep=deepNeed/k,deep=bestForGain(perDeep);if(!deep)continue;
        consider(scheduleCandidate([
          {...deep,runs:k,totalSeconds:k*deep.seconds,totalGain:k*deep.gain,role:'deep'},
          ...(fillerRuns?[{...shallow,runs:fillerRuns,totalSeconds:fillerRuns*shallow.seconds,totalGain:fillerRuns*shallow.gain,role:'count'}]:[])
        ]));
      }
    }

    // If Ingots require more runs than the Prestige gate, search repeated deep
    // runs plus a cheaper final remainder run. This avoids uniform-target overshoot.
    if(need>0){
      for(const deep of options){
        const n=Math.ceil(need/Math.max(1,deep.gain));if(n<=minRuns)continue;
        const full=Math.max(0,n-1),remainderNeed=Math.max(0,need-full*deep.gain),last=bestForGain(remainderNeed);if(!last)continue;
        consider(scheduleCandidate([
          ...(full?[{...deep,runs:full,totalSeconds:full*deep.seconds,totalGain:full*deep.gain,role:'deep'}]:[]),
          {...last,runs:1,totalSeconds:last.seconds,totalGain:last.gain,role:'remainder'}
        ]));
      }
    }
    return best;
  }

  function optimizeFixedCore(input,core,ingot,cal,slowdowns){
    let best=null;const maxTarget=Math.max(100,Math.floor(finite(input.maxTargetLevel,2200)));
    for(const slowdown of slowdowns||slowdownCandidates(core,ingot,cal.physicalCap)){
      const curve=simulateCurve({maxTarget,core,ingot,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:input.dpsCalibration,hpCalibration:input.hpCalibration,normalAutoEnabled:true});
      const timing=timingResolver(curve,cal,core,ingot,slowdown,input.measurements||[]),ev=evaluateCurve(curve,core,cal,input,timing);if(!ev)continue;const actual=ev.actualPrestigeLevel;
      const row={core:core.slice(),ingot:ingot.slice(),slowdown,maxSupplyCappedSlowdown:maxSupplyCappedSlowdown(core,ingot,4),...ev,steadyRuns:ev.runs,bootstrapRuns:0,normalAtTarget:curve.normalAtTarget,topSpawnAtTarget:curve.topSpawnRates[actual],rawTopSpawnAtTarget:curve.rawTopSpawnRates[actual],contactRateAtTarget:curve.contactRates[actual],timingMeasurementCount:timing.points.length,timingValidated:timing.validated&&ev.targetLevel>=timing.minLevel&&ev.targetLevel<=timing.maxLevel,timingMinLevel:timing.minLevel,timingMaxLevel:timing.maxLevel};
      const etaTie=best&&Math.abs(row.eta-best.eta)<1e-9,rateTol=best?Math.max(1,Math.abs(best.rate))*1e-12:0,rateTie=best&&Math.abs(row.rate-best.rate)<=rateTol;
      // With the same completion time and throughput, the larger Slowdown weakly
      // dominates while 20 top ores/s and DPS throughput are unchanged: it gives
      // more EXP/value headroom for later levels. Overflow can saturate the benefit
      // but cannot make the larger packet harmful by itself.
      if(!best||row.eta<best.eta-1e-9||(etaTie&&(row.rate>best.rate+rateTol||(rateTie&&row.slowdown>best.slowdown))))best=row;
    }
    return best;
  }

  function optimizeAscension(input,measurements){
    const a=Math.max(0,Math.floor(finite(input.ascensionCount,7))),totalCore=Math.max(0,finite(input.totalCore,totalCoreForAscension(a))),ingot=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x))));
    const cal=fitCalibration(measurements),base={...input,measurements:measurements||[],ascensionCount:a,totalCore,nextRequirement:finite(input.nextRequirement,nextAscensionRequirement(a)),ingotLevels:ingot};
    const bootstrap=optimizeNormalAutoBootstrap(base,totalCore,ingot,cal);if(!bootstrap)return {plan:null,calibration:cal,ascensionCount:a,totalCore,nextRequirement:base.nextRequirement,strictFallback:false};
    const steadyBase=bootstrap.postState||{...base,normalAutoUnlocked:true};
    const absoluteMax=maxCoreLevel(1,totalCore);
    function search(searchBase){
      let selected=null,selectedFrontier=0,selectedIngotLevel=absoluteMax,backedOff=0,candidatePool=[];
      for(let il=absoluteMax;il>=0&&!selected;il--){
        const frontier=paretoCoreCandidates(totalCore,il);selectedFrontier=frontier.length;
        for(const cand of frontier){
          const row=optimizeFixedCore(searchBase,cand.core,ingot,cal);
          if(!row)continue;row.coreUsed=cand.used;row.coreLeft=cand.left;row.frontierCount=frontier.length;candidatePool.push(row);
          if(!selected||row.eta<selected.eta-1e-9||(Math.abs(row.eta-selected.eta)<1e-9&&row.rate>selected.rate))selected=row;
        }
        if(selected){selectedIngotLevel=il;backedOff=absoluteMax-il}
      }
      candidatePool.sort((a,b)=>a.eta-b.eta||b.rate-a.rate);
      return {selected,selectedFrontier,selectedIngotLevel,backedOff,candidatePool};
    }
    let found=search(steadyBase),strictFallback=false;
    if(!found.selected&&steadyBase.strictOneShot!==false){found=search({...steadyBase,strictOneShot:false});strictFallback=!!found.selected}
    const {selected,selectedFrontier,selectedIngotLevel,backedOff}=found;
    let nearAlternatives=[];
    if(selected){
      const seenAlt=new Set();
      nearAlternatives=(found.candidatePool||[]).filter(x=>x!==selected&&x.eta<=selected.eta*1.005).filter(x=>{const k=x.core.join(',')+'|'+x.slowdown;if(seenAlt.has(k))return false;seenAlt.add(k);return true}).slice(0,8).map(x=>({core:x.core.slice(),slowdown:x.slowdown,maxSupplyCappedSlowdown:x.maxSupplyCappedSlowdown,targetLevel:x.targetLevel,actualPrestigeLevel:x.actualPrestigeLevel,seconds:x.seconds,gain:x.gain,runs:x.runs,rate:x.rate,eta:x.eta,prestigeSchedule:(x.prestigeSchedule||[]).map(y=>({...y})),topSpawnAtTarget:x.topSpawnAtTarget,rawTopSpawnAtTarget:x.rawTopSpawnAtTarget,coreUsed:x.coreUsed,coreLeft:x.coreLeft}));
      selected.bootstrap=bootstrap;selected.bootstrapRuns=bootstrap.prestigePerformed?1:0;selected.steadyRuns=selected.runs;selected.runs+=selected.bootstrapRuns;selected.eta+=bootstrap.seconds;nearAlternatives=nearAlternatives.map(x=>({...x,eta:x.eta+bootstrap.seconds}));
      const same=(x,y)=>Array.isArray(x)&&Array.isArray(y)&&x.length===y.length&&x.every((v,i)=>Math.floor(finite(v))===Math.floor(finite(y[i])));
      selected.slowdownValidated=(measurements||[]).some(m=>same(m.core,selected.core)&&same(m.ingot,selected.ingot)&&finite(m.slowdown)===selected.slowdown);
    }
    return {plan:selected,nearAlternatives,calibration:cal,ascensionCount:a,totalCore,nextRequirement:base.nextRequirement,absoluteMaxIngotLevel:absoluteMax,selectedIngotLevel,backedOff,frontierCount:selectedFrontier,strictFallback};
  }

  function etaContinuous(req,held,rate){return Math.max(0,req-held)/Math.max(1e-12,rate)}
  function canOptimizeIngot(index,level){return level<INGOT.optimizerCap[index]}
  function optimizeIngotUpgrades(input,ascensionResult,measurements,maxSteps=192){
    const plan=ascensionResult&&ascensionResult.plan;
    if(!plan)return {steps:[],phases:[],targetLevels:(input.ingotLevels||Array(8).fill(0)).slice(),spent:0,stopReason:'no_plan'};
    const cal=ascensionResult.calibration||fitCalibration(measurements),req=ascensionResult.nextRequirement;
    const postBootstrapInput=plan.bootstrap&&plan.bootstrap.postState?{...plan.bootstrap.postState,normalAutoUnlocked:true}:{...input,normalAutoUnlocked:true};
    let levels=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),held=Math.max(0,finite(postBootstrapInput.heldIngots)),totalEarned=Math.max(0,finite(postBootstrapInput.totalIngotsEarned)),prestigeCount=Math.max(0,Math.floor(finite(postBootstrapInput.prestigeCount)));
    let spent=0,elapsed=0,steps=[],phases=[],nodesEvaluated=0,replans=0,stopReason='marginal_no_gain';
    const initialLevels=levels.slice(),initialHeld=held,initialPrestigeCount=prestigeCount,phaseDepth=3,beamWidth=5,maxPhases=Math.max(1,Math.ceil(maxSteps/phaseDepth)+2),minImprovement=.0005;

    function fullPolicy(stateLevels,stateHeld,stateEarned,statePrestige){
      replans++;
      const r=optimizeAscension({...postBootstrapInput,objective:'ascensionEta',normalAutoUnlocked:true,heldIngots:stateHeld,totalIngotsEarned:stateEarned,prestigeCount:statePrestige,ingotLevels:stateLevels.slice(),nextRequirement:req},measurements);
      return r&&r.plan?{...r.plan,calibration:r.calibration}:null;
    }
    function fixedPolicy(policy,stateLevels,stateHeld,stateEarned,statePrestige){
      nodesEvaluated++;
      return optimizeFixedCore({...postBootstrapInput,objective:'ascensionEta',normalAutoUnlocked:true,heldIngots:stateHeld,totalIngotsEarned:stateEarned,prestigeCount:statePrestige,ingotLevels:stateLevels.slice(),nextRequirement:req},policy.core,stateLevels,cal,[policy.slowdown]);
    }
    function runsToGoal(stateHeld,statePrestige,policy){return Math.max(0,Math.floor(finite(policy&&policy.totalRuns,policy&&policy.runs||0)))}
    function finishEta(elapsedLocal,stateHeld,statePrestige,policy){return elapsedLocal+Math.max(0,finite(policy&&policy.eta))}
    function fundingToBuy(policy,stateHeld,cost){
      const need=Math.max(0,cost-stateHeld);if(need<=0)return {complete:true,runs:0,seconds:0,gain:0};
      return prestigeScheduleFunding(policy,need);
    }
    function keyFor(ls,p,h){return ls.join(',')+'|'+p+'|'+Math.round(h)}
    function incrementalIngotCost(index,from,to){return Math.max(0,ingotCumulativeCost(index,to)-ingotCumulativeCost(index,from))}
    function maxAffordableIngotLevel(index,from,budget){
      budget=Math.max(0,finite(budget));const cap=INGOT.optimizerCap[index];if(from>=cap)return from;
      let lo=from,hi=Math.min(cap,from+1);
      while(hi<cap&&incrementalIngotCost(index,from,hi)<=budget){lo=hi;hi=Math.min(cap,Math.max(hi+1,hi*2))}
      if(incrementalIngotCost(index,from,hi)<=budget)return hi;
      while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(incrementalIngotCost(index,from,mid)<=budget)lo=mid;else hi=mid-1}
      return lo;
    }
    function bulkTargets(node,index,goalRuns){
      const from=node.levels[index],cap=INGOT.optimizerCap[index];if(from>=cap)return [];
      // The important high-Ascension case is a capital jump after the next
      // Prestige. Costs double every level, so fractions of one run naturally
      // sample the useful Lv30-50-ish bulk-purchase bands without enumerating
      // every intermediate level. Never wait until the Ascension-finishing run.
      const oneRunBudget=node.held+(goalRuns>1?(node.policy.firstRunGain||node.policy.gain||0):0),fractions=[0,.001,.01,.1,1],targets=new Set([from+1]);
      for(const f of fractions){
        const budget=f===0?node.held:oneRunBudget*f,lv=maxAffordableIngotLevel(index,from,budget);if(lv>from)targets.add(lv);
      }
      return [...targets].filter(lv=>lv>from&&lv<=cap).sort((a,b)=>a-b);
    }
    function aggregateChanges(path,startLevels){
      const out=[];
      for(let i=0;i<8;i++){
        const to=path.length?path[path.length-1].levels[i]:startLevels[i];
        if(to!==startLevels[i])out.push({index:i,name:INGOT.names[i],from:startLevels[i],to,cost:path.filter(x=>x.index===i).reduce((a,x)=>a+x.cost,0)});
      }
      return out;
    }

    let policy=fullPolicy(levels,held,totalEarned,prestigeCount);
    if(!policy)return {steps,phases,targetLevels:levels,spent,postBootstrapState:postBootstrapInput,stopReason:'no_policy',nodesEvaluated,replans};
    const baselineEta=policy.eta;

    for(let phaseNo=1;phaseNo<=maxPhases&&steps.length<maxSteps;phaseNo++){
      const phaseStartLevels=levels.slice(),phaseStartHeld=held,phaseStartEarned=totalEarned,phaseStartPrestige=prestigeCount,phaseStartRate=policy.rate,phaseStartEta=finishEta(0,held,prestigeCount,policy);
      let beam=[{levels:levels.slice(),held,totalEarned,prestigeCount,elapsed:0,spent:0,rate:policy.rate,policy,path:[]}],best=null;
      const seen=new Map([[keyFor(levels,prestigeCount,held),phaseStartEta]]);

      for(let depth=1;depth<=phaseDepth&&steps.length+depth<=maxSteps;depth++){
        const generated=[];
        for(const node of beam){
          const goalRuns=runsToGoal(node.held,node.prestigeCount,node.policy);
          for(let i=0;i<8;i++){
            if(!canOptimizeIngot(i,node.levels[i]))continue;
            for(const targetLevel of bulkTargets(node,i,goalRuns)){
              const fromLevel=node.levels[i],cost=incrementalIngotCost(i,fromLevel,targetLevel);if(!(cost>0)&&targetLevel>fromLevel)continue;
              const funding=fundingToBuy(node.policy,node.held,cost);if(!funding.complete)continue;const runsBeforeBuy=funding.runs;
              // Ingots only arrive at Prestige. If the factory would satisfy both
              // Ascension conditions on or before the Prestige that funds this buy,
              // buying it cannot shorten the current Ascension.
              if(runsBeforeBuy>=goalRuns&&runsBeforeBuy>0)continue;
              const wait=funding.seconds,fundedHeld=node.held+funding.gain,nextHeld=fundedHeld-cost,nextEarned=node.totalEarned+funding.gain,nextPrestige=node.prestigeCount+runsBeforeBuy,nextLevels=node.levels.slice();nextLevels[i]=targetLevel;
              const candidate=fixedPolicy(node.policy,nextLevels,nextHeld,nextEarned,nextPrestige);if(!candidate)continue;
              const localElapsed=node.elapsed+wait,eta=finishEta(localElapsed,nextHeld,nextPrestige,candidate),k=keyFor(nextLevels,nextPrestige,nextHeld);
              const prior=seen.get(k);if(prior!==undefined&&prior<=eta+1e-9)continue;seen.set(k,eta);
              const step={index:i,name:INGOT.names[i],fromLevel,level:targetLevel,levels:nextLevels.slice(),cost,waitSeconds:wait,prestigesBeforeBuy:runsBeforeBuy,buyAt:fundedHeld,effect:ingotEffect(i,targetLevel),rateBefore:node.policy.rate,rateAfter:candidate.rate,hourlyBefore:node.policy.rate*3600,hourlyAfter:candidate.rate*3600,heldBefore:node.held,heldAfter:nextHeld,prestigeBefore:node.prestigeCount,prestigeAfter:nextPrestige,totalEarnedAfter:nextEarned,etaAfter:eta,bulk:targetLevel>fromLevel+1};
              const child={levels:nextLevels,held:nextHeld,totalEarned:nextEarned,prestigeCount:nextPrestige,elapsed:localElapsed,spent:node.spent+cost,rate:candidate.rate,policy:candidate,path:node.path.concat(step),eta};generated.push(child);
              if(!best||eta<best.eta)best=child;
            }
          }
        }
        if(!generated.length)break;
        generated.sort((a,b)=>a.eta-b.eta||b.rate-a.rate||a.spent-b.spent);
        beam=generated.slice(0,beamWidth);
      }

      if(!best||!(best.eta<phaseStartEta*(1-minImprovement))){stopReason='marginal_no_gain';break}

      levels=best.levels.slice();held=best.held;totalEarned=best.totalEarned;prestigeCount=best.prestigeCount;elapsed+=best.elapsed;spent+=best.spent;
      const phaseSteps=best.path.map(x=>({...x,phase:phaseNo}));steps.push(...phaseSteps);
      const fixedAfter=fixedPolicy(policy,levels,held,totalEarned,prestigeCount)||best.policy;
      const phase={phase:phaseNo,startLevels:phaseStartLevels,endLevels:levels.slice(),startHeld:phaseStartHeld,endHeld:held,startPrestigeCount:phaseStartPrestige,endPrestigeCount:prestigeCount,prestigesDuring:prestigeCount-phaseStartPrestige,spend:best.spent,waitSeconds:best.elapsed,core:policy.core.slice(),slowdown:policy.slowdown,targetLevel:policy.targetLevel,actualPrestigeLevel:policy.actualPrestigeLevel,prestigeSchedule:(policy.prestigeSchedule||[]).map(x=>({...x})),cycleSeconds:policy.seconds,rateBefore:phaseStartRate,rateAfter:fixedAfter.rate,etaBefore:elapsed-best.elapsed+phaseStartEta,etaAfter:elapsed+finishEta(0,held,prestigeCount,fixedAfter),changes:aggregateChanges(best.path,phaseStartLevels)};
      phases.push(phase);

      policy=fullPolicy(levels,held,totalEarned,prestigeCount);if(!policy){stopReason='replan_failed';break}
      if(runsToGoal(held,prestigeCount,policy)===0){stopReason='requirement_reached';break}
      if(steps.length>=maxSteps){stopReason='search_limit';break}
    }

    const finalPlan=fullPolicy(levels,held,totalEarned,prestigeCount)||policy,plannedRunsRemaining=runsToGoal(held,prestigeCount,finalPlan);
    const plannedEta=elapsed+finalPlan.eta,timeSaved=Math.max(0,baselineEta-plannedEta),converged=stopReason==='marginal_no_gain'||stopReason==='requirement_reached';
    const finalPhasePlan={core:finalPlan.core.slice(),slowdown:finalPlan.slowdown,targetLevel:finalPlan.targetLevel,actualPrestigeLevel:finalPlan.actualPrestigeLevel,seconds:finalPlan.seconds,gain:finalPlan.gain,rate:finalPlan.rate,prestigeSchedule:(finalPlan.prestigeSchedule||[]).map(x=>({...x}))};
    return {steps,phases,targetLevels:levels.slice(),initialLevels,initialHeld,initialPrestigeCount,finalHeld:held,finalPrestigeCount:prestigeCount,spent,simulatedWaitSeconds:elapsed,postBootstrapState:postBootstrapInput,baselineEta,plannedEta,timeSaved,bootstrapSeconds:plan.bootstrap&&plan.bootstrap.needed?finite(plan.bootstrap.seconds):0,totalPlannedEta:plannedEta+(plan.bootstrap&&plan.bootstrap.needed?finite(plan.bootstrap.seconds):0),plannedRunsRemaining,stopReason,converged,nodesEvaluated,replans,finalRate:finalPlan.rate,finalTargetLevel:finalPlan.targetLevel,finalActualPrestigeLevel:finalPlan.actualPrestigeLevel,finalCycleSeconds:finalPlan.seconds,finalGain:finalPlan.gain,finalPrestigeSchedule:(finalPlan.prestigeSchedule||[]).map(x=>({...x})),finalPlan:finalPhasePlan};
  }

  function expectedRarityValueMultiplier(normalRareLevel,ingotLevels){
    const rarity=rarityState([0,0,0,normalRareLevel,0,0,0,0],ingotLevels),rv=ingotEffect(5,ingotLevels[5]);
    return rarity.pNormal+rarity.pRare*10*rv+rarity.pGem*20*rv+rarity.pOri*200*rv;
  }

  function rankingIncomeLog10(level,slowdown,core,ingot,totalEarned,normalRareLevel,expected=true){
    let log=baseOreValueLog10(level)+Math.log10(Math.max(1,slowdown))+Math.log10(coreEffect(0,core[0]))+Math.log10(ingotEffect(0,ingot[0]))+Math.log10(prestigePermanent(totalEarned));
    if(expected)log+=Math.log10(Math.max(1e-300,expectedRarityValueMultiplier(normalRareLevel,ingot)));
    return log;
  }

  function evaluateRankingCurve(curve,core,ingot,slowdown,cal,input){
    const duration=Math.max(60,finite(input.afkHours,8)*3600),available=Math.max(0,duration-finite(input.setupSeconds,0)),level=levelAtCalibratedTime(curve,cal,available),rare=curve.normalRareLevels?curve.normalRareLevels[level]:curve.normalAtTarget[3];
    const totalEarned=Math.max(0,finite(input.totalIngotsEarned)),normalLog=rankingIncomeLog10(level,slowdown,core,ingot,totalEarned,rare,false),expectedLog=rankingIncomeLog10(level,slowdown,core,ingot,totalEarned,rare,true);
    const events=Math.max(1e-12,curve.contactRates[level]||curve.contactRateAtTarget||1),window=Math.max(1,Math.min(60,available));
    return {level,normalScoreLog:normalLog+Math.log10(Math.max(1,events*window)),expectedScoreLog:expectedLog+Math.log10(Math.max(1,events*window)),incomeLog:expectedLog,eventsPerSec:events,topSpawn:curve.topSpawnRates[level]||0,rawTopSpawn:curve.rawTopSpawnRates[level]||0,queuePressure:curve.queuePressure[level]||0};
  }

  function optimizeRanking(input,measurements){
    const a=Math.max(0,Math.floor(finite(input.ascensionCount,7))),totalCore=Math.max(0,finite(input.totalCore,totalCoreForAscension(a))),ingot=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),cal=fitCalibration(measurements);
    const maxTarget=Math.max(1000,Math.floor(finite(input.rankingMaxLevel,10000))),searchInput={...input,ascensionCount:a,totalCore,ingotLevels:ingot,strictOneShot:false};
    let bootstrap=optimizeNormalAutoBootstrap(searchInput,totalCore,ingot,cal);if(!bootstrap)return {plan:null,calibration:cal,totalCore};
    const post=bootstrap.postState||searchInput,totalEarned=Math.max(0,finite(post.totalIngotsEarned));let best=null;
    // Core Ingot is deliberately zero: no Prestige occurs during the ranking sleep run.
    for(const cand of paretoCoreCandidates(totalCore,0)){
      for(const slowdown of slowdownCandidates(cand.core,ingot,cal.physicalCap)){
        const curve=simulateCurve({maxTarget,core:cand.core,ingot,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:totalEarned,dpsCalibration:post.dpsCalibration,hpCalibration:post.hpCalibration,normalAutoEnabled:true});
        const ev=evaluateRankingCurve(curve,cand.core,ingot,slowdown,cal,{...post,afkHours:input.afkHours,setupSeconds:bootstrap.seconds});
        const row={core:cand.core.slice(),coreUsed:cand.used,coreLeft:cand.left,ingot:ingot.slice(),slowdown,bootstrap,...ev,durationSeconds:Math.max(60,finite(input.afkHours,8)*3600)};
        if(!best||row.expectedScoreLog>best.expectedScoreLog+1e-12||(Math.abs(row.expectedScoreLog-best.expectedScoreLog)<1e-12&&row.normalScoreLog>best.normalScoreLog))best=row;
      }
    }
    return {plan:best,calibration:cal,totalCore,ascensionCount:a};
  }

  function optimizeRankingIngotUpgrades(input,rankingResult,measurements,maxSteps=48){
    const base=rankingResult&&rankingResult.plan;if(!base)return {steps:[],targetLevels:(input.ingotLevels||Array(8).fill(0)).slice(),spent:0};
    const cal=rankingResult.calibration||fitCalibration(measurements),totalCore=Math.max(0,finite(input.totalCore,totalCoreForAscension(input.ascensionCount))),duration=Math.max(60,finite(input.afkHours,8)*3600);
    let levels=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),held=Math.max(0,finite(input.heldIngots)),spent=0,steps=[],core=base.core.slice(),slowdown=base.slowdown,currentScore=base.expectedScoreLog;
    function fixedScore(candidateLevels){
      const curve=simulateCurve({maxTarget:Math.max(1000,Math.floor(finite(input.rankingMaxLevel,10000))),core,ingot:candidateLevels,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:input.dpsCalibration,hpCalibration:input.hpCalibration,normalAutoEnabled:true});
      return evaluateRankingCurve(curve,core,candidateLevels,slowdown,cal,{...input,afkHours:duration/3600}).expectedScoreLog;
    }
    for(let step=0;step<maxSteps;step++){
      let best=null;
      for(let i=0;i<8;i++){
        if(!canOptimizeIngot(i,levels[i]))continue;const cost=ingotNextCost(i,levels[i]);if(cost>held||cost<=0)continue;
        const next=levels.slice();next[i]++;const score=fixedScore(next),improvement=score-currentScore;
        if(improvement>1e-5&&(!best||improvement/best.cost>best.improvement/best.cost))best={index:i,cost,next,score,improvement};
      }
      if(!best)break;held-=best.cost;spent+=best.cost;levels=best.next;steps.push({index:best.index,name:INGOT.names[best.index],level:levels[best.index],cost:best.cost,scoreLogBefore:currentScore,scoreLogAfter:best.score,improvement:best.improvement});currentScore=best.score;
    }
    const finalResult=optimizeRanking({...input,totalCore,ingotLevels:levels,heldIngots:held,normalAutoUnlocked:true},measurements);
    return {steps,targetLevels:levels,spent,heldAfter:held,finalPlan:finalResult.plan};
  }

  function formatNumber(v){
    v=finite(v);const a=Math.abs(v);if(a>=1e21)return v.toExponential(3);if(a>=1e12)return (v/1e12).toFixed(a>=1e14?1:2)+'T';if(a>=1e9)return (v/1e9).toFixed(a>=1e11?1:2)+'B';if(a>=1e6)return (v/1e6).toFixed(a>=1e8?1:2)+'M';if(a>=1e3)return (v/1e3).toFixed(a>=1e5?1:2)+'K';return Number(v.toPrecision(5)).toString();
  }

  return {
    TERMINAL_ORES_PER_TOP,MAX_TOP_SPAWN_RATE,NORMAL_AUTO_UNLOCK_COST,OUTER_DAMAGE_FACTOR,ORE_MAX_CRUSH_SECONDS,EARLY_ORE_VALUE,EARLY_ORE_HP,NORMAL,INGOT,CORE_NAMES,CORE_FEED,SLOWDOWN,ASCENSION_INGOT_REQ,DEFAULT_INGOT_LEVELS,DEFAULT_CORE,DEFAULT_MEASUREMENTS,
    totalCoreForAscension,nextAscensionRequirement,coreCost,maxCoreLevel,coreEffect,coreBundleCost,ingotEffect,ingotNextCost,ingotCumulativeCost,ingotBundleCost,inferTotalIngotsEarned,normalEffect,requiredExpLog10,requiredExp,baseOreValueLog10,baseOreValue,baseOreHpLog10,baseOreHp,expectedTerminalPerTop,prestigeBase,prestigeGain,prestigePermanent,
    topSpawnRate,expectedUsefulExpPerTerminal,expectedRarityValueMultiplier,rankingIncomeLog10,dpsLog10,softCapHpLog,simulateCurve,deriveDpsCalibration,fitCalibration,mergePrestigeSchedule,prestigeScheduleFunding,planNormalAutoBootstrap,optimizeNormalAutoBootstrap,paretoCoreCandidates,slowdownCandidates,optimizeFixedCore,optimizeAscension,optimizeIngotUpgrades,optimizeRanking,optimizeRankingIngotUpgrades,formatNumber
  };
});
