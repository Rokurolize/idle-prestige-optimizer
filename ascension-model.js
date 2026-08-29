(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CrushAscensionOptimizer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // CRUSH FACTORY IDLE v1.0.4 / VRCW asset r80.
  // Runtime public variables are authoritative. The pre-Compression constants used by
  // the optimizer remain unchanged unless explicitly replaced below.
  // Deterministic constants are copied from the serialized GameBalanceConfig.
  const TERMINAL_ORES_PER_TOP=4.78640776699;
  const MAX_TOP_SPAWN_RATE=20;
  const AUTO_PRESTIGE_INTERVAL=1;
  const DEFAULT_NORMAL_AUTO_UPDATES_PER_SECOND=36.5;
  const NORMAL_AUTO_UNLOCK_COST=300;
  const OUTER_DAMAGE_FACTOR=.55;
  const ORE_MAX_CRUSH_SECONDS=30;
  const MAX_ZONE_ORES=120;
  const ORE_TIER_HP_MULTIPLIER=1.7;
  const ORICHALCUM_HP_MULTIPLIER=5;
  // CRUSH FACTORY IDLE r80 Singularity / Legacy constants reconstructed from the VRCW.
  const LEGACY_REQUIRED_ASCENSIONS=10;
  const COMPRESSION_UNLOCK_DISCARDED=50;
  const LEGACY_START_INGOT_CAP=50000000;
  const ASCENSION_MAX_COUNT=500;
  const COMPRESSION_INGOT_DENOMINATOR=11113200;
  const COMPRESSION_VOLUME_TARGET_LOG=80.552;
  const ORE_VOLUME=0.0137;
  const BOMB_RARITY_CHANCE=.0015;
  const THEORETICAL_TERMINAL_SALES_RATE=MAX_TOP_SPAWN_RATE*TERMINAL_ORES_PER_TOP;
  // 25-count-only Prestige baseline from the existing calibrated pre-Compression
  // model with the Ingot requirement already satisfied. A13+ settles at 13s/run
  // in the current calibration, i.e. 325s for the fixed 25-Prestige gate.
  const PRESTIGE_GATE_25_BASELINE=[35475,27125,24700,6775,5925,2950,2675,2700,450,450,350,325,400];
  const EARLY_ORE_VALUE=[.34362900744795793,.7815852169404028,1.3105059329561746,1.8874439058471755,2.6336507240647125,4.334184788359374,6.739939118696889,8.64958853566101,12.614196244526408,17.902398308642,22.353805455655674,29.87797330570841,36.47543009067704,44.98144004030895,54.27695961817204,71.38908553339408,83.15713010178953,98.80675152551989,121.69951279637111,155.74190634993846,179.04792344125858,226.8861523027345,274.21650214110684,338.40610263604486,391.76187426309815,478.9543738264224,544.5730505335307,647.0168185774196,836.2705248334939,1128.965208525217];
  const EARLY_ORE_HP=[3.1817500689625735,6.700833478569984,10.403218616288283,13.873276162764121,17.9241842965422,27.312716109228543,39.32689740411166,46.73103549562652,63.102386425178636,82.92274317661239,95.87164000899627,118.64954280154458,134.11939945868374,153.14427918138173,171.10361290397313,208.37793555095277,224.74790357817605,247.26293639376246,281.99245297401126,334.1414682506974,355.68899086797006,417.335538934803,467.0326151928781,533.664181259924,572.0424810465383,647.5547612500976,681.733675505318,749.9812678778437,897.5484077181289,1121.9355096476613];
  const EARLY_ORE_VALUE_LOG=EARLY_ORE_VALUE.map(Math.log10),EARLY_ORE_HP_LOG=EARLY_ORE_HP.map(Math.log10),LOG_EXP_GROWTH=Math.log10(1.36),LOG_VALUE_GROWTH=Math.log10(1.35),LOG_HP_GROWTH=Math.log10(1.25),LOG_VALUE_BASE=Math.log10(.13888888888888887),LOG_HP_BASE=Math.log10(1.3888888888888888),LOG_REQUIRED_EXP_BASE=Math.log10(8),TERMINAL_PER_TOP_MID=(.45+1.6)/.85;

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
  const NORMAL_BASE_COST_LOG10=NORMAL.baseCost.map(Math.log10);
  const NORMAL_COST_RATE_LOG10=NORMAL.costRate.map(Math.log10);
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
  for(let p=5;p<=42;p++)SLOWDOWN.push(Math.pow(10,p));
  const CORE_FEED=SLOWDOWN.slice();
  const ASCENSION_INGOT_REQ=[250,50000,500000,5000000,50000000,250000000,2500000000,10000000000,50000000000,350000000000,800000000000,6000000000000,20000000000000,80000000000000,400000000000000,2e15,5e15,7e15,3e16,9e16,5e17,2e18,5e18,2e19,7e19,3e20,9e20,4e21,2e22,5e22,3e23,8e23,3e24,9e24,4e25,2e26,5e26,2e27,7e27,3e28,8e28,3e29,9e30,4e30,2e31,5e31,2e32,7e32,3e33,8e33,3e34,2e35,4e35,2e36,5e36,2e37,7e37,3e38,9e38,4e39,2e40,4e40,2e41,6e41,2e42,7e42,3e43,9e43,3e44,2e45,4e45,2e46,5e46,2e47,7e47,3e48,9e48,3e49,2e50,4e50,2e51,6e51,2e52,7e52,3e53,9e53,4e54,2e55,6e55,2e56,6e56,2e57,7e57,3e58,9e58,4e59,2e60,4e60,2e61,9.9e63];

  const DEFAULT_INGOT_LEVELS=[24,29,24,29,10,23,17,23];
  const DEFAULT_CORE=[6,9,7,5,6];
  const A18_VIDEO_CORE=[25,28,22,9,16];
  const A18_VIDEO_INGOT=[49,49,49,49,0,43,17,43];
  const A18_VIDEO_TOTAL_INGOTS=3131409116037315;
  const DEFAULT_MEASUREMENTS=[
    {targetLevel:460,seconds:38,slowdown:2000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×2K Lv460'},
    {targetLevel:695,seconds:51.21,slowdown:2000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×2K Lv695'},
    {targetLevel:995,seconds:73,slowdown:2000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×2K Lv995'},
    {targetLevel:460,seconds:59.4,slowdown:10000,core:DEFAULT_CORE.slice(),ingot:DEFAULT_INGOT_LEVELS.slice(),totalIngotsEarned:2e9,label:'A7 ×10K Lv460'},
    // 30 fps video 2026-08-26 10-03-34.mp4. Complete reset-to-reset run:
    // reset at 89.5 s, Lv4421 at 316.5 s => 227.0 s. Intermediate
    // milestones pin the shape rather than only applying a single end-point fudge.
    {targetLevel:1000,seconds:52,slowdown:1e12,core:A18_VIDEO_CORE.slice(),ingot:A18_VIDEO_INGOT.slice(),totalIngotsEarned:A18_VIDEO_TOTAL_INGOTS,label:'A18 video ×1T Lv1000'},
    {targetLevel:2000,seconds:101,slowdown:1e12,core:A18_VIDEO_CORE.slice(),ingot:A18_VIDEO_INGOT.slice(),totalIngotsEarned:A18_VIDEO_TOTAL_INGOTS,label:'A18 video ×1T Lv2000'},
    {targetLevel:2365,seconds:119,slowdown:1e12,core:A18_VIDEO_CORE.slice(),ingot:A18_VIDEO_INGOT.slice(),totalIngotsEarned:A18_VIDEO_TOTAL_INGOTS,label:'A18 video ×1T Lv2365'},
    {targetLevel:3000,seconds:152,slowdown:1e12,core:A18_VIDEO_CORE.slice(),ingot:A18_VIDEO_INGOT.slice(),totalIngotsEarned:A18_VIDEO_TOTAL_INGOTS,label:'A18 video ×1T Lv3000'},
    {targetLevel:3500,seconds:177.5,slowdown:1e12,core:A18_VIDEO_CORE.slice(),ingot:A18_VIDEO_INGOT.slice(),totalIngotsEarned:A18_VIDEO_TOTAL_INGOTS,label:'A18 video ×1T Lv3500'},
    {targetLevel:4000,seconds:202.5,slowdown:1e12,core:A18_VIDEO_CORE.slice(),ingot:A18_VIDEO_INGOT.slice(),totalIngotsEarned:A18_VIDEO_TOTAL_INGOTS,label:'A18 video ×1T Lv4000'},
    {targetLevel:4420,seconds:227,slowdown:1e12,core:A18_VIDEO_CORE.slice(),ingot:A18_VIDEO_INGOT.slice(),totalIngotsEarned:A18_VIDEO_TOTAL_INGOTS,label:'A18 video ×1T Lv4420'}
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
  function slowdownLevel(multiplier){const v=finite(multiplier,NaN);if(!(v>=1))return -1;for(let i=0;i<SLOWDOWN.length;i++)if(Math.abs(SLOWDOWN[i]-v)<=Math.max(1,Math.abs(v))*1e-12)return i;return -1}
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
    budget=Math.max(0,finite(budget));
    if(index===4){let lo=0,hi=CORE_FEED_CUM.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(coreCost(index,mid)<=budget)lo=mid;else hi=mid-1}return lo}
    if(index===3)return Math.min(9,Math.max(0,Math.floor(Math.log2(budget+1))));
    if(index===0||index===1)return Math.min(1023,Math.max(0,Math.floor(Math.log2(budget+1))));
    if(index===2)return Math.min(1023,Math.max(0,Math.floor(Math.log2(budget/2+1))));
    return 0;
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
  function normalizeCore(levels){return Array.from({length:5},(_,i)=>Math.max(0,Math.floor(finite(levels&&levels[i]))))}
  function coreReallocationPlan(fromLevels,toLevels){
    const from=normalizeCore(fromLevels),to=normalizeCore(toLevels);if(from.every((v,i)=>v===to[i]))return {method:'none',from,to,levelClicks:0,actionClicks:0,clicks:0};
    const directLevelClicks=from.reduce((s,v,i)=>s+Math.abs(v-to[i]),0),direct={method:'individual',from,to,levelClicks:directLevelClicks,actionClicks:1,clicks:directLevelClicks+1};
    const resetLevelClicks=to.reduce((s,v)=>s+v,0),reset={method:'reset-all',from,to,levelClicks:resetLevelClicks,actionClicks:2,clicks:resetLevelClicks+2};
    return reset.clicks<direct.clicks?reset:direct;
  }
  function prestigeInteractionPlan(runCore,prestigeCore,runs,clicksPerSecond=4,returnAfterLast=false,includeAscend=false){
    runs=Math.max(0,Math.floor(finite(runs)));const rate=Math.max(.1,finite(clicksPerSecond,4)),toPrestige=coreReallocationPlan(runCore,prestigeCore),toRun=coreReallocationPlan(prestigeCore,runCore),returnRuns=runs>0?(returnAfterLast?runs:runs-1):0;
    const coreLevelClicks=runs*toPrestige.levelClicks+returnRuns*toRun.levelClicks,coreActionClicks=runs*toPrestige.actionClicks+returnRuns*toRun.actionClicks,prestigeActionClicks=2*runs,ascendActionClicks=includeAscend?1:0,levelClicks=coreLevelClicks,actionClicks=coreActionClicks+prestigeActionClicks+ascendActionClicks,clicks=levelClicks+actionClicks;
    return {runs,toPrestige,toRun,returnAfterLast,includeAscend,levelClicks,actionClicks,coreLevelClicks,coreActionClicks,prestigeActionClicks,ascendActionClicks,clicks,seconds:clicks/rate,clicksPerSecond:rate};
  }
  function ascensionInteractionPlan(runCore,prestigeCore,runs,clicksPerSecond=4){return prestigeInteractionPlan(runCore,prestigeCore,runs,clicksPerSecond,false,true)}
  function prestigeScheduleInteractionPlan(runCore,schedule,clicksPerSecond=4,includeAscend=true){
    const rate=Math.max(.1,finite(clicksPerSecond,4)),base=normalizeCore(runCore),parts=(schedule||[]).filter(x=>Math.max(0,Math.floor(finite(x&&x.runs)))>0);let current=base.slice(),levelClicks=0,coreActionClicks=0,prestigeActionClicks=0;
    const add=(plan,times=1)=>{times=Math.max(0,Math.floor(finite(times)));levelClicks+=plan.levelClicks*times;coreActionClicks+=plan.actionClicks*times};
    for(let i=0;i<parts.length;i++){
      const part=parts[i],runs=Math.max(0,Math.floor(finite(part.runs))),partRun=normalizeCore(part.runCore||base),partPrestige=normalizeCore(part.prestigeCore||partRun),lastPart=i===parts.length-1;
      add(coreReallocationPlan(current,partRun));const toPrestige=coreReallocationPlan(partRun,partPrestige),toRun=coreReallocationPlan(partPrestige,partRun);add(toPrestige,runs);add(toRun,lastPart?Math.max(0,runs-1):runs);prestigeActionClicks+=2*runs;current=(lastPart?partPrestige:partRun).slice();
    }
    const ascendActionClicks=includeAscend?1:0,actionClicks=coreActionClicks+prestigeActionClicks+ascendActionClicks,clicks=levelClicks+actionClicks,primary=parts.find(x=>x.role!=='count')||parts[0],primaryPrestige=normalizeCore(primary&&primary.prestigeCore||base);
    return {runs:parts.reduce((s,x)=>s+Math.max(0,Math.floor(finite(x.runs))),0),toPrestige:coreReallocationPlan(base,primaryPrestige),toRun:coreReallocationPlan(primaryPrestige,base),includeAscend,levelClicks,actionClicks,coreLevelClicks:levelClicks,coreActionClicks,prestigeActionClicks,ascendActionClicks,clicks,seconds:clicks/rate,clicksPerSecond:rate};
  }
  function slowdownReallocationPlan(fromLevel,toMultiplier){
    const from=Math.max(0,Math.floor(finite(fromLevel))),to=Math.max(0,slowdownLevel(toMultiplier));if(from===to)return {fromLevel:from,toLevel:to,levelClicks:0,actionClicks:0,clicks:0};const levelClicks=Math.abs(to-from),actionClicks=1;return {fromLevel:from,toLevel:to,levelClicks,actionClicks,clicks:levelClicks+actionClicks};
  }

  function ingotEffect(index,level){
    level=Math.max(0,Math.floor(finite(level)));
    const per=INGOT.per[index],q=INGOT.quad[index],v=per*level+per*q*level*level;
    if(index<=3||index===5)return 1+v;
    if(index===4)return Math.min(1,.1*level); // displayed percentage points; scene cap is 1.0%.
    if(index===6)return Math.max(.01,1-v); // Crusher clamps the applied stall-duration multiplier to 0.01.
    if(index===7)return Math.min(100,level); // percentage points.
    return 1;
  }
  function ingotNextCost(index,level){return Math.ceil(INGOT.baseCost[index]*Math.pow(2,Math.max(0,Math.floor(finite(level)))))}
  function ingotCumulativeCost(index,level){level=Math.max(0,Math.floor(finite(level)));return INGOT.baseCost[index]*(Math.pow(2,level)-1)}
  function ingotBundleCost(levels){return levels.reduce((s,l,i)=>s+ingotCumulativeCost(i,l),0)}
  function inferTotalIngotsEarned(held,levels,normalAutoUnlocked=true){
    return Math.max(0,finite(held))+ingotBundleCost(levels||Array(8).fill(0))+(normalAutoUnlocked===false?0:NORMAL_AUTO_UNLOCK_COST);
  }

  function legacyStartIngot(discardedAscensions){
    const d=Math.max(0,Math.floor(finite(discardedAscensions)));
    return Math.min(2*d*d*d,LEGACY_START_INGOT_CAP);
  }
  function afterAscensionState(state){
    const s=state||{},a=Math.max(0,Math.floor(finite(s.ascensionCount))),next=Math.min(ASCENSION_MAX_COUNT,a+1),discarded=Math.max(0,Math.floor(finite(s.discardedAscensions)));
    const start=legacyStartIngot(discarded);return {...s,ascensionCount:next,heldIngots:start,totalIngotsEarned:start,prestigeCount:0,normalAutoUnlocked:false,ingotLevels:Array(8).fill(0)};
  }
  function compressionUnlocked(discardedAscensions){return Math.max(0,Math.floor(finite(discardedAscensions)))>=COMPRESSION_UNLOCK_DISCARDED}
  function compressionE(bestLevel,discardedAscensions){
    const best=Math.max(0,finite(bestLevel)),discarded=Math.max(0,finite(discardedAscensions));
    return Math.pow(10,best/7500)/185*Math.sqrt(discarded/50)+best/1500;
  }
  function compressionCurveOptions(input){
    const enabled=!!(input&&input.compressionEnabled)&&compressionUnlocked(input&&input.discardedAscensions),e=enabled?Math.max(0,finite(input&&input.compressionE,compressionE(input&&input.maxLevelEver,input&&input.discardedAscensions))):0,required=Math.max(0,finite(input&&input.nextRequirement,nextAscensionRequirement(input&&input.ascensionCount)));
    return {compressionEnabled:enabled,compressionE:e,compressionRequiredIngots:required};
  }
  function compressionRarityState(rarePercent=100,gemPercent=1,orichalcumPercent=0){
    const gem=clamp(finite(gemPercent)/100,0,1),rare=clamp(finite(rarePercent)/100,0,1),ori=clamp(finite(orichalcumPercent)/100,0,1),pGem=gem,afterGem=1-gem,pOri=afterGem*rare*ori,pRare=afterGem*rare*(1-ori),pNormal=afterGem*(1-rare);
    return {pGem,pOri,pRare,pNormal};
  }
  function compressionRarityValueMultiplier(rarePercent=100,gemPercent=1,orichalcumPercent=0){
    const p=compressionRarityState(rarePercent,gemPercent,orichalcumPercent);
    return p.pNormal+p.pGem*20+p.pRare*10+p.pOri*200;
  }
  function compressionExpectedIngotPerOreFromState(requiredIngots,p){
    const req=Math.max(0,finite(requiredIngots)),reward=m=>Math.max(1,req*m/COMPRESSION_INGOT_DENOMINATOR);
    return p.pNormal*reward(1)+p.pGem*reward(20)+p.pRare*reward(10)+p.pOri*reward(200);
  }
  function compressionExpectedIngotPerOre(requiredIngots,rarePercent=100,gemPercent=1,orichalcumPercent=0){return compressionExpectedIngotPerOreFromState(requiredIngots,compressionRarityState(rarePercent,gemPercent,orichalcumPercent))}
  function compressionDirectIngotPlan(opts={}){
    const a=Math.max(0,Math.floor(finite(opts.ascensionCount))),discarded=Math.max(0,Math.floor(finite(opts.discardedAscensions))),required=Math.max(1,finite(opts.requiredIngots,nextAscensionRequirement(a))),terminalRate=Math.max(1e-12,finite(opts.terminalSalesPerSecond,15.75)),rarePercent=clamp(finite(opts.rarePercent,100),0,100),gemTarget=Math.max(0,Math.min(10,Math.floor(finite(opts.gemLevel,10)))),start=legacyStartIngot(discarded);
    let held=start,seconds=0,gem=0,ori=0,best=null;
    const rate=()=>terminalRate*compressionExpectedIngotPerOre(required,rarePercent,ingotEffect(4,gem),ingotEffect(7,ori));
    const buy=cost=>{if(held+1e-12<cost){seconds+=(cost-held)/Math.max(1e-12,rate());held=cost}held-=cost};
    for(;gem<gemTarget;gem++)buy(ingotNextCost(4,gem));
    for(;;){
      const finish=seconds+(held<required?(required-held)/Math.max(1e-12,rate()):0),gemPercent=ingotEffect(4,gem),oriPercent=ingotEffect(7,ori),row={seconds:finish,ascensionCount:a,discardedAscensions:discarded,requiredIngots:required,startIngot:start,gemLevel:gemTarget,orichalcumLevel:ori,rarePercent,gemPercent,orichalcumPercent:oriPercent,rarityValueMultiplier:compressionRarityValueMultiplier(rarePercent,gemPercent,oriPercent),expectedIngotPerOre:compressionExpectedIngotPerOre(required,rarePercent,gemPercent,oriPercent),terminalSalesPerSecond:terminalRate};
      if(!best||row.seconds<best.seconds-1e-9||(Math.abs(row.seconds-best.seconds)<1e-9&&row.orichalcumLevel<best.orichalcumLevel))best=row;
      if(ori>=100)break;buy(ingotNextCost(7,ori));ori++;
    }
    return best;
  }
  function compressionLevelPushPlan(opts={}){
    const discarded=Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(finite(opts.discardedAscensions,COMPRESSION_UNLOCK_DISCARDED))),initialBest=Math.max(0,Math.floor(finite(opts.initialBestLevel))),target=Math.max(1,Math.floor(finite(opts.targetLevel,10000))),terminalRate=Math.max(1e-12,finite(opts.terminalSalesPerSecond,15.75)),rarePercent=clamp(finite(opts.rarePercent,100),0,100),slowdown=Math.max(1,finite(opts.slowdown,SLOWDOWN[SLOWDOWN.length-1])),gemLevel=Math.max(0,Math.min(10,Math.floor(finite(opts.gemLevel,10)))),oriLevel=100,required=Math.max(1,finite(opts.requiredIngots,nextAscensionRequirement(ASCENSION_MAX_COUNT))),start=legacyStartIngot(discarded);
    if(target<=1)return {seconds:0,setupSeconds:0,pushSeconds:0,targetLevel:target,expLevel:0,rareValueLevel:0,feedLevel:0,slowdown,terminalSalesPerSecond:terminalRate};
    const coreFeed=coreEffect(4,maxCoreLevel(4,totalCoreForAscension(ASCENSION_MAX_COUNT))),normalFeed=normalEffect(7,NORMAL.max[7]),terminalPerTop=expectedTerminalPerTop(target),neededTop=terminalRate/Math.max(1e-12,terminalPerTop),neededIngotFeed=neededTop*slowdown/Math.max(1e-12,.6*normalFeed*coreFeed);let feedLevel=0;while(feedLevel<INGOT.optimizerCap[3]&&ingotEffect(3,feedLevel)+1e-12<neededIngotFeed)feedLevel++;
    const fixedCost=ingotCumulativeCost(3,feedLevel)+ingotCumulativeCost(4,gemLevel)+ingotCumulativeCost(6,INGOT.optimizerCap[6])+ingotCumulativeCost(7,oriLevel),lateIngotRate=terminalRate*compressionExpectedIngotPerOre(required,rarePercent,ingotEffect(4,gemLevel),ingotEffect(7,oriLevel)),rarity=compressionRarityState(rarePercent,ingotEffect(4,gemLevel),ingotEffect(7,oriLevel)),log125=Math.log10(.125);
    const baseDeficit=new Float64Array(target+1);
    for(let level=1;level<target;level++){const best=Math.max(initialBest,level);baseDeficit[level]=baseOreValueLog10(level)+Math.log10(slowdown)+compressionE(best,discarded)+log125-requiredExpLog10(level)}
    const candidates=[0,200,400,600,700,750,800,825,850,875,890,900,910,920,925,930,935,940,945,950,955,960,970,980,1000,1023].filter(x=>x<=INGOT.optimizerCap[1]);let best=null;
    const work=d=>d>=0?1:(d<-323?0:Math.pow(10,d));
    for(const expLevel of candidates){const expLog=Math.log10(Math.max(1e-300,ingotEffect(1,expLevel)));
      for(const rareValueLevel of candidates){const rv=ingotEffect(5,rareValueLevel),normalLog=expLog,rareLog=expLog+Math.log10(10*rv),gemLog=expLog+Math.log10(20*rv),oriLog=expLog+Math.log10(200*rv),setupCost=fixedCost+ingotCumulativeCost(1,expLevel)+ingotCumulativeCost(5,rareValueLevel),setupSeconds=Math.max(0,setupCost-start)/Math.max(1e-12,lateIngotRate);let pushSeconds=0;
        for(let level=1;level<target;level++){const d=baseDeficit[level],useful=Math.max(1e-12,rarity.pNormal*work(d+normalLog)+rarity.pRare*work(d+rareLog)+rarity.pGem*work(d+gemLog)+rarity.pOri*work(d+oriLog));pushSeconds+=1/(terminalRate*useful)}
        const row={seconds:setupSeconds+pushSeconds,setupSeconds,pushSeconds,targetLevel:target,initialBestLevel:initialBest,discardedAscensions:discarded,expLevel,rareValueLevel,feedLevel,gemLevel,orichalcumLevel:oriLevel,slowdown,terminalSalesPerSecond:terminalRate,setupCost,expectedDirectIngotPerOre:compressionExpectedIngotPerOre(required,rarePercent,ingotEffect(4,gemLevel),ingotEffect(7,oriLevel))};if(!best||row.seconds<best.seconds)best=row;
      }
    }
    return best;
  }
  function compressionVolumeLog(bestLevel,discardedAscensions,totalCrushLog=0){return finite(totalCrushLog)+Math.log10(ORE_VOLUME)+compressionE(bestLevel,discardedAscensions)}
  function observableUniverseBestLevel(discardedAscensions,totalCrushLog=0){
    const d=Math.max(0,finite(discardedAscensions)),crush=finite(totalCrushLog);if(compressionVolumeLog(0,d,crush)>=COMPRESSION_VOLUME_TARGET_LOG)return 0;
    let lo=0,hi=1000;while(hi<1000000&&compressionVolumeLog(hi,d,crush)<COMPRESSION_VOLUME_TARGET_LOG)hi*=2;
    while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(compressionVolumeLog(mid,d,crush)>=COMPRESSION_VOLUME_TARGET_LOG)hi=mid;else lo=mid}return hi;
  }
  function prestigeGateBaselineSeconds(ascensionCount,scale=1){
    const a=Math.max(0,Math.floor(finite(ascensionCount))),base=a<PRESTIGE_GATE_25_BASELINE.length?PRESTIGE_GATE_25_BASELINE[a]:325;
    return Math.max(25,base*Math.max(.01,finite(scale,1)));
  }
  function compressionAscensionEstimate(opts={}){
    const a=Math.max(0,Math.floor(finite(opts.ascensionCount))),discarded=Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(finite(opts.discardedAscensions,COMPRESSION_UNLOCK_DISCARDED))),direct=compressionDirectIngotPlan({...opts,ascensionCount:a,discardedAscensions:discarded}),gate=prestigeGateBaselineSeconds(a,opts.prestigeGateScale);
    return {...direct,prestigeGateSeconds:gate,overlapSeconds:Math.max(gate,direct.seconds),sequentialSeconds:gate+direct.seconds};
  }
  function compressionCycleEstimate(discardedAscensions,count=ASCENSION_MAX_COUNT,opts={}){
    const d=Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(finite(discardedAscensions,COMPRESSION_UNLOCK_DISCARDED))),n=Math.max(0,Math.min(ASCENSION_MAX_COUNT,Math.floor(finite(count,ASCENSION_MAX_COUNT))));
    let overlapSeconds=0,sequentialSeconds=0,directSeconds=0,prestigeGateSeconds=0;const samples=[];
    for(let a=0;a<n;a++){
      const row=compressionAscensionEstimate({...opts,ascensionCount:a,discardedAscensions:d});overlapSeconds+=row.overlapSeconds;sequentialSeconds+=row.sequentialSeconds;directSeconds+=row.seconds;prestigeGateSeconds+=row.prestigeGateSeconds;
      if(a<6||a===10||a===20||a===50||a===100||a===250||a===499)samples.push(row);
    }
    return {discardedAscensions:d,count:n,overlapSeconds,sequentialSeconds,directSeconds,prestigeGateSeconds,samples};
  }
  function compressionRouteEstimate(initialDiscarded,extraLegacyCycles,opts={}){
    let discarded=Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(finite(initialDiscarded,COMPRESSION_UNLOCK_DISCARDED))),prepOverlap=0,prepSequential=0;
    for(const count of extraLegacyCycles||[]){const cycle=compressionCycleEstimate(discarded,count,opts);prepOverlap+=cycle.overlapSeconds;prepSequential+=cycle.sequentialSeconds;discarded+=count}
    const finalCycle=compressionCycleEstimate(discarded,ASCENSION_MAX_COUNT,opts),afterA500LegacyDiscarded=discarded+ASCENSION_MAX_COUNT,totalCrushLog=finite(opts.totalCrushLog,0),observableBestLevel=observableUniverseBestLevel(afterA500LegacyDiscarded,totalCrushLog),levelTarget=Math.max(10000,observableBestLevel),currentBestLevel=Math.max(0,Math.floor(finite(opts.bestLevel))),levelPush=compressionLevelPushPlan({discardedAscensions:discarded,initialBestLevel:currentBestLevel,targetLevel:levelTarget,terminalSalesPerSecond:opts.terminalSalesPerSecond,rarePercent:opts.rarePercent,gemLevel:opts.gemLevel});
    return {initialDiscarded:Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(finite(initialDiscarded,COMPRESSION_UNLOCK_DISCARDED))),finalCycleDiscarded:discarded,extraLegacyCycles:(extraLegacyCycles||[]).slice(),prepOverlapSeconds:prepOverlap,prepSequentialSeconds:prepSequential,finalCycleOverlapSeconds:finalCycle.overlapSeconds,finalCycleSequentialSeconds:finalCycle.sequentialSeconds,levelPush,afterA500LegacyDiscarded,observableBestLevel,levelTarget,currentBestLevel,completionOverlapSeconds:prepOverlap+finalCycle.overlapSeconds+levelPush.seconds,completionSequentialSeconds:prepSequential+finalCycle.sequentialSeconds+levelPush.seconds,observableReadyAtCurrentBest:compressionVolumeLog(currentBestLevel,afterA500LegacyDiscarded,totalCrushLog)>=COMPRESSION_VOLUME_TARGET_LOG};
  }
  function optimizeCompressionPreparation(opts={}){
    const initial=Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(finite(opts.discardedAscensions,COMPRESSION_UNLOCK_DISCARDED))),maxUseful=Math.max(initial,293),prefixCache=new Map(),terminalSalesPerSecond=Math.max(1e-12,finite(opts.terminalSalesPerSecond,15.75)),rarePercent=clamp(finite(opts.rarePercent,100),0,100),gemLevel=Math.max(0,Math.min(10,Math.floor(finite(opts.gemLevel,10)))),routeOpts={...opts,terminalSalesPerSecond,rarePercent,gemLevel};
    const prefix=d=>{if(prefixCache.has(d))return prefixCache.get(d);const overlap=[0],sequential=[0];let so=0,ss=0;for(let a=0;a<ASCENSION_MAX_COUNT;a++){const r=compressionAscensionEstimate({...routeOpts,ascensionCount:a,discardedAscensions:d});so+=r.overlapSeconds;ss+=r.sequentialSeconds;overlap.push(so);sequential.push(ss)}const p={overlap,sequential};prefixCache.set(d,p);return p};
    const floorCycle=prefix(maxUseful).overlap[ASCENSION_MAX_COUNT],dp=new Map([[initial,{seconds:0,path:[]}]]);let best=null;
    for(let d=initial;d<=maxUseful;d++){
      const state=dp.get(d);if(!state)continue;if(best&&state.seconds+floorCycle>=best.completionOverlapSeconds-1e-9)continue;
      const p=prefix(d),after=d+ASCENSION_MAX_COUNT,totalCrushLog=finite(routeOpts.totalCrushLog,0),target=Math.max(10000,observableUniverseBestLevel(after,totalCrushLog)),levelPush=compressionLevelPushPlan({discardedAscensions:d,initialBestLevel:routeOpts.bestLevel,targetLevel:target,terminalSalesPerSecond,rarePercent,gemLevel}),completion=state.seconds+p.overlap[ASCENSION_MAX_COUNT]+levelPush.seconds;
      if(!best||completion<best.completionOverlapSeconds)best={completionOverlapSeconds:completion,prepOverlapSeconds:state.seconds,finalCycleOverlapSeconds:p.overlap[ASCENSION_MAX_COUNT],finalCycleDiscarded:d,extraLegacyCycles:state.path.slice(),levelPush,afterA500LegacyDiscarded:after,observableBestLevel:target>10000?target:observableUniverseBestLevel(after,totalCrushLog),levelTarget:target};
      for(let k=LEGACY_REQUIRED_ASCENSIONS;k<=maxUseful-d;k++){const nd=d+k,next=state.seconds+p.overlap[k],prev=dp.get(nd);if(!prev||next<prev.seconds)dp.set(nd,{seconds:next,path:state.path.concat(k)})}
    }
    const chosen=best||compressionRouteEstimate(initial,[],routeOpts),sequential=compressionRouteEstimate(initial,chosen.extraLegacyCycles,routeOpts),currentBestLevel=Math.max(0,Math.floor(finite(routeOpts.bestLevel))),observableReadyAtCurrentBest=compressionVolumeLog(currentBestLevel,chosen.afterA500LegacyDiscarded,finite(routeOpts.totalCrushLog,0))>=COMPRESSION_VOLUME_TARGET_LOG;
    return {initialDiscarded:initial,overlap:{seconds:chosen.completionOverlapSeconds,prepSeconds:chosen.prepOverlapSeconds,finalCycleSeconds:chosen.finalCycleOverlapSeconds,finalCycleDiscarded:chosen.finalCycleDiscarded,extraLegacyCycles:chosen.extraLegacyCycles.slice()},sequential:{seconds:sequential.completionSequentialSeconds,prepSeconds:sequential.prepSequentialSeconds,finalCycleSeconds:sequential.finalCycleSequentialSeconds,finalCycleDiscarded:sequential.finalCycleDiscarded,extraLegacyCycles:sequential.extraLegacyCycles.slice()},afterA500LegacyDiscarded:chosen.afterA500LegacyDiscarded,observableBestLevel:chosen.observableBestLevel,levelTarget:chosen.levelTarget,currentBestLevel,observableReadyAtCurrentBest,terminalSalesPerSecond,theoreticalTerminalSalesPerSecond:THEORETICAL_TERMINAL_SALES_RATE,rarePercent,gemLevel,levelPush:chosen.levelPush,completionOverlapSeconds:chosen.completionOverlapSeconds,completionSequentialSeconds:sequential.completionSequentialSeconds};
  }
  function optimizeLegacyPartitions(opts={}){
    const startDiscarded=Math.max(0,Math.floor(finite(opts.discardedAscensions))),startAscension=Math.max(0,Math.floor(finite(opts.currentAscension))),unlock=Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(finite(opts.unlockDiscarded,COMPRESSION_UNLOCK_DISCARDED))),maxTarget=Math.max(LEGACY_REQUIRED_ASCENSIONS,Math.floor(finite(opts.maxLegacyTarget,ASCENSION_MAX_COUNT))),ascensionCost=typeof opts.ascensionCost==='function'?opts.ascensionCost:()=>Infinity,continuationCost=typeof opts.continuationCost==='function'?opts.continuationCost:()=>0,continuationFloor=Math.max(0,finite(opts.continuationFloor,0)),memo=new Map();
    function solve(discarded,current,isInitial){
      const key=discarded+'|'+current+'|'+(isInitial?1:0),cached=memo.get(key);if(cached)return cached;
      let best=null,segment=0;
      for(let target=current;target<=maxTarget;target++){
        if(target>current){const edge=ascensionCost(target-1,discarded,isInitial&&target-1===current);if(!Number.isFinite(edge))break;segment+=edge}
        if(target<LEGACY_REQUIRED_ASCENSIONS)continue;
        const nextDiscarded=discarded+target;let tail;if(nextDiscarded>=unlock)tail={seconds:continuationCost(nextDiscarded),legacyTargets:[]};else tail=solve(nextDiscarded,0,false);
        if(!tail||!Number.isFinite(tail.seconds))continue;const row={seconds:segment+tail.seconds,legacyTargets:[target].concat(tail.legacyTargets),unlockDiscarded:tail.unlockDiscarded||nextDiscarded};if(!best||row.seconds<best.seconds)best=row;
        if(best&&segment+continuationFloor>=best.seconds-1e-9)break;
      }
      memo.set(key,best);return best;
    }
    return solve(startDiscarded,startAscension,true);
  }
  function normalEffect(index,level){level=Math.max(0,Math.floor(finite(level)));return NORMAL.base[index]+NORMAL.per[index]*level+NORMAL.per[index]*NORMAL.quad[index]*level*level}
  const normalEffectLogCache=Array.from({length:8},()=>[]);
  function normalEffectLog10(index,level){level=Math.max(0,Math.floor(finite(level)));const cache=normalEffectLogCache[index];if(cache[level]!==undefined)return cache[level];const value=Math.log10(Math.max(1e-300,normalEffect(index,level)));cache[level]=value;return value}
  const levelGeometryCache={max:0,requiredExpLog:new Float64Array(1),valueLog:new Float64Array(1),hpLog:new Float64Array(1),terminalPerTop:new Float64Array(1),tier:new Uint8Array(1)};
  function ensureLevelGeometry(maxLevel){
    maxLevel=Math.max(1,Math.floor(finite(maxLevel,1)));if(levelGeometryCache.max>=maxLevel)return levelGeometryCache;
    const requiredExpLog=new Float64Array(maxLevel+1),valueLog=new Float64Array(maxLevel+1),hpLog=new Float64Array(maxLevel+1),terminalPerTop=new Float64Array(maxLevel+1),tier=new Uint8Array(maxLevel+1),old=levelGeometryCache.max;
    requiredExpLog.set(levelGeometryCache.requiredExpLog);valueLog.set(levelGeometryCache.valueLog);hpLog.set(levelGeometryCache.hpLog);terminalPerTop.set(levelGeometryCache.terminalPerTop);tier.set(levelGeometryCache.tier);
    for(let level=Math.max(1,old+1);level<=maxLevel;level++){
      let req=LOG_REQUIRED_EXP_BASE+level*LOG_EXP_GROWTH;if(level<10)req-=Math.log10(5-.4*level);requiredExpLog[level]=req;
      valueLog[level]=level<=EARLY_ORE_VALUE_LOG.length?EARLY_ORE_VALUE_LOG[level-1]:LOG_VALUE_BASE+level*LOG_VALUE_GROWTH;
      hpLog[level]=level<=EARLY_ORE_HP_LOG.length?EARLY_ORE_HP_LOG[level-1]:LOG_HP_BASE+level*LOG_HP_GROWTH;
      terminalPerTop[level]=level>=15?TERMINAL_ORES_PER_TOP:(level>=5?TERMINAL_PER_TOP_MID:1);
      tier[level]=level>=15?2:(level>=5?1:0);
    }
    levelGeometryCache.max=maxLevel;levelGeometryCache.requiredExpLog=requiredExpLog;levelGeometryCache.valueLog=valueLog;levelGeometryCache.hpLog=hpLog;levelGeometryCache.terminalPerTop=terminalPerTop;levelGeometryCache.tier=tier;return levelGeometryCache;
  }
  function requiredExpLog10(level){level=Math.max(1,Math.floor(finite(level,1)));return ensureLevelGeometry(level).requiredExpLog[level]}
  function requiredExp(level){return fromLog10(requiredExpLog10(level))}
  function baseOreValueLog10(level){level=Math.max(1,Math.floor(finite(level,1)));return ensureLevelGeometry(level).valueLog[level]}
  function baseOreValue(level){return fromLog10(baseOreValueLog10(level))}
  function baseOreHpLog10(level){level=Math.max(1,Math.floor(finite(level,1)));return ensureLevelGeometry(level).hpLog[level]}
  function baseOreHp(level){return fromLog10(baseOreHpLog10(level))}
  function expectedTerminalPerTop(level){level=Math.max(1,Math.floor(finite(level,1)));return ensureLevelGeometry(level).terminalPerTop[level]}
  function prestigeBase(level){if(level<50)return 0;return level-49+(level>100?.6*Math.pow(level-100,2):0)}
  function prestigeGain(level,coreIngotLevel){return Math.max(level>=50?1:0,Math.floor(prestigeBase(level)*coreEffect(1,coreIngotLevel)))}
  function firstLevelForPrestigeGain(want,coreIngotLevel,maxLevel=1000000){
    want=Math.max(1,finite(want,1));maxLevel=Math.max(50,Math.floor(finite(maxLevel,1000000)));
    if(prestigeGain(50,coreIngotLevel)>=want)return 50;
    let lo=50,hi=Math.min(maxLevel,100);
    while(hi<maxLevel&&prestigeGain(hi,coreIngotLevel)<want){lo=hi;hi=Math.min(maxLevel,Math.max(hi+1,hi*2))}
    if(prestigeGain(hi,coreIngotLevel)<want)return maxLevel;
    while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(prestigeGain(mid,coreIngotLevel)>=want)hi=mid;else lo=mid}
    return hi;
  }
  function prestigePermanent(totalEarned){return 1+.1*Math.sqrt(Math.max(0,finite(totalEarned)))}

  function normalNextCostLog10(index,level,costReduction){
    const raw=NORMAL_BASE_COST_LOG10[index]+level*NORMAL_COST_RATE_LOG10[index]+Math.log10(Math.max(1e-300,costReduction));
    // Preserve the game's integer ceiling exactly while costs are still representable
    // with useful integer precision; afterwards the logarithmic value is sufficient.
    if(raw<14)return Math.log10(Math.max(1,Math.ceil(Math.pow(10,raw))));
    return raw;
  }
  function createNormalCostLogs(levels,costReduction){return levels.map((level,i)=>normalNextCostLog10(i,level,costReduction))}
  function buyNormalAutoLimited(cashLog,levels,gameLevel,costReduction,limit=Infinity,costLogs=null){
    let guard=0,bought=0;
    for(;;){
      let best=-1,bestCostLog=Infinity;
      for(let i=0;i<8;i++){
        if(gameLevel<NORMAL.unlock[i]||levels[i]>=NORMAL.max[i])continue;
        const c=costLogs?costLogs[i]:normalNextCostLog10(i,levels[i],costReduction);
        if(c<bestCostLog){bestCostLog=c;best=i}
      }
      if(best<0||bestCostLog>cashLog+1e-12||bought>=limit||++guard>5000)return {cashLog,bought};
      cashLog=log10Sub(cashLog,bestCostLog);levels[best]++;bought++;
      if(costLogs)costLogs[best]=levels[best]>=NORMAL.max[best]?Infinity:normalNextCostLog10(best,levels[best],costReduction);
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
    const effectiveRate=Math.max(0,finite(normalFeed,1))*ingotEffect(3,ingotLevels[3])*coreEffect(4,coreLevels[4])/Math.max(1,finite(slowdown,1));
    const raw=Math.max(.005,.6*effectiveRate);
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

  function directExpPaceAtLevel(level,input){
    level=Math.max(1,Math.floor(finite(level,1)));input=input||{};
    const slowdown=Math.max(1,finite(input.slowdown,1)),expEfficiencyMultiplier=Math.max(1e-300,finite(input.expEfficiencyMultiplier,1)),rarePercent=clamp(finite(input.rarePercent,0),0,100),rareValueMultiplier=Math.max(1e-300,finite(input.rareValueMultiplier,1)),gemPercent=clamp(finite(input.gemPercent,0),0,100),orichalcumPercent=clamp(finite(input.orichalcumPercent,0),0,100),compressionE=Math.max(0,finite(input.compressionE,0));
    const rare=rarePercent/100,gem=gemPercent/100,ori=orichalcumPercent/100,rarity={pNormal:(1-gem)*(1-rare),pRare:(1-gem)*rare*(1-ori),pGem:gem,pOri:(1-gem)*rare*ori};
    const reqLog=requiredExpLog10(level),packetLog=baseOreValueLog10(level)+Math.log10(slowdown)+Math.log10(.125*expEfficiencyMultiplier)+compressionE;
    const work=valueMultiplier=>{const d=packetLog+Math.log10(Math.max(1e-300,valueMultiplier))-reqLog;return d>=0?1:(d<-323?0:Math.pow(10,d))};
    const workNormal=work(1),workRare=work(10*rareValueMultiplier),workGem=work(20*rareValueMultiplier),workOri=work(200*rareValueMultiplier),useful=rarity.pNormal*workNormal+rarity.pRare*workRare+rarity.pGem*workGem+rarity.pOri*workOri;
    return {level,useful,paceFactor:useful>0?1/useful:Infinity,workNormal,workRare,workGem,workOri,rarity,requiredExpLog:reqLog,basePacketLog:packetLog};
  }

  function calculateExpPaceBoundary(input){
    input=input||{};
    const normalized={targetLevel:Math.max(1,Math.floor(finite(input.targetLevel,50))),slowdown:Math.max(1,finite(input.slowdown,1)),expEfficiencyMultiplier:Math.max(1e-300,finite(input.expEfficiencyMultiplier,1)),rarePercent:clamp(finite(input.rarePercent,0),0,100),rareValueMultiplier:Math.max(1e-300,finite(input.rareValueMultiplier,1)),gemPercent:clamp(finite(input.gemPercent,0),0,100),orichalcumPercent:clamp(finite(input.orichalcumPercent,0),0,100),compressionE:Math.max(0,finite(input.compressionE,0))};
    const startLevel=Math.max(1,Math.floor(finite(input.startLevel,50))),maxLevel=Math.max(startLevel+1,Math.floor(finite(input.maxLevel,100000))),paceAt=level=>directExpPaceAtLevel(level,normalized);
    const firstLevelWhere=predicate=>{
      if(predicate(paceAt(startLevel)))return startLevel;
      if(!predicate(paceAt(maxLevel)))return null;
      let lo=startLevel+1,hi=maxLevel;
      while(lo<hi){const mid=Math.floor((lo+hi)/2);if(predicate(paceAt(mid)))hi=mid;else lo=mid+1}
      return lo;
    };
    const firstSlowGaugeLevel=firstLevelWhere(x=>x.useful<1-1e-12),fullSpeedGaugeThroughLevel=firstSlowGaugeLevel===null?maxLevel:firstSlowGaugeLevel-1,safeAutoPrestigeLevel=firstSlowGaugeLevel===null?null:firstSlowGaugeLevel,targetArrivalGaugeLevel=Math.max(1,normalized.targetLevel-1),targetArrival=paceAt(targetArrivalGaugeLevel),targetGauge=paceAt(normalized.targetLevel),milestoneFactors=[1.05,1.25,2,10,100],milestones=milestoneFactors.map(factor=>({factor,level:firstLevelWhere(x=>x.paceFactor>=factor)}));
    return {input:normalized,startLevel,maxLevel,firstSlowGaugeLevel,fullSpeedGaugeThroughLevel,safeAutoPrestigeLevel,targetArrivalGaugeLevel,targetArrivalPaceFactor:targetArrival.paceFactor,targetGaugePaceFactor:targetGauge.paceFactor,targetArrival,targetGauge,milestones};
  }

  function dpsLog10(normalLevels,ingotLevels,coreLevels,totalEarned,dpsCalibration=1){
    const speedLog=normalEffectLog10(0,normalLevels[0]),powerLog=normalEffectLog10(1,normalLevels[1]),reducerLog=normalEffectLog10(2,normalLevels[2]),gravityLog=normalEffectLog10(4,normalLevels[4]),spikesLog=normalEffectLog10(5,normalLevels[5]);
    const rpmLog=Math.max(0,speedLog-reducerLog),hitsLog=rpmLog-Math.log10(60)+spikesLog+.7*(gravityLog-Math.log10(9.81));
    const damageBaseLog=powerLog+2.26*reducerLog+Math.log10(Math.max(1e-300,ingotEffect(2,ingotLevels[2])))+Math.log10(Math.max(1e-300,prestigePermanent(totalEarned)));
    return Math.log10(OUTER_DAMAGE_FACTOR*Math.max(1e-300,dpsCalibration))+hitsLog+coreEffect(2,coreLevels[2])*damageBaseLog;
  }

  function softCapHpLog(hpLog,capLog){
    const d=hpLog-capLog;if(!(d>0))return hpLog;if(d>12)return hpLog+Math.log10(.5);
    return capLog+Math.log10(1+.5*(Math.pow(10,d)-1));
  }

  function simulateCurveUncached(opts){
    const target=Math.max(50,Math.floor(finite(opts.maxTarget,1500)));
    const core=(opts.core||DEFAULT_CORE).map(x=>Math.max(0,Math.floor(finite(x))));
    const ingot=(opts.ingot||DEFAULT_INGOT_LEVELS).map(x=>Math.max(0,Math.floor(finite(x))));
    const slowdown=Math.max(1,finite(opts.slowdown,1));
    const physicalCap=Math.max(.05,finite(opts.physicalCap,11));
    const totalEarned=Math.max(0,finite(opts.totalIngotsEarned,0));
    const dpsCalibration=Math.max(1e-300,finite(opts.dpsCalibration,1)),damageBoostMultiplier=Math.max(1e-300,finite(opts.damageBoostMultiplier,1)),hpCalibration=Math.max(1e-300,finite(opts.hpCalibration,1)),compressionEnabled=!!opts.compressionEnabled&&finite(opts.compressionE)>0,compressionLog=compressionEnabled?Math.max(0,finite(opts.compressionE)):0,compressionRequiredIngots=compressionEnabled?Math.max(0,finite(opts.compressionRequiredIngots)):0;
    const costReduction=coreEffect(3,core[3]),coreFeed=coreEffect(4,core[4]);
    const ingotFeed=ingotEffect(3,ingot[3]),expMult=ingotEffect(1,ingot[1]),refining=ingotEffect(0,ingot[0]),coreIncome=coreEffect(0,core[0]),gemChance=ingotEffect(4,ingot[4])/100,oriChance=ingotEffect(7,ingot[7])/100,rareValue=ingotEffect(5,ingot[5]),expPacketLogOffset=Math.log10(Math.max(1,slowdown))+Math.log10(.125*expMult)+compressionLog,rareWorkLog=Math.log10(10*rareValue),gemWorkLog=Math.log10(20*rareValue),oriWorkLog=Math.log10(200*rareValue);
    const normalAutoEnabled=opts.normalAutoEnabled!==false,manualMode=opts.normalAutoMode==='manual',manualClickRate=Math.max(.1,finite(opts.manualClickRate,4)),manualCal=opts.manualCalibration||null,autoCal=opts.normalAutoCalibration||null,frameLimitedAuto=!!autoCal||Number.isFinite(Number(opts.normalAutoUpdatesPerSecond)),autoUpdatesPerSecond=Math.min(100,Math.max(.1,finite(opts.normalAutoUpdatesPerSecond,DEFAULT_NORMAL_AUTO_UPDATES_PER_SECOND))),autoWallScale=Math.max(.01,finite(autoCal&&autoCal.scale,1)),normalLevels=[0,0,0,0,0,0,0,0],normalCostLogs=createNormalCostLogs([0,0,0,0,0,0,0,0],costReduction),geometry=ensureLevelGeometry(target),reqLogs=geometry.requiredExpLog,valueLogs=geometry.valueLog,hpLogs=geometry.hpLog,terminalPerTopByLevel=geometry.terminalPerTop,tierByLevel=geometry.tier;
    const times=new Float64Array(target+1),minOneShot=new Float64Array(target+1),worstOneShotLevel=new Int32Array(target+1),queuePressure=new Float64Array(target+1),topSpawnRates=new Float64Array(target+1),rawTopSpawnRates=new Float64Array(target+1),contactRates=new Float64Array(target+1),dpsKillRates=new Float64Array(target+1),compressionIngots=new Float64Array(target+1),normalRareLevels=new Int16Array(target+1),normalAtTarget=[];
    let cashLog=-Infinity,rawSeconds=0,minShot=Infinity,worst=1,lastPressure=0,lastTopSpawn=0,lastRawTopSpawn=0,lastContactRate=0,lastDpsKillRate=0,lastDpsLog=-Infinity,lastHpSmallLog=-Infinity,lastHpLargeLog=-Infinity,lastNormalUsed=normalLevels.slice(),manualClicks=0,autoTickCarry=0,autoPurchases=0,directIngots=0,runningTotalEarned=totalEarned,compressionStartupSeconds=0;
    times[1]=0;minOneShot[1]=Infinity;
    for(let L=1;L<target;L++){
      if(normalAutoEnabled){
        if(manualMode){
          const elapsed=manualCal?calibratedSeconds(rawSeconds,manualCal):rawSeconds,available=Math.max(0,Math.floor(elapsed*manualClickRate)-manualClicks),buy=buyNormalAutoLimited(cashLog,normalLevels,L,costReduction,available,normalCostLogs);cashLog=buy.cashLog;manualClicks+=buy.bought;
        }else if(!frameLimitedAuto)cashLog=buyNormalAutoLimited(cashLog,normalLevels,L,costReduction,Infinity,normalCostLogs).cashLog;
      }
      lastNormalUsed=normalLevels.slice();
      const feed=normalEffect(7,normalLevels[7]);
      const spawn=topSpawnRate(core,ingot,feed,slowdown),topSpawn=spawn.actual;
      const terminalPerTop=terminalPerTopByLevel[L],terminalSupply=topSpawn*terminalPerTop;
      const prestige=prestigePermanent(runningTotalEarned),baseDpsLog=dpsLog10(normalLevels,ingot,core,runningTotalEarned,dpsCalibration),dpsLog=baseDpsLog+Math.log10(damageBoostMultiplier);
      // OreSpawner removes the temporary Damage Boost from its HP-cap DPS, so a
      // ×2 boost raises live crusher damage without also inflating spawned ore HP.
      const rawHpSmallLog=hpLogs[L],capHpSmallLog=baseDpsLog+Math.log10(ORE_MAX_CRUSH_SECONDS),hpSmallLog=softCapHpLog(rawHpSmallLog,capHpSmallLog)+Math.log10(slowdown)+Math.log10(hpCalibration)+compressionLog;
      const rareChance=clamp(.005*normalLevels[3],0,1),nonGem=1-gemChance,pOri=nonGem*rareChance*oriChance,pRare=nonGem*rareChance*(1-oriChance),pNormal=nonGem*(1-rareChance),avgOriHp=1+4*pOri;
      // Rate damage is applied independently to every ore registered in the
      // crusher zone (VRCW maxZoneOres=120); displayed DPS is not a single
      // factory-wide damage budget.  Aggregate kill capacity therefore scales
      // with concurrent zone occupancy instead of DPS/HP alone.
      const dpsKillRate=MAX_ZONE_ORES*pow10(dpsLog-hpSmallLog)/avgOriHp;
      const contactRate=physicalCap*terminalSupply/(physicalCap+terminalSupply);
      const processed=Math.max(1e-12,Math.min(contactRate,dpsKillRate));
      const reqLog=reqLogs[L],packetDelta=valueLogs[L]+expPacketLogOffset-reqLog,work=(d)=>d>=0?1:(d<-323?0:Math.pow(10,d)),useful=pNormal*work(packetDelta)+pRare*work(packetDelta+rareWorkLog)+gemChance*work(packetDelta+gemWorkLog)+pOri*work(packetDelta+oriWorkLog),terminalOres=1/Math.max(1e-12,useful),steadyLevelSeconds=terminalOres/processed,rarity={pNormal,pRare,pGem:gemChance,pOri};
      let levelRawSeconds=steadyLevelSeconds;
      if(compressionEnabled&&L===1){const firstTerminalSeconds=avgOriHp*pow10(hpSmallLog-dpsLog);compressionStartupSeconds=Math.max(0,firstTerminalSeconds-1/processed);levelRawSeconds+=compressionStartupSeconds}
      if(compressionEnabled){const directGain=terminalOres*compressionExpectedIngotPerOreFromState(compressionRequiredIngots,rarity);directIngots+=directGain;runningTotalEarned+=directGain}
      compressionIngots[L+1]=directIngots;rawSeconds+=levelRawSeconds;
      times[L+1]=rawSeconds;
      const hpLargestNormalLog=hpSmallLog+tierByLevel[L]*Math.log10(ORE_TIER_HP_MULTIPLIER),shot=pow10(dpsLog-hpLargestNormalLog);
      if(shot<minShot){minShot=shot;worst=L}
      minOneShot[L+1]=minShot;worstOneShotLevel[L+1]=worst;
      lastPressure=terminalSupply/Math.max(1e-12,Math.min(contactRate,dpsKillRate));queuePressure[L+1]=lastPressure;
      lastTopSpawn=topSpawn;lastRawTopSpawn=spawn.raw;lastContactRate=contactRate;lastDpsKillRate=dpsKillRate;
      topSpawnRates[L+1]=topSpawn;rawTopSpawnRates[L+1]=spawn.raw;contactRates[L+1]=contactRate;dpsKillRates[L+1]=dpsKillRate;normalRareLevels[L+1]=normalLevels[3];
      lastDpsLog=dpsLog;lastHpSmallLog=hpSmallLog;lastHpLargeLog=hpLargestNormalLog;

      // EXP is based on pre-income base value.  This is the cash represented by the
      // amount of base value required to fill the level, plus the exact level reward.
      // Overshoot only increases real cash, so this is deliberately conservative.
      const expectedValueMultiplier=pNormal+pRare*10*rareValue+gemChance*20*rareValue+pOri*200*rareValue,compressionIncomeLog=valueLogs[L]+compressionLog+Math.log10(Math.max(1e-300,terminalOres))+Math.log10(Math.max(1e-300,expectedValueMultiplier))+Math.log10(Math.max(1e-300,prestige*refining*coreIncome));
      const incomeLog=compressionEnabled?compressionIncomeLog:reqLog-Math.log10(.125*expMult)+Math.log10(Math.max(1e-300,prestige*refining*coreIncome));
      const rewardLog=reqLog+Math.log10(2);
      cashLog=log10Add(cashLog,log10Add(incomeLog,rewardLog));
      if(normalAutoEnabled&&!manualMode&&frameLimitedAuto){
        // AutomationManager is frame-driven: after its 0.01 s timer gate it buys
        // at most one normal upgrade in that Update.  Each elapsed Update chance
        // is consumed whether or not an affordable upgrade exists; it cannot be
        // banked and discharged later as an instantaneous bulk purchase.
        autoTickCarry+=levelRawSeconds*autoWallScale*autoUpdatesPerSecond;
        const opportunities=Math.floor(autoTickCarry+1e-12);
        if(opportunities>0){
          autoTickCarry-=opportunities;
          const buy=buyNormalAutoLimited(cashLog,normalLevels,L+1,costReduction,opportunities,normalCostLogs);
          cashLog=buy.cashLog;autoPurchases+=buy.bought;
        }
      }
    }
    for(const n of normalLevels)normalAtTarget.push(n);
    return {times,minOneShot,worstOneShotLevel,queuePressure,topSpawnRates,rawTopSpawnRates,contactRates,dpsKillRates,compressionIngots,compressionEnabled,compressionE:compressionLog,compressionStartupSeconds,directIngotsAtTarget:directIngots,runningTotalIngotsEarnedAtTarget:runningTotalEarned,normalRareLevels,normalAtTarget,normalUsedAtTarget:lastNormalUsed,rawSeconds,manualClicks,autoPurchases,normalAutoUpdatesPerSecond:autoUpdatesPerSecond,damageBoostMultiplier,topSpawnAtTarget:lastTopSpawn,rawTopSpawnAtTarget:lastRawTopSpawn,contactRateAtTarget:lastContactRate,dpsKillRateAtTarget:lastDpsKillRate,dpsLogAtTarget:lastDpsLog,hpSmallLogAtTarget:lastHpSmallLog,hpLargeLogAtTarget:lastHpLargeLog};
  }
  function simulateCurve(opts){
    if(opts&&opts.cache===false)return simulateCurveUncached(opts);
    const key=curveCacheKey(opts||{}),cached=cacheGet(curveCache,key);if(cached)return cached;
    return cacheSet(curveCache,key,simulateCurveUncached(opts||{}),CURVE_CACHE_LIMIT);
  }

  function deriveDpsCalibration(observation,physicalCap=11,normalAutoCalibration=null){
    const level=Math.max(1,Math.floor(finite(observation&&observation.level))),explicitDpsLog=Number(observation&&observation.dpsLog10),rawObservedDps=Number(observation&&observation.dps),observedLog=Number.isFinite(explicitDpsLog)?explicitDpsLog:(rawObservedDps>0&&Number.isFinite(rawObservedDps)?Math.log10(rawObservedDps):NaN);
    const core=(observation&&observation.core||DEFAULT_CORE).map(x=>Math.max(0,Math.floor(finite(x))));
    const ingot=(observation&&observation.ingot||DEFAULT_INGOT_LEVELS).map(x=>Math.max(0,Math.floor(finite(x))));
    const slowdown=Math.max(1,finite(observation&&observation.slowdown,1)),totalIngotsEarned=Math.max(0,finite(observation&&observation.totalIngotsEarned,0)),damageBoostMultiplier=Math.max(1e-300,finite(observation&&observation.damageBoostMultiplier,1));
    const curve=simulateCurve({maxTarget:level+1,core,ingot,slowdown,physicalCap,totalIngotsEarned,dpsCalibration:1,damageBoostMultiplier,hpCalibration:1,compressionEnabled:!!(observation&&observation.compressionEnabled),compressionE:observation&&observation.compressionE,compressionRequiredIngots:observation&&observation.compressionRequiredIngots,normalAutoUpdatesPerSecond:observation&&observation.normalAutoUpdatesPerSecond,normalAutoCalibration});
    const calibration=Number.isFinite(observedLog)?pow10(observedLog-curve.dpsLogAtTarget):1;
    const explicitHpLog=Number(observation&&observation.hpSmallLog10),rawObservedHp=Number(observation&&observation.hpSmall),observedHpLog=Number.isFinite(explicitHpLog)?explicitHpLog:(rawObservedHp>0&&Number.isFinite(rawObservedHp)?Math.log10(rawObservedHp):NaN),hpCalibration=Number.isFinite(observedHpLog)?pow10(observedHpLog-curve.hpSmallLogAtTarget):1;
    return {calibration,hpCalibration,level,predictedDpsLog10:curve.dpsLogAtTarget,observedDpsLog10:observedLog,predictedHpSmallLog10:curve.hpSmallLogAtTarget,observedHpSmallLog10:observedHpLog,hpRatio:Number.isFinite(observedHpLog)?pow10(curve.hpSmallLogAtTarget-observedHpLog):NaN,normalLevels:curve.normalAtTarget};
  }

  const DEFAULT_CALIBRATION={physicalCap:15.75,intercept:9.966969892901218,scale:.6409702930803871,mse:13.868915857590359,rmse:3.7240993350863185,count:11,source:'measurements+frame-limited-auto',normalAutoUpdatesPerSecond:DEFAULT_NORMAL_AUTO_UPDATES_PER_SECOND};
  const calibrationCache=new Map();
  const curveCache=new Map(),CURVE_CACHE_LIMIT=128,paretoCoreCache=new Map(),prestigeTransitionCoreCache=new Map();
  function cacheGet(map,key){if(!map.has(key))return null;const value=map.get(key);map.delete(key);map.set(key,value);return value}
  function cacheSet(map,key,value,limit){if(map.has(key))map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);return value}
  function bestPrestigeTransitionCore(runCore,totalCore,ingotLevel,mode='roundtrip'){
    const run=normalizeCore(runCore),c=Math.max(0,Math.floor(finite(ingotLevel))),key=[totalCore,c,mode,run.join(',')].join('|'),cached=cacheGet(prestigeTransitionCoreCache,key);if(cached)return cached.slice();
    const mandatory=coreCost(1,c),budget=totalCore-mandatory;if(budget<0)return null;if(run[1]===c&&coreBundleCost(run)<=totalCore)return cacheSet(prestigeTransitionCoreCache,key,run.slice(),1024).slice();
    const indices=[0,2,3,4],sumRun=indices.reduce((s,i)=>s+run[i],0),runTotalLevels=run.reduce((a,b)=>a+b,0),stages=[{cost:[0],parent:null}];let prev=[0];
    for(const index of indices){const maxSum=(prev.length-1)+run[index],next=Array(maxSum+1).fill(Infinity),parent=Array(maxSum+1).fill(null);for(let s=0;s<prev.length;s++)if(Number.isFinite(prev[s]))for(let level=0;level<=run[index];level++){const ns=s+level,cost=prev[s]+coreCost(index,level);if(cost<next[ns]){next[ns]=cost;parent[ns]=[s,level]}}stages.push({cost:next,parent,index});prev=next}
    let bestSum=-1,bestScore=Infinity,bestOut=Infinity,bestTargetLevels=Infinity;const baseDiff=Math.abs(run[1]-c);
    for(let kept=0;kept<prev.length;kept++){if(prev[kept]>budget)continue;const diff=baseDiff+sumRun-kept,targetLevels=c+kept,out=diff===0?0:Math.min(diff+1,targetLevels+2),back=diff===0?0:Math.min(diff+1,runTotalLevels+2),score=mode==='out'?out:out+back;if(score<bestScore||(score===bestScore&&(out<bestOut||(out===bestOut&&targetLevels<bestTargetLevels)))){bestSum=kept;bestScore=score;bestOut=out;bestTargetLevels=targetLevels}}
    if(bestSum<0)return null;const levels={};let sum=bestSum;for(let stage=stages.length-1;stage>=1;stage--){const info=stages[stage],entry=info.parent[sum];if(!entry)return null;levels[info.index]=entry[1];sum=entry[0]}const best=[levels[0]||0,c,levels[2]||0,levels[3]||0,levels[4]||0];return cacheSet(prestigeTransitionCoreCache,key,best,1024).slice();
  }
  function optimizePrestigeScheduleTransitions(runCore,schedule,totalCore,clicksPerSecond=4){
    const run=normalizeCore(runCore),parts=(schedule||[]).filter(x=>Math.max(0,Math.floor(finite(x&&x.runs)))>0),out=[];
    for(let i=0;i<parts.length;i++){
      const part=parts[i],runs=Math.max(0,Math.floor(finite(part.runs))),c=Math.max(0,Math.floor(finite(part.prestigeCore&&part.prestigeCore[1],run[1]))),lastPart=i===parts.length-1,mid=bestPrestigeTransitionCore(run,totalCore,c,'roundtrip');if(!mid)continue;
      if(lastPart){const last=bestPrestigeTransitionCore(run,totalCore,c,'out')||mid;if(runs>1)out.push({...part,runs:runs-1,totalSeconds:(runs-1)*part.seconds,totalGain:(runs-1)*part.gain,runCore:run.slice(),prestigeCore:mid.slice()});out.push({...part,runs:1,totalSeconds:part.seconds,totalGain:part.gain,runCore:run.slice(),prestigeCore:last.slice()})}
      else out.push({...part,runCore:run.slice(),prestigeCore:mid.slice()});
    }
    return {schedule:out,interactionPlan:prestigeScheduleInteractionPlan(run,out,clicksPerSecond,true)};
  }
  function curveCacheKey(opts){
    const core=(opts.core||DEFAULT_CORE),ingot=(opts.ingot||DEFAULT_INGOT_LEVELS),manual=opts.manualCalibration||{},auto=opts.normalAutoCalibration||{};
    return [Math.max(50,Math.floor(finite(opts.maxTarget,1500))),core.join(','),ingot.join(','),finite(opts.slowdown,1),finite(opts.physicalCap,11),finite(opts.totalIngotsEarned,0),finite(opts.dpsCalibration,1),finite(opts.damageBoostMultiplier,1),finite(opts.hpCalibration,1),opts.compressionEnabled?1:0,finite(opts.compressionE,0),finite(opts.compressionRequiredIngots,0),opts.normalAutoEnabled!==false?1:0,opts.normalAutoMode||'',finite(opts.manualClickRate,4),finite(manual.intercept,0),finite(manual.scale,1),finite(auto.intercept,0),finite(auto.scale,1),finite(opts.normalAutoUpdatesPerSecond,DEFAULT_NORMAL_AUTO_UPDATES_PER_SECOND)].join('|');
  }

  function linearFit(xs,ys){
    const n=xs.length;if(!n)return {intercept:0,scale:1,mse:Infinity};
    const mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
    let cov=0,varx=0;for(let i=0;i<n;i++){cov+=(xs[i]-mx)*(ys[i]-my);varx+=(xs[i]-mx)*(xs[i]-mx)}
    let scale=varx>1e-12?cov/varx:1;scale=Math.max(.01,scale);let intercept=Math.max(0,my-scale*mx);
    const mse=xs.reduce((s,x,i)=>{const d=intercept+scale*x-ys[i];return s+d*d},0)/n;
    return {intercept,scale,mse};
  }

  function calibrationKey(rows,autoRate){return autoRate+'|'+rows.map(m=>[Math.floor(finite(m.targetLevel)),finite(m.seconds),finite(m.slowdown),...(m.core||[]),...(m.ingot||[]),finite(m.totalIngotsEarned,0),finite(m.dpsCalibration,1),finite(m.damageBoostMultiplier,1),finite(m.hpCalibration,1)].join(',')).join(';')}
  let defaultCalibrationKey=null;
  function fitCalibration(measurements,normalAutoUpdatesPerSecond=DEFAULT_NORMAL_AUTO_UPDATES_PER_SECOND){
    const rows=(measurements||[]).filter(m=>finite(m.targetLevel)>=50&&finite(m.seconds)>0&&finite(m.slowdown)>=1&&Array.isArray(m.core)&&Array.isArray(m.ingot)),autoRate=Math.min(100,Math.max(.1,finite(normalAutoUpdatesPerSecond,DEFAULT_NORMAL_AUTO_UPDATES_PER_SECOND)));
    if(rows.length<2)return {physicalCap:11,intercept:7,scale:.59,rmse:NaN,count:rows.length,source:'default',normalAutoUpdatesPerSecond:autoRate};
    const cacheKey=calibrationKey(rows,autoRate);if(defaultCalibrationKey===null)defaultCalibrationKey=calibrationKey(DEFAULT_MEASUREMENTS,DEFAULT_NORMAL_AUTO_UPDATES_PER_SECOND);
    if(cacheKey===defaultCalibrationKey)return DEFAULT_CALIBRATION;
    const cached=calibrationCache.get(cacheKey);if(cached)return cached;
    const groups=new Map();
    for(const m of rows){
      const key=JSON.stringify([m.core,m.ingot,finite(m.slowdown),finite(m.totalIngotsEarned,0),finite(m.dpsCalibration,1),finite(m.damageBoostMultiplier,1),finite(m.hpCalibration,1)]),group=groups.get(key)||{rows:[],maxTarget:0,core:m.core,ingot:m.ingot,slowdown:finite(m.slowdown),totalIngotsEarned:finite(m.totalIngotsEarned,0),dpsCalibration:finite(m.dpsCalibration,1),damageBoostMultiplier:finite(m.damageBoostMultiplier,1),hpCalibration:finite(m.hpCalibration,1)};
      group.rows.push(m);group.maxTarget=Math.max(group.maxTarget,Math.floor(m.targetLevel));groups.set(key,group);
    }
    function fitAtCap(cap,autoScale){
      const pairs=[];
      for(const g of groups.values()){
        const curve=simulateCurve({maxTarget:g.maxTarget,core:g.core,ingot:g.ingot,slowdown:g.slowdown,physicalCap:cap,totalIngotsEarned:g.totalIngotsEarned,dpsCalibration:g.dpsCalibration,damageBoostMultiplier:g.damageBoostMultiplier,hpCalibration:g.hpCalibration,normalAutoUpdatesPerSecond:autoRate,normalAutoCalibration:{scale:autoScale},cache:false});
        for(const m of g.rows)pairs.push([curve.times[Math.floor(m.targetLevel)],finite(m.seconds)]);
      }
      return {physicalCap:cap,...linearFit(pairs.map(p=>p[0]),pairs.map(p=>p[1]))};
    }
    function selfConsistent(cap,seedScale=.59){
      let scale=seedScale,fit=null;
      for(let i=0;i<8;i++){fit=fitAtCap(cap,scale);if(Math.abs(fit.scale-scale)<1e-7)break;scale=fit.scale}
      return fit;
    }
    let best=null;
    for(let cap=4;cap<=60;cap+=2){const candidate=selfConsistent(cap);if(!best||candidate.mse<best.mse)best=candidate}
    const lo=Math.max(4,best.physicalCap-2),hi=Math.min(60,best.physicalCap+2);
    for(let cap=lo;cap<=hi+1e-9;cap+=.25){const candidate=selfConsistent(cap,best.scale);if(candidate.mse<best.mse)best=candidate}
    const result={...best,rmse:Math.sqrt(best.mse),count:rows.length,source:'measurements+frame-limited-auto',normalAutoUpdatesPerSecond:autoRate};
    calibrationCache.set(cacheKey,result);if(calibrationCache.size>16)calibrationCache.delete(calibrationCache.keys().next().value);
    return result;
  }

  function calibratedSeconds(raw,cal){return Math.max(.01,finite(cal.intercept,0)+Math.max(.01,finite(cal.scale,1))*raw)}
  function actualAutoCycle(seconds){return Math.max(AUTO_PRESTIGE_INTERVAL,Math.ceil(seconds/AUTO_PRESTIGE_INTERVAL)*AUTO_PRESTIGE_INTERVAL)}
  function sameLevels(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>Math.floor(finite(v))===Math.floor(finite(b[i])))}
  const CORE_STRATEGY_PROFILES={idle:{label:'放置優先',reactionSeconds:10,minSavingSeconds:180,minSavingRatio:.08},normal:{label:'普通',reactionSeconds:4,minSavingSeconds:60,minSavingRatio:.03},focused:{label:'集中操作',reactionSeconds:1.5,minSavingSeconds:20,minSavingRatio:.01},theoretical:{label:'理論値のみ',reactionSeconds:0,minSavingSeconds:0,minSavingRatio:0}};
  function coreStrategyWorkload(plan){
    const schedule=Array.isArray(plan&&plan.prestigeSchedule)?plan.prestigeSchedule:[],expanded=[];
    for(const part of schedule){const runs=Math.max(0,Math.floor(finite(part&&part.runs)));for(let i=0;i<runs;i++)expanded.push(part)}
    let watchEvents=0,coreSwitches=0;
    for(let i=0;i<expanded.length;i++){const part=expanded[i],runCore=part.runCore||plan&&plan.runCore||plan&&plan.core,prestigeCore=part.prestigeCore||plan&&plan.prestigeCore||runCore;if(sameLevels(runCore,prestigeCore))continue;watchEvents++;coreSwitches++;if(i<expanded.length-1)coreSwitches++}
    return {watchEvents,coreSwitches,interactionClicks:Math.max(0,Math.floor(finite(plan&&plan.interactionClicks))),interactionSeconds:Math.max(0,finite(plan&&plan.interactionSeconds)),totalRuns:expanded.length};
  }
  function assessCoreStrategyPair(fixedPlan,manualPlan,style='normal'){
    const profile=CORE_STRATEGY_PROFILES[style]||CORE_STRATEGY_PROFILES.normal,fixedEta=Math.max(0,finite(fixedPlan&&fixedPlan.totalEta,fixedPlan&&fixedPlan.eta)),manualEta=Math.max(0,finite(manualPlan&&manualPlan.totalEta,manualPlan&&manualPlan.eta)),workload=coreStrategyWorkload(manualPlan),theoreticalSaving=Math.max(0,fixedEta-manualEta),manualRiskBuffer=workload.watchEvents*profile.reactionSeconds,manualThreshold=Math.max(profile.minSavingSeconds,fixedEta*profile.minSavingRatio,manualRiskBuffer),eitherThreshold=manualThreshold*.5;
    let recommendation='fixed';if(!fixedPlan&&manualPlan)recommendation='manual';else if(fixedPlan&&manualPlan&&manualEta<fixedEta-1e-9){if(style==='theoretical'||theoreticalSaving>=manualThreshold-1e-9)recommendation='manual';else if(theoreticalSaving>=eitherThreshold-1e-9)recommendation='either'}
    return {style:CORE_STRATEGY_PROFILES[style]?style:'normal',profile,recommendation,fixedEta,manualEta,theoreticalSaving,theoreticalSavingRatio:fixedEta>0?theoreticalSaving/fixedEta:0,manualRiskBuffer,manualThreshold,eitherThreshold,manualPracticalEtaMin:manualEta,manualPracticalEtaMax:manualEta+manualRiskBuffer,workload};
  }
  function exactTimingMeasurements(measurements,core,ingot,slowdown,damageBoostMultiplier=1,compressionLog=0){
    return (measurements||[]).filter(m=>finite(m.targetLevel)>=50&&finite(m.seconds)>0&&finite(m.slowdown)===finite(slowdown)&&finite(m.damageBoostMultiplier,1)===finite(damageBoostMultiplier,1)&&Math.abs(finite(m.compressionE,0)-finite(compressionLog,0))<1e-12&&sameLevels(m.core,core)&&sameLevels(m.ingot,ingot)).sort((a,b)=>a.targetLevel-b.targetLevel);
  }
  function timingResolver(curve,cal,core,ingot,slowdown,measurements){
    const points=exactTimingMeasurements(measurements,core,ingot,slowdown,curve.damageBoostMultiplier,curve.compressionE),modelAt=L=>calibratedSeconds(curve.times[Math.max(1,Math.min(curve.times.length-1,Math.floor(L)))],cal);
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
    const held=Math.max(0,finite(input.heldIngots)),totalEarned=Math.max(0,finite(input.totalIngotsEarned)),pcount=Math.max(0,Math.floor(finite(input.prestigeCount))),clickRate=Math.max(.1,finite(input.uiClickRate,4));
    const basePost={...input,normalAutoUnlocked:true};
    if(input.normalAutoUnlocked!==false)return {needed:false,prestigePerformed:false,seconds:0,interactionClicks:0,interactionSeconds:0,totalSeconds:0,gain:0,cost:0,postState:basePost};
    if(held>=NORMAL_AUTO_UNLOCK_COST){
      const interactionClicks=1,interactionSeconds=interactionClicks/clickRate;
      return {needed:true,prestigePerformed:false,seconds:0,interactionClicks,interactionSeconds,totalSeconds:interactionSeconds,gain:0,cost:NORMAL_AUTO_UNLOCK_COST,heldBefore:held,heldAfter:held-NORMAL_AUTO_UNLOCK_COST,postState:{...basePost,heldIngots:held-NORMAL_AUTO_UNLOCK_COST,totalIngotsEarned:totalEarned,prestigeCount:pcount}};
    }
    const maxTarget=Math.max(100,Math.floor(finite(input.maxTargetLevel,2200))),needed=NORMAL_AUTO_UNLOCK_COST-held;
    let guaranteedLevel=50;while(guaranteedLevel<maxTarget&&prestigeGain(guaranteedLevel,core[1])<needed)guaranteedLevel++;
    if(prestigeGain(guaranteedLevel,core[1])<needed)return null;
    const slowdowns=slowdown==null?[...new Set([...progressionSlowdownCandidates(core,ingot,cal.physicalCap,1),...progressionSlowdownCandidates(core,ingot,cal.physicalCap,4)])].sort((a,b)=>a-b):[Math.max(1,finite(slowdown,1))];
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
        curve=simulateCurve({maxTarget:end,core,ingot,slowdown:bootSlowdown,physicalCap:cal.physicalCap,totalIngotsEarned:totalEarned,dpsCalibration:input.dpsCalibration,damageBoostMultiplier:input.damageBoostMultiplier,hpCalibration:input.hpCalibration,...compressionCurveOptions(input),normalAutoEnabled:true,normalAutoMode:'manual',manualClickRate:input.manualClickRate,manualCalibration:cal});
        const latestPoll=actualAutoCycle(calibratedSeconds(curve.times[Math.min(guaranteedLevel,end)],cal));
        if(end>=maxTarget||calibratedSeconds(curve.times[end],cal)>latestPoll)break;
        end=Math.min(maxTarget,Math.max(end+64,end*2));
      }
      for(let L=50;L<=guaranteedLevel;L++){
        const configuredReach=calibratedSeconds(curve.times[L],cal),seconds=actualAutoCycle(configuredReach),actualLevel=levelAtCalibratedTime(curve,cal,seconds);
        const shot=curve.minOneShot[actualLevel];
        const gain=prestigeGain(actualLevel,core[1]);if(gain<needed)continue;
        const manualCurve=simulateCurve({maxTarget:actualLevel+1,core,ingot,slowdown:bootSlowdown,physicalCap:cal.physicalCap,totalIngotsEarned:totalEarned,dpsCalibration:input.dpsCalibration,damageBoostMultiplier:input.damageBoostMultiplier,hpCalibration:input.hpCalibration,...compressionCurveOptions(input),normalAutoEnabled:true,normalAutoMode:'manual',manualClickRate:input.manualClickRate,manualCalibration:cal});
        const manualNormalLevels=manualCurve.normalAtTarget.slice(),manualPurchases=manualCurve.manualClicks;
        const initialCore=Array.isArray(input.currentCoreLevels)&&input.currentCoreLevels.length===5?coreReallocationPlan(input.currentCoreLevels,core):{method:'unknown',from:core.slice(),to:core.slice(),levelClicks:0,actionClicks:0,clicks:0},slowdownOperation=Number.isFinite(Number(input.currentSlowdownLevel))?slowdownReallocationPlan(input.currentSlowdownLevel,bootSlowdown):{fromLevel:slowdownLevel(bootSlowdown),toLevel:slowdownLevel(bootSlowdown),levelClicks:0,actionClicks:0,clicks:0},interactionClicks=initialCore.clicks+slowdownOperation.clicks+3,interactionSeconds=interactionClicks/clickRate,totalSeconds=seconds+interactionSeconds;
        const row={needed:true,prestigePerformed:true,manualNormalPurchases:true,manualNormalLevels,manualPurchases,core:core.slice(),slowdown:bootSlowdown,targetLevel:L,actualPrestigeLevel:actualLevel,configuredReachSeconds:configuredReach,seconds,interactionClicks,interactionSeconds,totalSeconds,interactionPlan:{initialCore,slowdown:slowdownOperation,prestigeActionClicks:2,autoUnlockClicks:1},gain,cost:NORMAL_AUTO_UNLOCK_COST,heldBefore:held,heldAfter:held+gain-NORMAL_AUTO_UNLOCK_COST,oneShotRatio:shot,worstOneShotLevel:curve.worstOneShotLevel[actualLevel]};
        if(!best||row.totalSeconds<best.totalSeconds-1e-9||(Math.abs(row.totalSeconds-best.totalSeconds)<1e-9&&row.targetLevel<best.targetLevel))best=row;
      }
    }
    if(!best)return null;
    best.postState={...basePost,heldIngots:best.heldAfter,totalIngotsEarned:totalEarned+best.gain,prestigeCount:pcount+1,currentCoreLevels:best.core.slice(),currentSlowdownLevel:slowdownLevel(best.slowdown)};
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
        if(!best||b.totalSeconds<best.totalSeconds-1e-9||(Math.abs(b.totalSeconds-best.totalSeconds)<1e-9&&b.manualPurchases<best.manualPurchases))best=b;
      }
    }
    return best;
  }

  function dominates(a,b){
    const ae=[coreEffect(0,a.core[0]),coreEffect(2,a.core[2]),coreEffect(3,a.core[3]),coreEffect(4,a.core[4])],be=[coreEffect(0,b.core[0]),coreEffect(2,b.core[2]),coreEffect(3,b.core[3]),coreEffect(4,b.core[4])];
    return ae[0]>=be[0]&&ae[1]>=be[1]&&ae[2]<=be[2]&&ae[3]>=be[3]&&(ae[0]>be[0]||ae[1]>be[1]||ae[2]<be[2]||ae[3]>be[3]);
  }
  function paretoCoreCandidates(totalCore,ingotLevel){
    totalCore=Math.max(0,finite(totalCore));ingotLevel=Math.max(0,Math.floor(finite(ingotLevel)));const cacheKey=totalCore+'|'+ingotLevel,cached=cacheGet(paretoCoreCache,cacheKey);if(cached)return cached;
    const fixed=coreCost(1,ingotLevel),budget=totalCore-fixed;if(budget<0)return cacheSet(paretoCoreCache,cacheKey,[],256);
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
    return cacheSet(paretoCoreCache,cacheKey,frontier,256);
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
  function progressionSlowdownCandidates(core,ingot,physicalCap,normalFeed=4){
    const cap=maxSupplyCappedSlowdown(core,ingot,normalFeed);
    const candidates=slowdownCandidates(core,ingot,physicalCap,normalFeed).filter(x=>x<=cap+Math.max(1,cap)*1e-12);
    if(!candidates.some(x=>x===cap))candidates.push(cap);
    return [...new Set(candidates)].sort((a,b)=>a-b);
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

  function prestigeScheduleFunding(policy,neededIngots,operationAware=false){
    let need=Math.max(0,finite(neededIngots)),runs=0,seconds=0,gain=0,interactionClicks=0,interactionSeconds=0;
    if(need<=0)return {complete:true,runs,seconds,gain};
    const schedule=policy&&Array.isArray(policy.prestigeSchedule)&&policy.prestigeSchedule.length?policy.prestigeSchedule:[{runs:Math.max(0,Math.floor(finite(policy&&policy.runs))),seconds:finite(policy&&policy.seconds),gain:finite(policy&&policy.gain)}];
    for(const part of schedule){
      if(need<=0)break;
      const perGain=Math.max(0,finite(part.gain)),perSeconds=Math.max(0,finite(part.seconds)),available=Math.max(0,Math.floor(finite(part.runs)));
      if(!(perGain>0)||available<=0)continue;
      const take=Math.min(available,Math.max(1,Math.ceil(need/perGain)));
      runs+=take;seconds+=take*perSeconds;gain+=take*perGain;need-=take*perGain;
      if(operationAware){const runCore=part.runCore||policy&&policy.runCore||policy&&policy.core,prestigeCore=part.prestigeCore||policy&&policy.prestigeCore||runCore,op=prestigeInteractionPlan(runCore,prestigeCore,take,policy&&policy.uiClickRate,true,false);interactionClicks+=op.clicks;interactionSeconds+=op.seconds}
    }
    return {complete:need<=0,runs,seconds:seconds+interactionSeconds,gameSeconds:seconds,interactionClicks,interactionSeconds,gain,remaining:Math.max(0,need)};
  }

  function evaluateCurve(curve,core,cal,input,timing=null,prestigeCore=core,configuredMaxTarget=null,scheduleInteractionSeconds=null,forcedDeepTarget=null){
    const req=Math.max(0,finite(input.nextRequirement)),held=Math.max(0,finite(input.heldIngots)),pcount=Math.max(0,Math.floor(finite(input.prestigeCount))),oneShot=Math.max(0,finite(input.oneShotMargin,1)),strict=input.strictOneShot!==false,objective=input.objective||'ascensionEta';
    const maxTarget=Math.min(curve.times.length-1,configuredMaxTarget==null?curve.times.length-1:Math.max(50,Math.floor(finite(configuredMaxTarget,curve.times.length-1)))),options=[],actualLevelByPoll=new Map();
    for(let L=50;L<=maxTarget;L++){
      const configuredReach=timing?timing.secondsAt(L):calibratedSeconds(curve.times[L],cal),seconds=actualAutoCycle(configuredReach);let actualLevel=actualLevelByPoll.get(seconds);
      if(actualLevel===undefined){actualLevel=timing?timing.levelAt(seconds):levelAtCalibratedTime(curve,cal,seconds);actualLevelByPoll.set(seconds,actualLevel)}
      const shot=curve.minOneShot[actualLevel];if(strict&&shot<oneShot)break;
      const prestigeIngotGain=prestigeGain(actualLevel,prestigeCore[1]),directIngotGain=curve.compressionEnabled?Math.max(0,finite(curve.compressionIngots&&curve.compressionIngots[actualLevel])):0,gain=prestigeIngotGain+directIngotGain;if(!(gain>0))continue;
      options.push({targetLevel:L,actualPrestigeLevel:actualLevel,configuredReachSeconds:configuredReach,seconds,gain,prestigeIngotGain,directIngotGain,rate:gain/seconds,oneShotRatio:shot,worstOneShotLevel:curve.worstOneShotLevel[actualLevel],queuePressure:curve.queuePressure[actualLevel],runCore:core.slice(),prestigeCore:prestigeCore.slice()});
    }
    if(!options.length)return null;
    const forcedTarget=forcedDeepTarget==null?null:Math.max(50,Math.min(maxTarget,Math.floor(finite(forcedDeepTarget,50)))),forcedDeep=forcedTarget==null?null:options.find(x=>x.targetLevel===forcedTarget)||null;
    if(forcedTarget!=null&&!forcedDeep)return null;
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
    const shallow=options[0];
    function bestForGain(want){
      if(want<=0)return shallow;
      let lo=0,hi=options.length-1;if(options[hi].gain+1e-9<want)return null;
      while(lo<hi){const mid=(lo+hi)>>1;if(options[mid].gain>=want)hi=mid;else lo=mid+1}
      const seconds=options[lo].seconds;while(lo+1<options.length&&options[lo+1].seconds===seconds)lo++;
      return options[lo];
    }
    function scheduleCandidate(parts){
      const schedule=mergePrestigeSchedule(parts),runs=schedule.reduce((a,x)=>a+x.runs,0),eta=schedule.reduce((a,x)=>a+x.totalSeconds,0),totalGain=schedule.reduce((a,x)=>a+x.totalGain,0);
      if(runs<minRuns||totalGain+1e-6<need)return null;
      const primary=schedule.reduce((a,b)=>!a||b.targetLevel>a.targetLevel?b:a,null)||shallow;
      const minShot=schedule.reduce((a,x)=>Math.min(a,x.oneShotRatio),Infinity),worst=schedule.reduce((a,x)=>x.oneShotRatio<=a.ratio?{ratio:x.oneShotRatio,level:x.worstOneShotLevel}:a,{ratio:Infinity,level:1});
      return {...primary,runs,eta,rate:eta>0?totalGain/eta:0,prestigeSchedule:schedule,totalRuns:runs,totalGain,firstRunGain:schedule[0]?schedule[0].gain:0,firstRunSeconds:schedule[0]?schedule[0].seconds:0,oneShotRatio:minShot,worstOneShotLevel:worst.level};
    }
    let best=null,bestScore=Infinity;
    function consider(c){if(!c)return;const interaction=scheduleInteractionSeconds?Math.max(0,finite(scheduleInteractionSeconds(c),0)):0,score=c.eta+interaction;if(!best||score<bestScore-1e-9||(Math.abs(score-bestScore)<1e-9&&c.rate>best.rate+1e-12)){best=c;bestScore=score}}

    // When the 25-Prestige gate is binding, split the work into k deep runs that
    // earn the Ingots and (minRuns-k) fastest Lv50-ish count-only runs. This is the
    // key case that a single fixed Auto Prestige target cannot represent.
    if(minRuns>0){
      for(let k=0;k<=minRuns;k++){
        if(k===0){if(shallow.gain*minRuns+1e-6>=need)consider(scheduleCandidate([{...shallow,runs:minRuns,totalSeconds:minRuns*shallow.seconds,totalGain:minRuns*shallow.gain,role:'count'}]));continue}
        const fillerRuns=minRuns-k,deepNeed=Math.max(0,need-fillerRuns*shallow.gain),perDeep=deepNeed/k,deep=forcedDeep||bestForGain(perDeep);if(!deep||deep.gain+1e-9<perDeep)continue;
        consider(scheduleCandidate([
          {...deep,runs:k,totalSeconds:k*deep.seconds,totalGain:k*deep.gain,role:'deep'},
          ...(fillerRuns?[{...shallow,runs:fillerRuns,totalSeconds:fillerRuns*shallow.seconds,totalGain:fillerRuns*shallow.gain,role:'count'}]:[])
        ]));
      }
    }

    // If Ingots require more runs than the Prestige gate, search repeated deep
    // runs plus a cheaper final remainder run. This avoids uniform-target overshoot.
    if(need>0){
      for(const deep of forcedDeep?[forcedDeep]:options){
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

  function optimizeFixedCore(input,core,ingot,cal,slowdowns,prestigeCore=core){
    let best=null;const requestedMaxTarget=Math.max(100,Math.floor(finite(input.maxTargetLevel,2200))),prestigeCores=Array.isArray(prestigeCore)&&Array.isArray(prestigeCore[0])?prestigeCore:[prestigeCore],need=Math.max(0,finite(input.nextRequirement)-finite(input.heldIngots)),maxPrestigeIngot=prestigeCores.reduce((m,c)=>Math.max(m,Math.max(0,Math.floor(finite(c&&c[1])))),0),usefulTarget=(input.objective||'ascensionEta')==='ascensionEta'?(need>0?firstLevelForPrestigeGain(need,maxPrestigeIngot,requestedMaxTarget):50):requestedMaxTarget;
    for(const slowdown of slowdowns||progressionSlowdownCandidates(core,ingot,cal.physicalCap)){
      let end=usefulTarget>=requestedMaxTarget?requestedMaxTarget:Math.min(requestedMaxTarget,Math.max(128,usefulTarget+64)),curve,timing;
      for(;;){
        curve=simulateCurve({maxTarget:end,core,ingot,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:input.dpsCalibration,damageBoostMultiplier:input.damageBoostMultiplier,hpCalibration:input.hpCalibration,...compressionCurveOptions(input),normalAutoEnabled:true,normalAutoUpdatesPerSecond:input.normalAutoUpdatesPerSecond,normalAutoCalibration:cal});
        timing=timingResolver(curve,cal,core,ingot,slowdown,input.measurements||[]);
        const latestPoll=actualAutoCycle(timing.secondsAt(Math.min(usefulTarget,end)));
        if(end>=requestedMaxTarget||timing.secondsAt(end)>latestPoll+1e-9)break;
        end=Math.min(requestedMaxTarget,Math.max(end+64,Math.ceil(end*1.5)));
      }
      for(const pCore of prestigeCores){
        const rate=Math.max(.1,finite(input.uiClickRate,4)),allowTransitionOptimization=!sameLevels(core,pCore),totalCore=Math.max(coreBundleCost(core),finite(input.totalCore,coreBundleCost(core)));
        // All parts use the same Prestige-Ingot level, so transition cost depends only on total run count. Score it in O(1) instead of re-running the transition DP for every AP candidate.
        let scheduleInteractionSeconds;
        if(allowTransitionOptimization){
          const c=Math.max(0,Math.floor(finite(pCore[1]))),mid=bestPrestigeTransitionCore(core,totalCore,c,'roundtrip'),last=bestPrestigeTransitionCore(core,totalCore,c,'out')||mid,toMid=coreReallocationPlan(core,mid),fromMid=coreReallocationPlan(mid,core),toLast=coreReallocationPlan(core,last);
          scheduleInteractionSeconds=candidate=>{const runs=Math.max(0,Math.floor(finite(candidate.totalRuns,candidate.runs)));return ((runs>1?(runs-1)*(toMid.clicks+fromMid.clicks):0)+(runs?toLast.clicks:0)+2*runs+1)/rate};
        }else scheduleInteractionSeconds=candidate=>{const runs=Math.max(0,Math.floor(finite(candidate.totalRuns,candidate.runs)));return (2*runs+1)/rate};
        const ev=evaluateCurve(curve,core,cal,input,timing,pCore,usefulTarget,scheduleInteractionSeconds);if(!ev)continue;const actual=ev.actualPrestigeLevel,transitioned=allowTransitionOptimization?optimizePrestigeScheduleTransitions(core,ev.prestigeSchedule,totalCore,rate):{schedule:(ev.prestigeSchedule||[]).map(x=>({...x,runCore:core.slice(),prestigeCore:core.slice()})),interactionPlan:prestigeScheduleInteractionPlan(core,ev.prestigeSchedule,rate,true)},prestigeSchedule=transitioned.schedule,primaryPrestige=(prestigeSchedule.find(x=>x.role!=='count')||prestigeSchedule[0]||{prestigeCore:pCore}).prestigeCore,manualCoreReallocation=prestigeSchedule.some(x=>!sameLevels(x.runCore||core,x.prestigeCore||x.runCore||core));
        const prestigeOperation=transitioned.interactionPlan,initialCore=Array.isArray(input.currentCoreLevels)&&input.currentCoreLevels.length===5?coreReallocationPlan(input.currentCoreLevels,core):{method:'unknown',from:core.slice(),to:core.slice(),levelClicks:0,actionClicks:0,clicks:0},slowdownOperation=Number.isFinite(Number(input.currentSlowdownLevel))?slowdownReallocationPlan(input.currentSlowdownLevel,slowdown):{fromLevel:slowdownLevel(slowdown),toLevel:slowdownLevel(slowdown),levelClicks:0,actionClicks:0,clicks:0},interactionClicks=prestigeOperation.clicks+initialCore.clicks+slowdownOperation.clicks,interactionSeconds=interactionClicks/rate,operation={...prestigeOperation,initialCore,slowdown:slowdownOperation,clicks:interactionClicks,seconds:interactionSeconds,clicksPerSecond:rate},row={core:core.slice(),runCore:core.slice(),prestigeCore:primaryPrestige.slice(),manualCoreReallocation,uiClickRate:rate,ingot:ingot.slice(),slowdown,maxSupplyCappedSlowdown:maxSupplyCappedSlowdown(core,ingot,4),...ev,prestigeCore:primaryPrestige.slice(),prestigeSchedule,gameEta:ev.eta,interactionPlan:operation,interactionClicks,interactionSeconds,totalEta:ev.eta+interactionSeconds,steadyRuns:ev.runs,bootstrapRuns:0,normalAtTarget:curve.normalAtTarget,topSpawnAtTarget:curve.topSpawnRates[actual],rawTopSpawnAtTarget:curve.rawTopSpawnRates[actual],contactRateAtTarget:curve.contactRates[actual],timingMeasurementCount:timing.points.length,timingValidated:timing.validated&&ev.targetLevel>=timing.minLevel&&ev.targetLevel<=timing.maxLevel,timingMinLevel:timing.minLevel,timingMaxLevel:timing.maxLevel};
        const etaTie=best&&Math.abs(row.totalEta-best.totalEta)<1e-9,rateTol=best?Math.max(1,Math.abs(best.rate))*1e-12:0,rateTie=best&&Math.abs(row.rate-best.rate)<=rateTol;
        // With the same completion time and throughput, the larger Slowdown weakly
        // dominates while 20 top ores/s and DPS throughput are unchanged: it gives
        // more EXP/value headroom for later levels. Overflow can saturate the benefit
        // but cannot make the larger packet harmful by itself.
        const clickTieWins=etaTie&&(row.interactionClicks<best.interactionClicks||(row.interactionClicks===best.interactionClicks&&(row.rate>best.rate+rateTol||(rateTie&&row.slowdown>best.slowdown))));
        if(!best||row.totalEta<best.totalEta-1e-9||clickTieWins)best=row;
      }
    }
    return best;
  }

  function evaluateAutoPrestigeSetting(input,core,ingot,cal,targetLevel,slowdown,prestigeCore=core){
    const target=Math.max(50,Math.min(10000,Math.floor(finite(targetLevel,50)))),runCore=normalizeCore(core),pCore=normalizeCore(prestigeCore),levels=(ingot||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),chosenSlowdown=Math.max(1,finite(slowdown,1)),requestedMax=Math.max(target+64,Math.floor(finite(input.maxTargetLevel,target+64)));let end=Math.min(10000,requestedMax),curve,timing,configuredReach,seconds,actual;
    for(;;){
      curve=simulateCurve({maxTarget:end,core:runCore,ingot:levels,slowdown:chosenSlowdown,physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:input.dpsCalibration,damageBoostMultiplier:input.damageBoostMultiplier,hpCalibration:input.hpCalibration,...compressionCurveOptions(input),normalAutoEnabled:true,normalAutoUpdatesPerSecond:input.normalAutoUpdatesPerSecond,normalAutoCalibration:cal});
      timing=timingResolver(curve,cal,runCore,levels,chosenSlowdown,input.measurements||[]);configuredReach=timing.secondsAt(Math.min(target,end));seconds=actualAutoCycle(configuredReach);actual=timing.levelAt(seconds);
      if(end>=10000||target<end&&timing.secondsAt(end)>seconds+1e-9)break;end=Math.min(10000,Math.max(end+64,Math.ceil(end*1.5)));
    }
    const prestigeIngotGain=prestigeGain(actual,pCore[1]),directIngotGain=curve.compressionEnabled?Math.max(0,finite(curve.compressionIngots&&curve.compressionIngots[actual])):0,gain=prestigeIngotGain+directIngotGain,need=Math.max(0,finite(input.nextRequirement)-finite(input.heldIngots)),minRuns=Math.max(0,25-Math.max(0,Math.floor(finite(input.prestigeCount)))),runs=Math.max(minRuns,need>0?Math.ceil(need/Math.max(1,gain)):0),gameEta=runs*seconds,totalGain=runs*gain,rate=Math.max(.1,finite(input.uiClickRate,4)),prestigeOperation=ascensionInteractionPlan(runCore,pCore,runs,rate),initialCore=Array.isArray(input.currentCoreLevels)&&input.currentCoreLevels.length===5?coreReallocationPlan(input.currentCoreLevels,runCore):{method:'unknown',from:runCore.slice(),to:runCore.slice(),levelClicks:0,actionClicks:0,clicks:0},slowdownOperation=Number.isFinite(Number(input.currentSlowdownLevel))?slowdownReallocationPlan(input.currentSlowdownLevel,chosenSlowdown):{fromLevel:slowdownLevel(chosenSlowdown),toLevel:slowdownLevel(chosenSlowdown),levelClicks:0,actionClicks:0,clicks:0},interactionClicks=prestigeOperation.clicks+initialCore.clicks+slowdownOperation.clicks,interactionSeconds=interactionClicks/rate,oneShotRatio=curve.minOneShot[actual],oneShotMargin=Math.max(0,finite(input.oneShotMargin,1)),admissible=input.strictOneShot===false||oneShotRatio>=oneShotMargin,schedule=runs?[{targetLevel:target,actualPrestigeLevel:actual,configuredReachSeconds:configuredReach,seconds,gain,rate:gain/seconds,oneShotRatio,worstOneShotLevel:curve.worstOneShotLevel[actual],queuePressure:curve.queuePressure[actual],runCore:runCore.slice(),prestigeCore:pCore.slice(),runs,totalSeconds:gameEta,totalGain,role:'fixed'}]:[];
    return {admissible,reason:admissible?null:'one_shot_margin',core:runCore,runCore:runCore.slice(),prestigeCore:pCore,manualCoreReallocation:runCore.some((v,i)=>v!==pCore[i]),ingot:levels,slowdown:chosenSlowdown,targetLevel:target,actualPrestigeLevel:actual,configuredReachSeconds:configuredReach,seconds,gain,prestigeIngotGain,directIngotGain,rate:gain/seconds,runs,totalRuns:runs,totalGain,gameEta,eta:gameEta,prestigeSchedule:schedule,interactionPlan:{...prestigeOperation,initialCore,slowdown:slowdownOperation,clicks:interactionClicks,seconds:interactionSeconds,clicksPerSecond:rate},interactionClicks,interactionSeconds,totalEta:gameEta+interactionSeconds,oneShotRatio,worstOneShotLevel:curve.worstOneShotLevel[actual],topSpawnAtTarget:curve.topSpawnRates[actual],rawTopSpawnAtTarget:curve.rawTopSpawnRates[actual],contactRateAtTarget:curve.contactRates[actual],timingMeasurementCount:timing.points.length,timingValidated:timing.validated&&target>=timing.minLevel&&target<=timing.maxLevel};
  }

  function evaluateAutoPrestigeScheduleSetting(input,core,ingot,cal,targetLevel,slowdown,prestigeCore=core){
    const target=Math.max(50,Math.min(10000,Math.floor(finite(targetLevel,50)))),runCore=normalizeCore(core),pCore=normalizeCore(prestigeCore),levels=(ingot||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),chosenSlowdown=Math.max(1,finite(slowdown,1)),requestedMax=Math.max(target+64,Math.floor(finite(input.maxTargetLevel,target+64)));let end=Math.min(10000,requestedMax),curve,timing;
    for(;;){
      curve=simulateCurve({maxTarget:end,core:runCore,ingot:levels,slowdown:chosenSlowdown,physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:input.dpsCalibration,damageBoostMultiplier:input.damageBoostMultiplier,hpCalibration:input.hpCalibration,...compressionCurveOptions(input),normalAutoEnabled:true,normalAutoUpdatesPerSecond:input.normalAutoUpdatesPerSecond,normalAutoCalibration:cal});
      timing=timingResolver(curve,cal,runCore,levels,chosenSlowdown,input.measurements||[]);const latestPoll=actualAutoCycle(timing.secondsAt(Math.min(target,end)));
      if(end>=10000||target<end&&timing.secondsAt(end)>latestPoll+1e-9)break;end=Math.min(10000,Math.max(end+64,Math.ceil(end*1.5)));
    }
    const rate=Math.max(.1,finite(input.uiClickRate,4)),allowTransitionOptimization=!sameLevels(runCore,pCore),totalCore=Math.max(coreBundleCost(runCore),finite(input.totalCore,coreBundleCost(runCore)));let scheduleInteractionSeconds;
    if(allowTransitionOptimization){
      const c=Math.max(0,Math.floor(finite(pCore[1]))),mid=bestPrestigeTransitionCore(runCore,totalCore,c,'roundtrip'),last=bestPrestigeTransitionCore(runCore,totalCore,c,'out')||mid,toMid=coreReallocationPlan(runCore,mid),fromMid=coreReallocationPlan(mid,runCore),toLast=coreReallocationPlan(runCore,last);
      scheduleInteractionSeconds=candidate=>{const runs=Math.max(0,Math.floor(finite(candidate.totalRuns,candidate.runs)));return ((runs>1?(runs-1)*(toMid.clicks+fromMid.clicks):0)+(runs?toLast.clicks:0)+2*runs+1)/rate};
    }else scheduleInteractionSeconds=candidate=>{const runs=Math.max(0,Math.floor(finite(candidate.totalRuns,candidate.runs)));return (2*runs+1)/rate};
    const ev=evaluateCurve(curve,runCore,cal,{...input,strictOneShot:false},timing,pCore,target,scheduleInteractionSeconds,target);if(!ev)return null;
    const transitioned=allowTransitionOptimization?optimizePrestigeScheduleTransitions(runCore,ev.prestigeSchedule,totalCore,rate):{schedule:(ev.prestigeSchedule||[]).map(x=>({...x,runCore:runCore.slice(),prestigeCore:runCore.slice()})),interactionPlan:prestigeScheduleInteractionPlan(runCore,ev.prestigeSchedule,rate,true)},prestigeSchedule=transitioned.schedule,primaryPrestige=(prestigeSchedule.find(x=>x.role!=='count')||prestigeSchedule[0]||{prestigeCore:pCore}).prestigeCore,manualCoreReallocation=prestigeSchedule.some(x=>!sameLevels(x.runCore||runCore,x.prestigeCore||x.runCore||runCore)),prestigeOperation=transitioned.interactionPlan,initialCore=Array.isArray(input.currentCoreLevels)&&input.currentCoreLevels.length===5?coreReallocationPlan(input.currentCoreLevels,runCore):{method:'unknown',from:runCore.slice(),to:runCore.slice(),levelClicks:0,actionClicks:0,clicks:0},slowdownOperation=Number.isFinite(Number(input.currentSlowdownLevel))?slowdownReallocationPlan(input.currentSlowdownLevel,chosenSlowdown):{fromLevel:slowdownLevel(chosenSlowdown),toLevel:slowdownLevel(chosenSlowdown),levelClicks:0,actionClicks:0,clicks:0},interactionClicks=prestigeOperation.clicks+initialCore.clicks+slowdownOperation.clicks,interactionSeconds=interactionClicks/rate,oneShotMargin=Math.max(0,finite(input.oneShotMargin,1)),admissible=input.strictOneShot===false||ev.oneShotRatio>=oneShotMargin,actual=ev.actualPrestigeLevel;
    return {admissible,reason:admissible?null:'one_shot_margin',core:runCore.slice(),runCore:runCore.slice(),prestigeCore:primaryPrestige.slice(),manualCoreReallocation,uiClickRate:rate,ingot:levels,slowdown:chosenSlowdown,maxSupplyCappedSlowdown:maxSupplyCappedSlowdown(runCore,levels,4),...ev,prestigeCore:primaryPrestige.slice(),prestigeSchedule,gameEta:ev.eta,interactionPlan:{...prestigeOperation,initialCore,slowdown:slowdownOperation,clicks:interactionClicks,seconds:interactionSeconds,clicksPerSecond:rate},interactionClicks,interactionSeconds,totalEta:ev.eta+interactionSeconds,steadyRuns:ev.runs,normalAtTarget:curve.normalAtTarget,topSpawnAtTarget:curve.topSpawnRates[actual],rawTopSpawnAtTarget:curve.rawTopSpawnRates[actual],contactRateAtTarget:curve.contactRates[actual],timingMeasurementCount:timing.points.length,timingValidated:timing.validated&&target>=timing.minLevel&&target<=timing.maxLevel};
  }

  function optimizeAscension(input,measurements){
    const a=Math.max(0,Math.floor(finite(input.ascensionCount,7))),totalCore=Math.max(0,finite(input.totalCore,totalCoreForAscension(a))),ingot=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x))));
    const cal=fitCalibration(measurements,input.normalAutoUpdatesPerSecond),base={...input,measurements:measurements||[],ascensionCount:a,totalCore,nextRequirement:finite(input.nextRequirement,nextAscensionRequirement(a)),ingotLevels:ingot};
    const bootstrap=optimizeNormalAutoBootstrap(base,totalCore,ingot,cal);if(!bootstrap)return {plan:null,fixedPlan:null,manualPlan:null,calibration:cal,ascensionCount:a,totalCore,nextRequirement:base.nextRequirement,strictFallback:false};
    const steadyBase=bootstrap.postState||{...base,normalAutoUnlocked:true},absoluteMax=maxCoreLevel(1,totalCore);
    function choose(selected,row){return !selected||row.totalEta<selected.totalEta-1e-9||(Math.abs(row.totalEta-selected.totalEta)<1e-9&&(row.interactionClicks<selected.interactionClicks||(row.interactionClicks===selected.interactionClicks&&row.rate>selected.rate)))?row:selected}
    function searchFixed(searchBase){
      let selected=null,selectedFrontier=0,selectedIngotLevel=absoluteMax,backedOff=0,candidatePool=[];
      // Fixed-Core winners sit on two analytically small boundaries: Core-Ingot 0
      // when the remaining Prestige-count gate already funds the Ingot requirement,
      // otherwise the largest affordable Core-Ingot level or its first two click-
      // cost backoffs. Keep the legacy exhaustive sweep as an explicit verification
      // mode so differential tests can guard this reduction as the model evolves.
      const remainingIngotNeed=Math.max(0,finite(searchBase.nextRequirement)-finite(searchBase.heldIngots)),remainingPrestigeGate=Math.max(0,25-Math.max(0,Math.floor(finite(searchBase.prestigeCount)))),gateCoversNeed=remainingPrestigeGate>0&&remainingPrestigeGate*prestigeGain(50,0)+1e-9>=remainingIngotNeed,ingotLevelsToSearch=searchBase.exhaustiveCoreIngotSearch?Array.from({length:absoluteMax+1},(_,i)=>absoluteMax-i):((remainingIngotNeed<=0||gateCoversNeed)?[0]:[absoluteMax,absoluteMax-1,absoluteMax-2].filter(x=>x>=0));
      for(const il of ingotLevelsToSearch){
        const frontier=paretoCoreCandidates(totalCore,il);selectedFrontier+=frontier.length;
        for(const cand of frontier){const row=optimizeFixedCore(searchBase,cand.core,ingot,cal);if(!row)continue;row.coreUsed=cand.used;row.coreLeft=cand.left;row.frontierCount=frontier.length;row.strategyMode='fixed';candidatePool.push(row);const before=selected;selected=choose(selected,row);if(selected!==before){selectedIngotLevel=il;backedOff=absoluteMax-il}}
      }
      candidatePool.sort((x,y)=>x.totalEta-y.totalEta||x.interactionClicks-y.interactionClicks||y.rate-x.rate);selected=refineCorePlateau(searchBase,selected,false);if(selected&&!candidatePool.includes(selected))candidatePool.unshift(selected);return {selected,selectedFrontier,selectedIngotLevel,backedOff,candidatePool};
    }
    function searchManual(searchBase){
      let selected=null,candidatePool=[];const frontier=paretoCoreCandidates(totalCore,0);
      for(const cand of frontier){const prestigeCores=[cand.core.slice(),...Array.from({length:absoluteMax},(_,i)=>[0,i+1,0,0,0])],row=optimizeFixedCore(searchBase,cand.core,ingot,cal,undefined,prestigeCores);if(!row)continue;row.coreUsed=cand.used;row.coreLeft=cand.left;row.frontierCount=frontier.length;row.strategyMode='manual';candidatePool.push(row);selected=choose(selected,row)}
      candidatePool.sort((x,y)=>x.totalEta-y.totalEta||x.interactionClicks-y.interactionClicks||y.rate-x.rate);selected=refineCorePlateau(searchBase,selected,true);if(selected&&!candidatePool.includes(selected))candidatePool.unshift(selected);const selectedIngotLevel=selected?selected.prestigeCore[1]:absoluteMax;return {selected,selectedFrontier:frontier.length,selectedIngotLevel,backedOff:absoluteMax-selectedIngotLevel,candidatePool};
    }
    function refineCorePlateau(searchBase,seed,manualPrestige){
      if(!seed||searchBase.disableOperationAwareCoreRefinement)return seed;let best=seed;const evalCache=new Map(),dims=[0,3,2,4],pLevel=Math.max(0,Math.floor(finite(seed.prestigeCore&&seed.prestigeCore[1]))),prestigeTemplates=[[0,pLevel,0,0,0]],rate=Math.max(.1,finite(searchBase.uiClickRate,4));
      const evaluate=(core,slowdown=best.slowdown)=>{const key=core.join(',')+'|'+slowdown;if(evalCache.has(key))return evalCache.get(key);const row=optimizeFixedCore(searchBase,core,ingot,cal,[slowdown],manualPrestige?prestigeTemplates:core);evalCache.set(key,row);return row};
      const samePhysical=(a,b)=>a&&b&&Math.abs(a.gameEta-b.gameEta)<1e-9&&(a.prestigeSchedule||[]).length===(b.prestigeSchedule||[]).length&&(a.prestigeSchedule||[]).every((x,i)=>{const y=b.prestigeSchedule[i];return y&&x.targetLevel===y.targetLevel&&x.actualPrestigeLevel===y.actualPrestigeLevel&&x.seconds===y.seconds&&x.runs===y.runs&&x.gain===y.gain});
      const operationScore=(core,physical)=>{const initial=Array.isArray(searchBase.currentCoreLevels)&&searchBase.currentCoreLevels.length===5?coreReallocationPlan(searchBase.currentCoreLevels,core):{clicks:0},slow=Number.isFinite(Number(searchBase.currentSlowdownLevel))?slowdownReallocationPlan(searchBase.currentSlowdownLevel,physical.slowdown):{clicks:0};if(!manualPrestige){const prestigeClicks=2*Math.max(0,Math.floor(finite(physical.totalRuns,physical.runs)))+1,clicks=initial.clicks+slow.clicks+prestigeClicks;return {clicks,totalEta:physical.gameEta+clicks/rate}}const template=(physical.prestigeSchedule||[]).map(x=>({...x,runCore:core.slice(),prestigeCore:[0,Math.max(0,Math.floor(finite(x.prestigeCore&&x.prestigeCore[1],pLevel))),0,0,0]})),transitioned=optimizePrestigeScheduleTransitions(core,template,totalCore,rate),clicks=transitioned.interactionPlan.clicks+initial.clicks+slow.clicks;return {clicks,totalEta:physical.gameEta+clicks/rate}};
      for(let pass=0;pass<3;pass++){
        let changed=false;
        for(const dim of dims){const high=best.core[dim];if(high<=0)continue;const baseCore=best.core.slice(),targetGame=best.gameEta;let boundary=high,zeroCore=baseCore.slice();zeroCore[dim]=0;const zeroRow=evaluate(zeroCore);
          if(zeroRow&&zeroRow.gameEta<=targetGame+1e-9)boundary=0;else{let lo=0,hi=high;while(lo+1<hi){const mid=(lo+hi)>>1,test=baseCore.slice();test[dim]=mid;const row=evaluate(test);if(row&&row.gameEta<=targetGame+1e-9)hi=mid;else lo=mid}boundary=hi}
          let plateauLevel=high,plateauScore=operationScore(baseCore,best);for(let level=boundary;level<=high;level++){const test=baseCore.slice();test[dim]=level;const row=level===high?best:evaluate(test);if(!samePhysical(row,best))continue;const score=operationScore(test,best);if(score.totalEta<plateauScore.totalEta-1e-9||(Math.abs(score.totalEta-plateauScore.totalEta)<1e-9&&score.clicks<plateauScore.clicks)){plateauLevel=level;plateauScore=score}}
          let local=best;if(plateauLevel!==high){const test=baseCore.slice();test[dim]=plateauLevel;local=choose(local,evaluate(test))}if(boundary>0){const below=baseCore.slice();below[dim]=boundary-1;const row=evaluate(below);if(row)local=choose(local,row)}if(local!==best){best=local;changed=true}
        }
        if(!changed)break;
      }
      const fullyReoptimized=optimizeFixedCore(searchBase,best.core,ingot,cal,undefined,manualPrestige?prestigeTemplates:best.core);return choose(best,fullyReoptimized);
    }
    function withFallback(searcher){let found=searcher(steadyBase),strictFallback=false;if(!found.selected&&steadyBase.strictOneShot!==false){found=searcher({...steadyBase,strictOneShot:false});strictFallback=!!found.selected}return {found,strictFallback}}
    function finalize(selected,mode){
      if(!selected)return null;selected.bootstrap=bootstrap;selected.bootstrapRuns=bootstrap.prestigePerformed?1:0;selected.steadyRuns=selected.runs;selected.runs+=selected.bootstrapRuns;selected.gameEta=selected.eta+bootstrap.seconds;selected.eta=selected.gameEta;selected.interactionClicks+=Math.max(0,finite(bootstrap.interactionClicks));selected.interactionSeconds+=Math.max(0,finite(bootstrap.interactionSeconds));selected.totalEta=selected.gameEta+selected.interactionSeconds;selected.strategyMode=mode;
      const same=(x,y)=>Array.isArray(x)&&Array.isArray(y)&&x.length===y.length&&x.every((v,i)=>Math.floor(finite(v))===Math.floor(finite(y[i])));selected.slowdownValidated=(measurements||[]).some(m=>same(m.core,selected.core)&&same(m.ingot,selected.ingot)&&finite(m.slowdown)===selected.slowdown);return selected;
    }
    const fixedSearch=withFallback(searchFixed),manualSearch=withFallback(searchManual),fixedPlan=finalize(fixedSearch.found.selected,'fixed'),manualPlan=finalize(manualSearch.found.selected,'manual');
    const recommendedMode=manualPlan&&(!fixedPlan||manualPlan.totalEta<fixedPlan.totalEta-1e-9)?'manual':'fixed',selected=recommendedMode==='manual'?manualPlan:fixedPlan,recommendedSearch=recommendedMode==='manual'?manualSearch:fixedSearch;
    let nearAlternatives=[];
    if(selected){const bootTotal=Math.max(0,finite(bootstrap.totalSeconds,bootstrap.seconds)),bootClicks=Math.max(0,finite(bootstrap.interactionClicks)),bootInteraction=Math.max(0,finite(bootstrap.interactionSeconds)),seenAlt=new Set();nearAlternatives=(recommendedSearch.found.candidatePool||[]).filter(x=>x!==recommendedSearch.found.selected&&x.totalEta+bootTotal<=selected.totalEta*1.005).filter(x=>{const k=x.core.join(',')+'|'+x.prestigeCore.join(',')+'|'+x.slowdown;if(seenAlt.has(k))return false;seenAlt.add(k);return true}).slice(0,8).map(x=>({core:x.core.slice(),runCore:x.runCore.slice(),prestigeCore:x.prestigeCore.slice(),manualCoreReallocation:x.manualCoreReallocation,slowdown:x.slowdown,maxSupplyCappedSlowdown:x.maxSupplyCappedSlowdown,targetLevel:x.targetLevel,actualPrestigeLevel:x.actualPrestigeLevel,seconds:x.seconds,gain:x.gain,runs:x.runs,rate:x.rate,eta:x.eta+bootstrap.seconds,totalEta:x.totalEta+bootTotal,interactionClicks:x.interactionClicks+bootClicks,interactionSeconds:x.interactionSeconds+bootInteraction,prestigeSchedule:(x.prestigeSchedule||[]).map(y=>({...y})),topSpawnAtTarget:x.topSpawnAtTarget,rawTopSpawnAtTarget:x.rawTopSpawnAtTarget,coreUsed:x.coreUsed,coreLeft:x.coreLeft}));}
    return {plan:selected,fixedPlan,manualPlan,recommendedMode,nearAlternatives,calibration:cal,ascensionCount:a,totalCore,nextRequirement:base.nextRequirement,absoluteMaxIngotLevel:absoluteMax,selectedIngotLevel:recommendedSearch.found.selectedIngotLevel,backedOff:recommendedSearch.found.backedOff,frontierCount:recommendedSearch.found.selectedFrontier,strictFallback:recommendedSearch.strictFallback,fixedStrictFallback:fixedSearch.strictFallback,manualStrictFallback:manualSearch.strictFallback};
  }

  function optimizeCompressionModeAtAscension(input,measurements,compressionEnabled,roadmapSteps=32){
    const state={...input,objective:'ascensionEta',compressionEnabled:!!compressionEnabled,oneShotMargin:0,strictOneShot:false,normalAutoUnlocked:true,measurements:measurements||[]},result=optimizeAscension(state,measurements||[]);
    if(!result||!result.plan)return {compressionEnabled:!!compressionEnabled,eta:Infinity,result:null,roadmap:null};
    const roadmap=optimizeIngotUpgrades(state,result,measurements||[],Math.max(1,Math.floor(finite(roadmapSteps,32)))),eta=Math.max(0,finite(roadmap&&roadmap.totalPlannedEta,roadmap&&roadmap.plannedEta,NaN));
    return {compressionEnabled:!!compressionEnabled,eta:Number.isFinite(eta)?eta:Math.max(0,finite(result.plan.totalEta,result.plan.eta)),result,roadmap,plan:roadmap&&roadmap.finalPlan||result.plan,ingotLevels:roadmap&&roadmap.targetLevels||state.ingotLevels};
  }
  function optimizeCompressionSwitchPlan(input,measurements,opts={}){
    const discarded=Math.max(0,Math.floor(finite(input&&input.discardedAscensions))),unlocked=compressionUnlocked(discarded),bestLevel=Math.max(0,Math.floor(finite(input&&input.maxLevelEver))),probeLimit=Math.max(4,Math.min(20,Math.floor(finite(opts.probeLimit,8)))),roadmapSteps=Math.max(1,Math.floor(finite(opts.roadmapSteps,32)));
    if(!unlocked)return {unlocked:false,switchAscension:null,modeNow:'off',action:'locked',rows:[],certifiedThrough:null};
    const startIngot=legacyStartIngot(discarded),rows=[];
    function freshState(a){return {...input,ascensionCount:a,totalCore:totalCoreForAscension(a),heldIngots:startIngot,totalIngotsEarned:startIngot,prestigeCount:0,currentCoreLevels:[0,0,0,0,0],currentSlowdownLevel:0,normalAutoUnlocked:true,ingotLevels:Array(8).fill(0),maxTargetLevel:ascensionSearchMaxLevel(a,Array(8).fill(0)),nextRequirement:nextAscensionRequirement(a),discardedAscensions:discarded,maxLevelEver:bestLevel}}
    const hardness=a=>Math.log10(Math.max(1,nextAscensionRequirement(a)))-a*Math.log10(3);
    function futureMinHardness(from){let min=Infinity;for(let a=Math.max(0,from);a<ASCENSION_MAX_COUNT;a++)min=Math.min(min,hardness(a));return min}
    let certifiedThrough=null,certificateReason='';
    for(let a=0;a<ASCENSION_MAX_COUNT&&a<=probeLimit;a++){
      const state=freshState(a),off=optimizeCompressionModeAtAscension(state,measurements,false,roadmapSteps),on=optimizeCompressionModeAtAscension(state,measurements,true,roadmapSteps),preferred=on.eta<off.eta-1e-9?'on':'off';
      rows.push({ascension:a,requiredIngots:state.nextRequirement,hardness:hardness(a),offEta:off.eta,onEta:on.eta,preferred,speedup:preferred==='on'&&on.eta>0?off.eta/on.eta:preferred==='off'&&off.eta>0?on.eta/off.eta:1,offPlan:off.plan,onPlan:on.plan,offIngotLevels:off.ingotLevels,onIngotLevels:on.ingotLevels});
      if(a>=5){const tail=rows.slice(-5),firstOn=rows.findIndex(x=>x.preferred==='on'),futureMin=futureMinHardness(a+1);if(firstOn>=0&&tail.every(x=>x.preferred==='on')&&futureMin>=hardness(a)-1e-12){certifiedThrough=ASCENSION_MAX_COUNT-1;certificateReason=`A${a}まで5連続でONが実測モデル優位。以後は required▲ / 3^A の最小値がA${a}より悪化せず、Core総量は3^Aで増え、Compression Eも低下しないためOFF側が相対的に再逆転する支配条件がない。`;break}}
    }
    let switchAscension=null;for(let i=0;i<rows.length;i++)if(rows[i].preferred==='on'&&rows.slice(i).every(x=>x.preferred==='on')){switchAscension=rows[i].ascension;break}
    const currentAscension=Math.max(0,Math.floor(finite(input&&input.ascensionCount))),modeNow=switchAscension!==null&&currentAscension>=switchAscension?'on':'off',action=modeNow==='on'?'compression_on':switchAscension!==null?'keep_off_until_switch':'keep_off';
    return {unlocked:true,discardedAscensions:discarded,bestLevel,compressionE:compressionE(bestLevel,discarded),switchAscension,modeNow,action,rows,certifiedThrough,certificateReason,roadmapSteps,startIngot};
  }

  function optimizeSingularity(input,measurements){
    const currentAscension=Math.max(0,Math.floor(finite(input&&input.ascensionCount))),discarded=Math.max(0,Math.floor(finite(input&&input.discardedAscensions))),bestLevel=Math.max(0,Math.floor(finite(input&&input.maxLevelEver))),terminalSalesPerSecond=Math.max(1e-12,finite(input&&input.compressionTerminalSalesPerSecond,15.75)),rarePercent=clamp(finite(input&&input.compressionRarePercent,100),0,100),gemLevel=Math.max(0,Math.min(10,Math.floor(finite(input&&input.compressionGemLevel,10)))),totalCrushLog=finite(input&&input.totalCrushLog,0),prestigeGateScale=Math.max(.01,finite(input&&input.prestigeGateScale,1)),postOpts={terminalSalesPerSecond,rarePercent,gemLevel,totalCrushLog,bestLevel,prestigeGateScale};
    let preCompressionSeconds=0,legacyTargets=[],unlockDiscarded=discarded,currentPlan=null,freshStatesEvaluated=0;
    if(discarded<COMPRESSION_UNLOCK_DISCARDED){
      const currentInput={...input,objective:'ascensionEta',ascensionCount:currentAscension,totalCore:Math.max(0,finite(input&&input.totalCore,totalCoreForAscension(currentAscension))),nextRequirement:finite(input&&input.nextRequirement,nextAscensionRequirement(currentAscension)),measurements:measurements||[]},currentResult=optimizeAscension(currentInput,measurements||[]);currentPlan=currentResult&&currentResult.plan;
      const freshCache=new Map(),continuationCache=new Map(),zeroIngot=Array(8).fill(0);
      const freshEta=(a,d)=>{const key=d+'|'+a;if(freshCache.has(key))return freshCache.get(key);const start=legacyStartIngot(d),freshInput={...input,objective:'ascensionEta',ascensionCount:a,totalCore:totalCoreForAscension(a),heldIngots:start,totalIngotsEarned:start,prestigeCount:0,normalAutoUnlocked:true,ingotLevels:zeroIngot.slice(),maxTargetLevel:ascensionSearchMaxLevel(a,zeroIngot),oneShotMargin:0,strictOneShot:false,nextRequirement:nextAscensionRequirement(a),measurements:measurements||[]},r=optimizeAscension(freshInput,measurements||[]),eta=r&&r.plan?Math.max(0,finite(r.plan.totalEta,r.plan.eta)):Infinity;freshCache.set(key,eta);freshStatesEvaluated++;return eta};
      const continuation=d=>{const key=Math.max(COMPRESSION_UNLOCK_DISCARDED,Math.floor(d));if(!continuationCache.has(key))continuationCache.set(key,compressionCycleEstimate(key,ASCENSION_MAX_COUNT,postOpts).overlapSeconds);return continuationCache.get(key)};
      const continuationFloor=continuation(293),route=optimizeLegacyPartitions({discardedAscensions:discarded,currentAscension,unlockDiscarded:COMPRESSION_UNLOCK_DISCARDED,maxLegacyTarget:ASCENSION_MAX_COUNT,continuationFloor,continuationCost:continuation,ascensionCost:(a,d,isInitial)=>isInitial&&a===currentAscension&&currentPlan?Math.max(0,finite(currentPlan.totalEta,currentPlan.eta)):freshEta(a,d)});
      if(!route)return {plan:null,reason:'no_legacy_route',currentPlan,freshStatesEvaluated};legacyTargets=route.legacyTargets;unlockDiscarded=route.unlockDiscarded;preCompressionSeconds=Math.max(0,route.seconds-continuation(unlockDiscarded));
    }
    const switchInput={...input,ascensionCount:discarded>=COMPRESSION_UNLOCK_DISCARDED?currentAscension:0,discardedAscensions:unlockDiscarded,maxLevelEver:bestLevel},compressionSwitch=optimizeCompressionSwitchPlan(switchInput,measurements||[],{probeLimit:8,roadmapSteps:32});
    const compression=optimizeCompressionPreparation({...postOpts,discardedAscensions:unlockDiscarded}),theoretical=optimizeCompressionPreparation({...postOpts,discardedAscensions:unlockDiscarded,terminalSalesPerSecond:THEORETICAL_TERMINAL_SALES_RATE}),primaryFinalDiscarded=compression.overlap.finalCycleDiscarded,totalOverlapSeconds=preCompressionSeconds+compression.completionOverlapSeconds,totalSequentialSeconds=preCompressionSeconds+compression.completionSequentialSeconds,theoreticalSeconds=preCompressionSeconds+theoretical.completionOverlapSeconds,nextLegacyAt=legacyTargets.length?legacyTargets[0]:null;
    let nextAction;if(discarded<COMPRESSION_UNLOCK_DISCARDED)nextAction=nextLegacyAt!==null&&currentAscension>=nextLegacyAt?'legacy_now':'continue_to_legacy_target';else if(compressionSwitch.switchAscension===null)nextAction='continue_without_compression';else if(currentAscension<compressionSwitch.switchAscension)nextAction='continue_without_compression_to_switch';else if(currentAscension===compressionSwitch.switchAscension)nextAction='enable_compression_now';else nextAction='compression_on_to_A500';
    return {plan:{nextAction,nextLegacyAt,legacyTargets,preCompressionSeconds,unlockDiscarded,compressionSwitch,compressionSwitchAscension:compressionSwitch.switchAscension,compressionModeNow:compressionSwitch.modeNow,compression,totalOverlapSeconds,totalSequentialSeconds,theoreticalSeconds,terminalSalesPerSecond,theoreticalTerminalSalesPerSecond:THEORETICAL_TERMINAL_SALES_RATE,finalCycleDiscarded:primaryFinalDiscarded,extraCompressionLegacyCycles:compression.overlap.extraLegacyCycles,afterA500LegacyDiscarded:compression.afterA500LegacyDiscarded,observableBestLevel:compression.observableBestLevel,levelTarget:compression.levelTarget,currentBestLevel:bestLevel,observableReadyAtCurrentBest:compression.observableReadyAtCurrentBest},currentPlan,freshStatesEvaluated,assumptions:{preCompressionFutureIngotRoadmap:false,compressionRarePercent:rarePercent,compressionGemLevel:gemLevel,prestigeGateScale,compressionEtaMeaning:'A0からのCompression ON/OFF切替はr80物理モデル+Ingot再投資で探索。後半の総ETAレンジはterminal-rate外側モデルを併記。'}};
  }

  function etaContinuous(req,held,rate){return Math.max(0,req-held)/Math.max(1e-12,rate)}
  function canOptimizeIngot(index,level){return level<INGOT.optimizerCap[index]}
  function optimizeIngotUpgrades(input,ascensionResult,measurements,maxSteps=192){
    const plan=ascensionResult&&ascensionResult.plan;
    if(!plan)return {steps:[],phases:[],targetLevels:(input.ingotLevels||Array(8).fill(0)).slice(),spent:0,stopReason:'no_plan'};
    const cal=ascensionResult.calibration||fitCalibration(measurements,input.normalAutoUpdatesPerSecond),req=ascensionResult.nextRequirement;
    const postBootstrapInput=plan.bootstrap&&plan.bootstrap.postState?{...plan.bootstrap.postState,normalAutoUnlocked:true}:{...input,normalAutoUnlocked:true};
    let levels=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),held=Math.max(0,finite(postBootstrapInput.heldIngots)),totalEarned=Math.max(0,finite(postBootstrapInput.totalIngotsEarned)),prestigeCount=Math.max(0,Math.floor(finite(postBootstrapInput.prestigeCount))),currentCoreLevels=Array.isArray(postBootstrapInput.currentCoreLevels)&&postBootstrapInput.currentCoreLevels.length===5?postBootstrapInput.currentCoreLevels.slice():null,currentSlowdownLevel=Number.isFinite(Number(postBootstrapInput.currentSlowdownLevel))?postBootstrapInput.currentSlowdownLevel:null;
    const uiClickRate=Math.max(.1,finite(input.uiClickRate,4));let spent=0,elapsed=0,purchaseClicks=0,purchaseInteractionSeconds=0,steps=[],phases=[],nodesEvaluated=0,replans=0,stopReason='marginal_no_gain';
    const initialLevels=levels.slice(),initialHeld=held,initialPrestigeCount=prestigeCount,phaseDepth=3,beamWidth=5,maxPhases=Math.max(1,Math.ceil(maxSteps/phaseDepth)+2),minImprovement=.0005,fullResultCache=new Map(),fixedPolicyCache=new Map();
    function stateNumber(v){return Number.isFinite(Number(v))?Number(v).toPrecision(15):String(v)}
    function policyStateKey(levels,held,earned,prestige,core,slowdown,prestigeCore=null){return levels.join(',')+'|'+stateNumber(held)+'|'+stateNumber(earned)+'|'+prestige+'|'+(core||[]).join(',')+'|'+slowdown+'|'+(prestigeCore||[]).join(',')}
    function fullResult(stateLevels,stateHeld,stateEarned,statePrestige,stateCore=postBootstrapInput.currentCoreLevels,stateSlowdown=postBootstrapInput.currentSlowdownLevel){
      const key=policyStateKey(stateLevels,stateHeld,stateEarned,statePrestige,stateCore,stateSlowdown);if(fullResultCache.has(key))return fullResultCache.get(key);
      replans++;
      const value=optimizeAscension({...postBootstrapInput,objective:'ascensionEta',normalAutoUnlocked:true,heldIngots:stateHeld,totalIngotsEarned:stateEarned,prestigeCount:statePrestige,currentCoreLevels:stateCore,currentSlowdownLevel:stateSlowdown,ingotLevels:stateLevels.slice(),nextRequirement:req},measurements);fullResultCache.set(key,value);return value;
    }
    function fullPolicy(stateLevels,stateHeld,stateEarned,statePrestige,stateCore=postBootstrapInput.currentCoreLevels,stateSlowdown=postBootstrapInput.currentSlowdownLevel){
      const r=fullResult(stateLevels,stateHeld,stateEarned,statePrestige,stateCore,stateSlowdown);return r&&r.plan?{...r.plan,calibration:r.calibration}:null;
    }
    function fixedPolicy(policy,stateLevels,stateHeld,stateEarned,statePrestige,stateCore,stateSlowdown){
      const currentCore=Array.isArray(stateCore)&&stateCore.length===5?stateCore:postBootstrapInput.currentCoreLevels,currentSlow=Number.isFinite(Number(stateSlowdown))?stateSlowdown:postBootstrapInput.currentSlowdownLevel,key=policyStateKey(stateLevels,stateHeld,stateEarned,statePrestige,currentCore,currentSlow,policy.core.concat(policy.prestigeCore||policy.core,[policy.slowdown]));if(fixedPolicyCache.has(key))return fixedPolicyCache.get(key);
      nodesEvaluated++;
      const value=optimizeFixedCore({...postBootstrapInput,objective:'ascensionEta',normalAutoUnlocked:true,heldIngots:stateHeld,totalIngotsEarned:stateEarned,prestigeCount:statePrestige,currentCoreLevels:Array.isArray(currentCore)?currentCore.slice():null,currentSlowdownLevel:currentSlow,ingotLevels:stateLevels.slice(),nextRequirement:req},policy.core,stateLevels,cal,[policy.slowdown],policy.prestigeCore||policy.core);fixedPolicyCache.set(key,value);return value;
    }
    function runsToGoal(stateHeld,statePrestige,policy){return Math.max(0,Math.floor(finite(policy&&policy.totalRuns,policy&&policy.runs||0)))}
    function finishEta(elapsedLocal,stateHeld,statePrestige,policy){return elapsedLocal+Math.max(0,finite(policy&&policy.totalEta,policy&&policy.eta))}
    function fundingToBuy(policy,stateHeld,cost){
      const need=Math.max(0,cost-stateHeld);if(need<=0)return {complete:true,runs:0,seconds:0,gain:0,interactionClicks:0,interactionSeconds:0};
      const funding=prestigeScheduleFunding(policy,need,true);if(!(funding.runs>0))return funding;
      const initial=policy.interactionPlan||{},initialClicks=Math.max(0,finite(initial.initialCore&&initial.initialCore.clicks))+Math.max(0,finite(initial.slowdown&&initial.slowdown.clicks)),initialSeconds=initialClicks/uiClickRate;
      return {...funding,seconds:funding.seconds+initialSeconds,interactionClicks:Math.max(0,finite(funding.interactionClicks))+initialClicks,interactionSeconds:Math.max(0,finite(funding.interactionSeconds))+initialSeconds};
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

    let policy;
    if(plan.bootstrap&&plan.bootstrap.needed){
      policy=fullPolicy(levels,held,totalEarned,prestigeCount,currentCoreLevels,currentSlowdownLevel);
    }else{
      policy={...plan,calibration:cal};
      fullResultCache.set(policyStateKey(levels,held,totalEarned,prestigeCount,currentCoreLevels,currentSlowdownLevel),ascensionResult);
    }
    if(!policy)return {steps,phases,targetLevels:levels,spent,postBootstrapState:postBootstrapInput,stopReason:'no_policy',nodesEvaluated,replans};
    const baselineEta=Math.max(0,finite(policy.totalEta,policy.eta));let stallPrerequisiteApplied=false;

    // Rare-ore value is only considered with Stall Recovery already at MAX.
    // The game applies index 6 directly to crusher stall duration and marks only
    // this Ingot upgrade as truly maxed. If an imported state already has Rare
    // Value without Stall MAX, repair that strategic prerequisite before searching.
    if(levels[5]>0&&levels[6]<INGOT.optimizerCap[6]){
      const from=levels[6],to=INGOT.optimizerCap[6],cost=incrementalIngotCost(6,from,to),goalRuns=runsToGoal(held,prestigeCount,policy),funding=fundingToBuy(policy,held,cost);
      if(funding.complete&&!(funding.runs>=goalRuns&&funding.runs>0)){
        const fundedHeld=held+funding.gain,nextHeld=fundedHeld-cost,nextEarned=totalEarned+funding.gain,nextPrestige=prestigeCount+funding.runs,nextLevels=levels.slice(),nextCurrentCore=funding.runs>0?policy.core.slice():currentCoreLevels,nextCurrentSlowdown=funding.runs>0?slowdownLevel(policy.slowdown):currentSlowdownLevel;nextLevels[6]=to;
        const levelClicks=to-from,purchaseSeconds=levelClicks/uiClickRate,nextPolicy=fixedPolicy(policy,nextLevels,nextHeld,nextEarned,nextPrestige,nextCurrentCore,nextCurrentSlowdown)||policy,step={index:6,name:INGOT.names[6],fromLevel:from,level:to,levels:nextLevels.slice(),cost,waitSeconds:funding.gameSeconds??funding.seconds,prestigeInteractionSeconds:funding.interactionSeconds||0,levelClicks,interactionSeconds:purchaseSeconds,prestigesBeforeBuy:funding.runs,buyAt:fundedHeld,effect:ingotEffect(6,to),rateBefore:policy.rate,rateAfter:nextPolicy.rate,hourlyBefore:policy.rate*3600,hourlyAfter:nextPolicy.rate*3600,heldBefore:held,heldAfter:nextHeld,prestigeBefore:prestigeCount,prestigeAfter:nextPrestige,totalEarnedAfter:nextEarned,etaAfter:funding.seconds+purchaseSeconds+Math.max(0,finite(nextPolicy.totalEta,nextPolicy.eta)),bulk:true,strategicPrerequisite:true,phase:0};
        levels=nextLevels;held=nextHeld;totalEarned=nextEarned;prestigeCount=nextPrestige;currentCoreLevels=Array.isArray(nextCurrentCore)?nextCurrentCore.slice():null;currentSlowdownLevel=nextCurrentSlowdown;elapsed+=funding.seconds+purchaseSeconds;purchaseClicks+=levelClicks;purchaseInteractionSeconds+=purchaseSeconds;spent+=cost;steps.push(step);phases.push({phase:0,startLevels:initialLevels.slice(),endLevels:levels.slice(),startHeld:initialHeld,endHeld:held,startPrestigeCount:initialPrestigeCount,endPrestigeCount:prestigeCount,prestigesDuring:funding.runs,spend:cost,waitSeconds:funding.gameSeconds??funding.seconds,interactionSeconds:(funding.interactionSeconds||0)+purchaseSeconds,purchaseClicks:levelClicks,core:policy.core.slice(),prestigeCore:(policy.prestigeCore||policy.core).slice(),manualCoreReallocation:!!policy.manualCoreReallocation,slowdown:policy.slowdown,targetLevel:policy.targetLevel,actualPrestigeLevel:policy.actualPrestigeLevel,prestigeSchedule:(policy.prestigeSchedule||[]).map(x=>({...x})),cycleSeconds:policy.seconds,rateBefore:policy.rate,rateAfter:nextPolicy.rate,etaBefore:baselineEta,etaAfter:elapsed+Math.max(0,finite(nextPolicy.totalEta,nextPolicy.eta)),changes:[{index:6,name:INGOT.names[6],from,to,cost}],strategicPrerequisite:true});policy=nextPolicy;stallPrerequisiteApplied=true;
      }
    }

    let skipBeam=false;
    const ascensionLevel=Math.max(0,Math.floor(finite(postBootstrapInput.ascensionCount))),matureCapital=levels[1]>=20&&levels[2]>=20&&levels[3]>=20&&levels[5]>=20&&levels[6]>=INGOT.optimizerCap[6]&&levels[7]>=20;
    if(ascensionLevel>=8){
      let capitalized=matureCapital;
      if(!capitalized&&runsToGoal(held,prestigeCount,policy)>1){
        const capitalStartLevels=levels.slice(),capitalStartHeld=held,capitalStartEarned=totalEarned,capitalStartPrestige=prestigeCount,capitalStartCore=Array.isArray(currentCoreLevels)?currentCoreLevels.slice():null,capitalStartSlow=currentSlowdownLevel,capitalStartEta=finishEta(0,held,prestigeCount,policy),capitalBudget=held+Math.max(0,finite(policy.firstRunGain,policy.gain));
        const perSlot=Math.max(0,capitalBudget/8),capitalTarget=levels.map((from,i)=>Math.max(from,Math.min(INGOT.optimizerCap[i],Math.floor(Math.log2(perSlot/INGOT.baseCost[i]+1)))));
        if(capitalTarget[5]>0)capitalTarget[6]=Math.max(capitalTarget[6],INGOT.optimizerCap[6]);
        let capitalCost=capitalTarget.reduce((s,to,i)=>s+incrementalIngotCost(i,levels[i],to),0),capitalFunding=fundingToBuy(policy,held,capitalCost),capitalClicks=capitalTarget.reduce((s,to,i)=>s+Math.max(0,to-levels[i]),0),capitalPurchaseSeconds=capitalClicks/uiClickRate;
        if(capitalCost>0&&capitalFunding.complete&&capitalFunding.runs<=1&&!(capitalFunding.runs>=runsToGoal(held,prestigeCount,policy)&&capitalFunding.runs>0)){
          const fundedHeld=held+capitalFunding.gain,capitalHeld=fundedHeld-capitalCost,capitalEarned=totalEarned+capitalFunding.gain,capitalPrestige=prestigeCount+capitalFunding.runs,capitalCore=capitalFunding.runs>0?policy.core.slice():currentCoreLevels,capitalSlow=capitalFunding.runs>0?slowdownLevel(policy.slowdown):currentSlowdownLevel;
          let capitalPolicy=fixedPolicy(policy,capitalTarget,capitalHeld,capitalEarned,capitalPrestige,capitalCore,capitalSlow),capitalTotal=capitalPolicy?capitalFunding.seconds+capitalPurchaseSeconds+Math.max(0,finite(capitalPolicy.totalEta,capitalPolicy.eta)):Infinity;
          if(capitalPolicy&&capitalTotal<capitalStartEta*(1-minImprovement)){
            // The common cost frontier deliberately over-seeds cheap upgrades so
            // joint effects (EXP × damage × feed × rarity) are visible at once.
            // Trim whole coordinates back to the imported level when doing so is
            // faster under the re-optimized capitalized policy. Stall Recovery is
            // retained whenever Rare Value is active.
            for(let pass=0;pass<2;pass++){
              let removed=false;
              for(let i=0;i<8;i++){
                if(capitalTarget[i]===capitalStartLevels[i]||(i===6&&capitalTarget[5]>0))continue;
                const trial=capitalTarget.slice();trial[i]=capitalStartLevels[i];const trialCost=trial.reduce((s,to,j)=>s+incrementalIngotCost(j,capitalStartLevels[j],to),0),trialFunding=fundingToBuy(policy,capitalStartHeld,trialCost);if(!trialFunding.complete||trialFunding.runs>1)continue;
                const trialHeld=capitalStartHeld+trialFunding.gain-trialCost,trialEarned=capitalStartEarned+trialFunding.gain,trialPrestige=capitalStartPrestige+trialFunding.runs,trialCore=trialFunding.runs>0?policy.core.slice():capitalStartCore,trialSlow=trialFunding.runs>0?slowdownLevel(policy.slowdown):capitalStartSlow,trialPolicy=fixedPolicy(capitalPolicy,trial,trialHeld,trialEarned,trialPrestige,trialCore,trialSlow);if(!trialPolicy)continue;
                const trialClicks=trial.reduce((s,to,j)=>s+Math.max(0,to-capitalStartLevels[j]),0),trialTotal=trialFunding.seconds+trialClicks/uiClickRate+Math.max(0,finite(trialPolicy.totalEta,trialPolicy.eta));
                if(trialTotal<capitalTotal-1e-9){capitalTarget.splice(0,capitalTarget.length,...trial);capitalCost=trialCost;capitalFunding=trialFunding;capitalClicks=trialClicks;capitalPurchaseSeconds=trialClicks/uiClickRate;capitalPolicy=trialPolicy;capitalTotal=trialTotal;removed=true}
              }
              if(!removed)break;
            }
            if(capitalTotal<capitalStartEta*(1-minImprovement)){
              const replannedCapital=fullPolicy(capitalTarget,capitalStartHeld+capitalFunding.gain-capitalCost,capitalStartEarned+capitalFunding.gain,capitalStartPrestige+capitalFunding.runs,capitalFunding.runs>0?policy.core.slice():capitalStartCore,capitalFunding.runs>0?slowdownLevel(policy.slowdown):capitalStartSlow),replannedTotal=replannedCapital?capitalFunding.seconds+capitalPurchaseSeconds+Math.max(0,finite(replannedCapital.totalEta,replannedCapital.eta)):Infinity;
              if(replannedCapital&&replannedTotal<capitalStartEta*(1-minImprovement)){capitalPolicy=replannedCapital;capitalTotal=replannedTotal}else{capitalPolicy=null}
            }
            if(capitalPolicy&&capitalTotal<capitalStartEta*(1-minImprovement)){
              const funded=capitalStartHeld+capitalFunding.gain,ordered=capitalTarget.map((to,i)=>({i,to})).filter(x=>x.to>capitalStartLevels[x.i]).sort((a,b)=>(a.i===6?-1:b.i===6?1:a.i-b.i));let runningHeld=funded,first=true;
              for(const {i,to} of ordered){const from=capitalStartLevels[i],cost=incrementalIngotCost(i,from,to),clicks=to-from,runningLevels=levels.slice();runningLevels[i]=to;runningHeld-=cost;levels[i]=to;steps.push({index:i,name:INGOT.names[i],fromLevel:from,level:to,levels:runningLevels,cost,waitSeconds:first?(capitalFunding.gameSeconds??capitalFunding.seconds):0,prestigeInteractionSeconds:first?(capitalFunding.interactionSeconds||0):0,levelClicks:clicks,interactionSeconds:clicks/uiClickRate,prestigesBeforeBuy:first?capitalFunding.runs:0,buyAt:first?funded:runningHeld+cost,effect:ingotEffect(i,to),rateBefore:policy.rate,rateAfter:capitalPolicy.rate,hourlyBefore:policy.rate*3600,hourlyAfter:capitalPolicy.rate*3600,heldBefore:first?capitalStartHeld:runningHeld+cost,heldAfter:runningHeld,prestigeBefore:first?capitalStartPrestige:capitalStartPrestige+capitalFunding.runs,prestigeAfter:capitalStartPrestige+capitalFunding.runs,totalEarnedAfter:capitalStartEarned+capitalFunding.gain,etaAfter:capitalTotal,bulk:to>from+1,capitalization:true,phase:1});first=false}
              held=capitalStartHeld+capitalFunding.gain-capitalCost;totalEarned=capitalStartEarned+capitalFunding.gain;prestigeCount=capitalStartPrestige+capitalFunding.runs;currentCoreLevels=capitalFunding.runs>0?policy.core.slice():capitalStartCore;currentSlowdownLevel=capitalFunding.runs>0?slowdownLevel(policy.slowdown):capitalStartSlow;elapsed+=capitalFunding.seconds+capitalPurchaseSeconds;spent+=capitalCost;purchaseClicks+=capitalClicks;purchaseInteractionSeconds+=capitalPurchaseSeconds;
              phases.push({phase:1,startLevels:capitalStartLevels,endLevels:levels.slice(),startHeld:capitalStartHeld,endHeld:held,startPrestigeCount:capitalStartPrestige,endPrestigeCount:prestigeCount,prestigesDuring:capitalFunding.runs,spend:capitalCost,waitSeconds:capitalFunding.gameSeconds??capitalFunding.seconds,interactionSeconds:(capitalFunding.interactionSeconds||0)+capitalPurchaseSeconds,purchaseClicks:capitalClicks,core:policy.core.slice(),prestigeCore:(policy.prestigeCore||policy.core).slice(),manualCoreReallocation:!!policy.manualCoreReallocation,slowdown:policy.slowdown,targetLevel:policy.targetLevel,actualPrestigeLevel:policy.actualPrestigeLevel,prestigeSchedule:(policy.prestigeSchedule||[]).map(x=>({...x})),cycleSeconds:policy.seconds,rateBefore:policy.rate,rateAfter:capitalPolicy.rate,etaBefore:capitalStartEta,etaAfter:elapsed+Math.max(0,finite(capitalPolicy.totalEta,capitalPolicy.eta)),changes:aggregateChanges(steps.filter(x=>x.phase===1),capitalStartLevels),capitalization:true});
              policy=capitalPolicy;capitalized=true;
            }
          }
        }
      }
      if(capitalized){
        // Above the capital floor, costs double every level while the upgrade
        // effects grow only linearly/quadratically. Search the local marginal
        // frontier instead of reopening the low-level combinatorial beam. Repeat
        // after one full Core/Slowdown replan so cross-effects still get a chance
        // to move the optimum.
        for(let pass=0;pass<2&&steps.length<maxSteps;pass++){
          const localStartLevels=levels.slice(),localStartHeld=held,localStartPrestige=prestigeCount,localStartRate=policy.rate,localStartEta=finishEta(0,held,prestigeCount,policy);let localSteps=[];
          for(let i=0;i<8&&steps.length+localSteps.length<maxSteps;i++){
            for(;;){
              if(!canOptimizeIngot(i,levels[i]))break;if(i===5&&levels[6]<INGOT.optimizerCap[6])break;
              const fromLevel=levels[i],maxAffordable=maxAffordableIngotLevel(i,fromLevel,held),targets=new Set([fromLevel+1]);
              if(maxAffordable>fromLevel){targets.add(maxAffordable);if(maxAffordable-1>fromLevel)targets.add(maxAffordable-1);if(fromLevel+2<=maxAffordable)targets.add(fromLevel+2)}
              let bestJump=null,currentEta=Math.max(0,finite(policy.totalEta,policy.eta));
              const evaluated=new Map(),evaluateJump=to=>{
                if(to<=fromLevel||to>INGOT.optimizerCap[i])return null;
                if(evaluated.has(to))return evaluated.get(to);
                const cost=incrementalIngotCost(i,fromLevel,to);if(cost>held+1e-9){evaluated.set(to,null);return null}
                const nextLevels=levels.slice();nextLevels[i]=to;const clicks=to-fromLevel,purchaseSeconds=clicks/uiClickRate,candidate=fixedPolicy(policy,nextLevels,held-cost,totalEarned,prestigeCount,currentCoreLevels,currentSlowdownLevel);if(!candidate){evaluated.set(to,null);return null}
                const row={to,cost,clicks,purchaseSeconds,candidate,total:purchaseSeconds+Math.max(0,finite(candidate.totalEta,candidate.eta))};evaluated.set(to,row);return row;
              };
              const chooseJump=row=>{if(row&&row.total<currentEta*(1-minImprovement)&&(!bestJump||row.total<bestJump.total-1e-9||(Math.abs(row.total-bestJump.total)<1e-9&&row.clicks<bestJump.clicks)))bestJump=row};
              for(const to of targets)chooseJump(evaluateJump(to));
              if(!bestJump)break;
              // Sparse +1/+2/max probes locate a profitable region quickly, but
              // their chosen high endpoint can sit on a discrete ETA plateau.
              // Tighten that endpoint to the cheapest level that is at least as
              // good. Small jumps are cheap enough to verify exactly; larger
              // jumps use a lower-bound search and then verify its neighborhood.
              const plateauTotal=bestJump.total,span=bestJump.to-fromLevel;
              if(span<=16){
                for(let to=fromLevel+1;to<bestJump.to;to++){const row=evaluateJump(to);if(row&&row.total<=plateauTotal+1e-9)chooseJump(row)}
              }else{
                let lo=fromLevel+1,hi=bestJump.to;
                while(lo<hi){const mid=(lo+hi)>>1,row=evaluateJump(mid);if(row&&row.total<=plateauTotal+1e-9)hi=mid;else lo=mid+1}
                for(let to=Math.max(fromLevel+1,lo-2);to<=Math.min(bestJump.to,lo+2);to++){const row=evaluateJump(to);if(row&&row.total<=plateauTotal+1e-9)chooseJump(row)}
              }
              const beforeHeld=held,beforeLevel=fromLevel;levels=levels.slice();levels[i]=bestJump.to;held-=bestJump.cost;spent+=bestJump.cost;elapsed+=bestJump.purchaseSeconds;purchaseClicks+=bestJump.clicks;purchaseInteractionSeconds+=bestJump.purchaseSeconds;localSteps.push({index:i,name:INGOT.names[i],fromLevel:beforeLevel,level:bestJump.to,levels:levels.slice(),cost:bestJump.cost,waitSeconds:0,prestigeInteractionSeconds:0,levelClicks:bestJump.clicks,interactionSeconds:bestJump.purchaseSeconds,prestigesBeforeBuy:0,buyAt:beforeHeld,effect:ingotEffect(i,bestJump.to),rateBefore:policy.rate,rateAfter:bestJump.candidate.rate,hourlyBefore:policy.rate*3600,hourlyAfter:bestJump.candidate.rate*3600,heldBefore:beforeHeld,heldAfter:held,prestigeBefore:prestigeCount,prestigeAfter:prestigeCount,totalEarnedAfter:totalEarned,etaAfter:elapsed+Math.max(0,finite(bestJump.candidate.totalEta,bestJump.candidate.eta)),bulk:bestJump.to>beforeLevel+1,capitalizationPolish:true,phase:phases.length+1});policy=bestJump.candidate;
            }
          }
          if(!localSteps.length)break;
          steps.push(...localSteps);const phaseNo=phases.length+1;policy=fullPolicy(levels,held,totalEarned,prestigeCount,currentCoreLevels,currentSlowdownLevel)||policy;phases.push({phase:phaseNo,startLevels:localStartLevels,endLevels:levels.slice(),startHeld:localStartHeld,endHeld:held,startPrestigeCount:localStartPrestige,endPrestigeCount:prestigeCount,prestigesDuring:0,spend:localSteps.reduce((s,x)=>s+x.cost,0),waitSeconds:0,interactionSeconds:localSteps.length/uiClickRate,purchaseClicks:localSteps.length,core:policy.core.slice(),prestigeCore:(policy.prestigeCore||policy.core).slice(),manualCoreReallocation:!!policy.manualCoreReallocation,slowdown:policy.slowdown,targetLevel:policy.targetLevel,actualPrestigeLevel:policy.actualPrestigeLevel,prestigeSchedule:(policy.prestigeSchedule||[]).map(x=>({...x})),cycleSeconds:policy.seconds,rateBefore:localStartRate,rateAfter:policy.rate,etaBefore:elapsed-localSteps.length/uiClickRate+localStartEta,etaAfter:elapsed+Math.max(0,finite(policy.totalEta,policy.eta)),changes:aggregateChanges(localSteps,localStartLevels),capitalizationPolish:true});
        }
        stopReason='marginal_no_gain';skipBeam=true;
      }
    }

    const beamFirstPhase=phases.length+1;
    for(let phaseNo=beamFirstPhase;!skipBeam&&phaseNo<=maxPhases&&steps.length<maxSteps;phaseNo++){
      const phaseStartLevels=levels.slice(),phaseStartHeld=held,phaseStartEarned=totalEarned,phaseStartPrestige=prestigeCount,phaseStartRate=policy.rate,phaseStartEta=finishEta(0,held,prestigeCount,policy);
      const phaseStartCore=Array.isArray(currentCoreLevels)?currentCoreLevels.slice():null,phaseStartSlowdown=currentSlowdownLevel;
      let beam=[{levels:levels.slice(),held,totalEarned,prestigeCount,currentCoreLevels:phaseStartCore,currentSlowdownLevel:phaseStartSlowdown,elapsed:0,spent:0,rate:policy.rate,policy,path:[],immediateOrder:-1}],best=null;
      const seen=new Map([[keyFor(levels,prestigeCount,held),phaseStartEta]]);

      for(let depth=1;depth<=phaseDepth&&steps.length+depth<=maxSteps;depth++){
        const generated=[];
        for(const node of beam){
          const goalRuns=runsToGoal(node.held,node.prestigeCount,node.policy);
          for(let i=0;i<8;i++){
            if(!canOptimizeIngot(i,node.levels[i]))continue;
            for(const targetLevel of bulkTargets(node,i,goalRuns)){
              const fromLevel=node.levels[i],baseCost=incrementalIngotCost(i,fromLevel,targetLevel);if(!(baseCost>0)&&targetLevel>fromLevel)continue;
              const nextLevels=node.levels.slice(),needsStallPrerequisite=i===5&&nextLevels[6]<INGOT.optimizerCap[6],stallFrom=nextLevels[6],stallTo=INGOT.optimizerCap[6],stallCost=needsStallPrerequisite?incrementalIngotCost(6,stallFrom,stallTo):0,cost=baseCost+stallCost;
              if(steps.length+node.path.length+(needsStallPrerequisite?2:1)>maxSteps)continue;
              nextLevels[i]=targetLevel;if(needsStallPrerequisite)nextLevels[6]=stallTo;
              const funding=fundingToBuy(node.policy,node.held,cost);if(!funding.complete)continue;const runsBeforeBuy=funding.runs;
              // Purchases with no intervening Prestige commute: they consume the
              // same held Ingots and click time and reach the same Markov state.
              // Canonicalize only those zero-wait runs; a Prestige resets the
              // ordering because the funding trigger itself can change timing.
              if(runsBeforeBuy===0&&node.immediateOrder>=0&&i<node.immediateOrder)continue;
              // Ingots only arrive at Prestige. If the factory would satisfy both
              // Ascension conditions on or before the Prestige that funds this buy,
              // buying it cannot shorten the current Ascension.
              if(runsBeforeBuy>=goalRuns&&runsBeforeBuy>0)continue;
              const wait=funding.seconds,purchaseLevelClicks=(targetLevel-fromLevel)+(needsStallPrerequisite?stallTo-stallFrom:0),purchaseSeconds=purchaseLevelClicks/uiClickRate,fundedHeld=node.held+funding.gain,nextHeld=fundedHeld-cost,nextEarned=node.totalEarned+funding.gain,nextPrestige=node.prestigeCount+runsBeforeBuy,nextCurrentCore=runsBeforeBuy>0?node.policy.core.slice():(Array.isArray(node.currentCoreLevels)?node.currentCoreLevels.slice():null),nextCurrentSlowdown=runsBeforeBuy>0?slowdownLevel(node.policy.slowdown):node.currentSlowdownLevel;
              const candidate=fixedPolicy(node.policy,nextLevels,nextHeld,nextEarned,nextPrestige,nextCurrentCore,nextCurrentSlowdown);if(!candidate)continue;
              const localElapsed=node.elapsed+wait+purchaseSeconds,eta=finishEta(localElapsed,nextHeld,nextPrestige,candidate),k=keyFor(nextLevels,nextPrestige,nextHeld);
              const prior=seen.get(k);if(prior!==undefined&&prior<=eta+1e-9)continue;seen.set(k,eta);
              const pathSteps=[];
              if(needsStallPrerequisite){
                const intermediate=node.levels.slice(),stallClicks=stallTo-stallFrom;intermediate[6]=stallTo;pathSteps.push({index:6,name:INGOT.names[6],fromLevel:stallFrom,level:stallTo,levels:intermediate,cost:stallCost,waitSeconds:funding.gameSeconds??wait,prestigeInteractionSeconds:funding.interactionSeconds||0,levelClicks:stallClicks,interactionSeconds:stallClicks/uiClickRate,prestigesBeforeBuy:runsBeforeBuy,buyAt:fundedHeld,effect:ingotEffect(6,stallTo),rateBefore:node.policy.rate,rateAfter:node.policy.rate,hourlyBefore:node.policy.rate*3600,hourlyAfter:node.policy.rate*3600,heldBefore:node.held,heldAfter:fundedHeld-stallCost,prestigeBefore:node.prestigeCount,prestigeAfter:nextPrestige,totalEarnedAfter:nextEarned,etaAfter:eta,bulk:stallTo>stallFrom+1,strategicPrerequisite:true});
              }
              pathSteps.push({index:i,name:INGOT.names[i],fromLevel,level:targetLevel,levels:nextLevels.slice(),cost:baseCost,waitSeconds:needsStallPrerequisite?0:(funding.gameSeconds??wait),prestigeInteractionSeconds:needsStallPrerequisite?0:(funding.interactionSeconds||0),levelClicks:targetLevel-fromLevel,interactionSeconds:(targetLevel-fromLevel)/uiClickRate,prestigesBeforeBuy:needsStallPrerequisite?0:runsBeforeBuy,buyAt:needsStallPrerequisite?fundedHeld-stallCost:fundedHeld,effect:ingotEffect(i,targetLevel),rateBefore:node.policy.rate,rateAfter:candidate.rate,hourlyBefore:node.policy.rate*3600,hourlyAfter:candidate.rate*3600,heldBefore:needsStallPrerequisite?fundedHeld-stallCost:node.held,heldAfter:nextHeld,prestigeBefore:needsStallPrerequisite?nextPrestige:node.prestigeCount,prestigeAfter:nextPrestige,totalEarnedAfter:nextEarned,etaAfter:eta,bulk:targetLevel>fromLevel+1});
              const child={levels:nextLevels,held:nextHeld,totalEarned:nextEarned,prestigeCount:nextPrestige,currentCoreLevels:nextCurrentCore,currentSlowdownLevel:nextCurrentSlowdown,elapsed:localElapsed,spent:node.spent+cost,rate:candidate.rate,policy:candidate,path:node.path.concat(pathSteps),eta,immediateOrder:runsBeforeBuy===0?Math.max(node.immediateOrder,i):-1};generated.push(child);
              if(!best||eta<best.eta)best=child;
            }
          }
        }
        if(!generated.length)break;
        generated.sort((a,b)=>a.eta-b.eta||b.rate-a.rate||a.spent-b.spent);
        beam=generated.slice(0,beamWidth);
      }

      if(!best||!(best.eta<phaseStartEta*(1-minImprovement))){stopReason='marginal_no_gain';break}

      levels=best.levels.slice();held=best.held;totalEarned=best.totalEarned;prestigeCount=best.prestigeCount;currentCoreLevels=Array.isArray(best.currentCoreLevels)?best.currentCoreLevels.slice():null;currentSlowdownLevel=best.currentSlowdownLevel;elapsed+=best.elapsed;spent+=best.spent;
      const phaseSteps=best.path.map(x=>({...x,phase:phaseNo})),phasePurchaseClicks=phaseSteps.reduce((s,x)=>s+Math.max(0,finite(x.levelClicks)),0),phasePurchaseInteraction=phaseSteps.reduce((s,x)=>s+Math.max(0,finite(x.interactionSeconds)),0),phasePrestigeInteraction=phaseSteps.reduce((s,x)=>s+Math.max(0,finite(x.prestigeInteractionSeconds)),0);purchaseClicks+=phasePurchaseClicks;purchaseInteractionSeconds+=phasePurchaseInteraction;steps.push(...phaseSteps);
      const fixedAfter=fixedPolicy(policy,levels,held,totalEarned,prestigeCount,best.currentCoreLevels,best.currentSlowdownLevel)||best.policy;
      const phase={phase:phaseNo,startLevels:phaseStartLevels,endLevels:levels.slice(),startHeld:phaseStartHeld,endHeld:held,startPrestigeCount:phaseStartPrestige,endPrestigeCount:prestigeCount,prestigesDuring:prestigeCount-phaseStartPrestige,spend:best.spent,waitSeconds:Math.max(0,best.elapsed-phasePurchaseInteraction-phasePrestigeInteraction),interactionSeconds:phasePurchaseInteraction+phasePrestigeInteraction,purchaseClicks:phasePurchaseClicks,core:policy.core.slice(),prestigeCore:(policy.prestigeCore||policy.core).slice(),manualCoreReallocation:!!policy.manualCoreReallocation,slowdown:policy.slowdown,targetLevel:policy.targetLevel,actualPrestigeLevel:policy.actualPrestigeLevel,prestigeSchedule:(policy.prestigeSchedule||[]).map(x=>({...x})),cycleSeconds:policy.seconds,rateBefore:phaseStartRate,rateAfter:fixedAfter.rate,etaBefore:elapsed-best.elapsed+phaseStartEta,etaAfter:elapsed+finishEta(0,held,prestigeCount,fixedAfter),changes:aggregateChanges(best.path,phaseStartLevels)};
      phases.push(phase);

      policy=fullPolicy(levels,held,totalEarned,prestigeCount,currentCoreLevels,currentSlowdownLevel);if(!policy){stopReason='replan_failed';break}
      if(runsToGoal(held,prestigeCount,policy)===0){stopReason='requirement_reached';break}
      if(steps.length>=maxSteps){stopReason='search_limit';break}
    }

    const finalResult=fullResult(levels,held,totalEarned,prestigeCount,currentCoreLevels,currentSlowdownLevel),finalPlan=finalResult&&finalResult.plan?{...finalResult.plan,calibration:finalResult.calibration}:policy,plannedRunsRemaining=runsToGoal(held,prestigeCount,finalPlan);
    const plannedEta=elapsed+Math.max(0,finite(finalPlan.totalEta,finalPlan.eta)),timeSaved=Math.max(0,baselineEta-plannedEta),converged=stopReason==='marginal_no_gain'||stopReason==='requirement_reached';
    const copyFinalPlan=p=>p?{...p,core:p.core.slice(),runCore:(p.runCore||p.core).slice(),prestigeCore:(p.prestigeCore||p.core).slice(),manualCoreReallocation:!!p.manualCoreReallocation,strategyMode:p.strategyMode||(p.manualCoreReallocation?'manual':'fixed'),prestigeSchedule:(p.prestigeSchedule||[]).map(x=>({...x}))}:null,finalPhasePlan=copyFinalPlan(finalPlan),finalFixedPlan=copyFinalPlan(finalResult&&finalResult.fixedPlan),finalManualPlan=copyFinalPlan(finalResult&&finalResult.manualPlan),finalNearAlternatives=(finalResult&&finalResult.nearAlternatives||[]).map(copyFinalPlan);
    const bootstrapSeconds=plan.bootstrap&&plan.bootstrap.needed?Math.max(0,finite(plan.bootstrap.seconds)):0,bootstrapInteractionSeconds=plan.bootstrap&&plan.bootstrap.needed?Math.max(0,finite(plan.bootstrap.interactionSeconds)):0;
    return {steps,phases,targetLevels:levels.slice(),initialLevels,initialHeld,initialPrestigeCount,finalHeld:held,finalTotalIngotsEarned:totalEarned,finalPrestigeCount:prestigeCount,finalCurrentCoreLevels:Array.isArray(currentCoreLevels)?currentCoreLevels.slice():null,finalCurrentSlowdownLevel:currentSlowdownLevel,spent,purchaseClicks,purchaseInteractionSeconds,uiClickRate,simulatedWaitSeconds:elapsed,postBootstrapState:postBootstrapInput,baselineEta,plannedEta,timeSaved,bootstrapSeconds,bootstrapInteractionSeconds,totalPlannedEta:plannedEta+bootstrapSeconds+bootstrapInteractionSeconds,plannedRunsRemaining,stopReason,converged,nodesEvaluated,replans,stallPrerequisiteApplied,finalRate:finalPlan.rate,finalTargetLevel:finalPlan.targetLevel,finalActualPrestigeLevel:finalPlan.actualPrestigeLevel,finalCycleSeconds:finalPlan.seconds,finalGain:finalPlan.gain,finalPrestigeSchedule:(finalPlan.prestigeSchedule||[]).map(x=>({...x})),finalPlan:finalPhasePlan,finalFixedPlan,finalManualPlan,finalRecommendedMode:finalResult&&finalResult.recommendedMode||finalPhasePlan.strategyMode,finalNearAlternatives};
  }

  function completeAscensionState(input,ascensionResult,roadmap){
    const plan=ascensionResult&&ascensionResult.plan,req=Math.max(0,finite(ascensionResult&&ascensionResult.nextRequirement,nextAscensionRequirement(input&&input.ascensionCount)));
    if(!plan)return {completed:false,reason:'no_plan'};
    const post=roadmap&&roadmap.postBootstrapState||plan.bootstrap&&plan.bootstrap.postState||input||{};
    let held=Math.max(0,finite(roadmap&&roadmap.finalHeld,post.heldIngots)),totalEarned=Math.max(0,finite(roadmap&&roadmap.finalTotalIngotsEarned,post.totalIngotsEarned)),prestigeCount=Math.max(0,Math.floor(finite(roadmap&&roadmap.finalPrestigeCount,post.prestigeCount)));
    const schedule=roadmap&&roadmap.finalPrestigeSchedule||plan.prestigeSchedule||[];
    let finalRunSeconds=0,finalRunGain=0,finalRuns=0;
    for(const part of schedule){
      const runs=Math.max(0,Math.floor(finite(part&&part.runs))),gain=Math.max(0,finite(part&&part.totalGain,finite(part&&part.gain)*runs)),seconds=Math.max(0,finite(part&&part.totalSeconds,finite(part&&part.seconds)*runs));
      finalRuns+=runs;finalRunGain+=gain;finalRunSeconds+=seconds;
    }
    held+=finalRunGain;totalEarned+=finalRunGain;prestigeCount+=finalRuns;
    const a=Math.max(0,Math.floor(finite(input&&input.ascensionCount,ascensionResult&&ascensionResult.ascensionCount))),levels=(roadmap&&roadmap.targetLevels||input&&input.ingotLevels||Array(8).fill(0)).slice();
    const completed=held+1e-6>=req&&prestigeCount>=25,eta=roadmap?Math.max(0,finite(roadmap.totalPlannedEta,finite(roadmap.plannedEta))):Math.max(0,finite(plan.totalEta,plan.eta));
    const finalState={...input,ascensionCount:a,totalCore:Math.max(0,finite(input&&input.totalCore,totalCoreForAscension(a))),heldIngots:held,totalIngotsEarned:totalEarned,prestigeCount,normalAutoUnlocked:true,ingotLevels:levels};
    const nextBase=afterAscensionState({...input,ascensionCount:a}),nextState={...nextBase,objective:'ascensionEta',totalCore:totalCoreForAscension(nextBase.ascensionCount)};
    return {completed,reason:completed?'complete':'requirements_not_met',eta,requirement:req,finalRuns,finalRunSeconds,finalRunGain,finalState,nextState};
  }

  function ascensionSearchMaxLevel(ascensionCount,ingotLevels){
    const a=Math.max(0,Math.floor(finite(ascensionCount))),levels=ingotLevels||Array(8).fill(0),byAsc=3000+250*Math.max(0,a-10),byExp=3000+100*Math.max(0,finite(levels[1])-30);
    return Math.min(10000,Math.max(3000,byAsc,byExp));
  }

  function optimizeTargetLevel(input,targetLevel,measurements){
    const target=Math.max(1,Math.floor(finite(targetLevel,10000))),a=Math.max(0,Math.floor(finite(input&&input.ascensionCount))),totalCore=Math.max(0,finite(input&&input.totalCore,totalCoreForAscension(a))),ingot=(input&&input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),cal=fitCalibration(measurements,input&&input.normalAutoUpdatesPerSecond),totalEarned=Math.max(0,finite(input&&input.totalIngotsEarned));
    let best=null;
    // A no-Prestige deep run gets no benefit from Core Ingot, so pin it to zero
    // and spend the remaining Core only on progression-affecting upgrades.
    for(const cand of paretoCoreCandidates(totalCore,0)){
      for(const slowdown of progressionSlowdownCandidates(cand.core,ingot,cal.physicalCap)){
        const curve=simulateCurve({maxTarget:target,core:cand.core,ingot,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:totalEarned,dpsCalibration:input&&input.dpsCalibration,damageBoostMultiplier:input&&input.damageBoostMultiplier,hpCalibration:input&&input.hpCalibration,...compressionCurveOptions(input),normalAutoEnabled:true,normalAutoUpdatesPerSecond:input&&input.normalAutoUpdatesPerSecond,normalAutoCalibration:cal});
        const timing=timingResolver(curve,cal,cand.core,ingot,slowdown,measurements||[]),seconds=timing.secondsAt(target),row={targetLevel:target,seconds,core:cand.core.slice(),coreUsed:cand.used,coreLeft:cand.left,slowdown,maxSupplyCappedSlowdown:maxSupplyCappedSlowdown(cand.core,ingot,4),topSpawnAtTarget:curve.topSpawnRates[target],rawTopSpawnAtTarget:curve.rawTopSpawnRates[target],contactRateAtTarget:curve.contactRates[target],queuePressureAtTarget:curve.queuePressure[target],timingMeasurementCount:timing.points.length,timingValidated:timing.validated&&target>=timing.minLevel&&target<=timing.maxLevel,timingMinLevel:timing.minLevel,timingMaxLevel:timing.maxLevel};
        const tie=best&&Math.abs(row.seconds-best.seconds)<1e-9;
        if(!best||row.seconds<best.seconds-1e-9||(tie&&row.slowdown>best.slowdown))best=row;
      }
    }
    return {plan:best,calibration:cal,ascensionCount:a,totalCore,targetLevel:target};
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

  function normalBundleCostLog10(levels,costReduction=1){
    let total=-Infinity;
    for(let i=0;i<8;i++)for(let l=0;l<Math.max(0,Math.floor(finite(levels&&levels[i])));l++)total=log10Add(total,normalNextCostLog10(i,l,costReduction));
    return total;
  }

  function targetOreStats(opts){
    const level=Math.max(1,Math.floor(finite(opts&&opts.level,1))),normal=(opts&&opts.normalLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),core=(opts&&opts.coreLevels||DEFAULT_CORE).map(x=>Math.max(0,Math.floor(finite(x)))),ingot=(opts&&opts.ingotLevels||DEFAULT_INGOT_LEVELS).map(x=>Math.max(0,Math.floor(finite(x))));
    const totalEarned=Math.max(0,finite(opts&&opts.totalIngotsEarned)),slowdown=Math.max(1,finite(opts&&opts.slowdown,1)),dpsCalibration=Math.max(1e-300,finite(opts&&opts.dpsCalibration,1)),damageBoostMultiplier=Math.max(1e-300,finite(opts&&opts.damageBoostMultiplier,1)),hpCalibration=Math.max(1e-300,finite(opts&&opts.hpCalibration,1)),compressionE=Math.max(0,finite(opts&&opts.compressionE,0)),physicalCap=Math.max(.05,finite(opts&&opts.physicalCap,11));
    let baseDpsLog=dpsLog10(normal,ingot,core,totalEarned,dpsCalibration),liveDpsLog=baseDpsLog+Math.log10(damageBoostMultiplier);
    const override=Number(opts&&opts.liveDpsLogOverride);if(Number.isFinite(override)){liveDpsLog=override;baseDpsLog=override-Math.log10(damageBoostMultiplier)}
    const baseHp=baseOreHpLog10(level),tierLog=Math.log10(ORE_TIER_HP_MULTIPLIER),perkHpLog=Math.log10(slowdown)+Math.log10(hpCalibration)+compressionE;
    const hpNormal=[];
    for(let tier=0;tier<3;tier++){
      const raw=baseHp+tier*tierLog,cap=baseDpsLog+Math.log10(ORE_MAX_CRUSH_SECONDS)+tier*tierLog;
      hpNormal.push(softCapHpLog(raw,cap)+perkHpLog);
    }
    const hp={small:hpNormal[0],medium:hpNormal[1],large:hpNormal[2],largeOrichalcum:hpNormal[2]+Math.log10(ORICHALCUM_HP_MULTIPLIER)};
    const feed=normalEffect(7,normal[7]),spawn=topSpawnRate(core,ingot,feed,slowdown),terminalSupply=spawn.actual*expectedTerminalPerTop(level),rarity=rarityState(normal,ingot),avgOriHp=1+4*rarity.pOri,contactRate=physicalCap*terminalSupply/(physicalCap+terminalSupply),dpsKillRate=MAX_ZONE_ORES*pow10(liveDpsLog-hp.small)/avgOriHp,processed=Math.max(1e-12,Math.min(contactRate,dpsKillRate));
    const expectedIncomePerTerminalLog=rankingIncomeLog10(level,slowdown,core,ingot,totalEarned,normal[3],true)+compressionE,normalIncomePerTerminalLog=rankingIncomeLog10(level,slowdown,core,ingot,totalEarned,normal[3],false)+compressionE,incomePerSecondLog=expectedIncomePerTerminalLog+Math.log10(processed),supplySafeDpsLog=hp.small+Math.log10(Math.max(1e-300,contactRate*avgOriHp/MAX_ZONE_ORES));
    return {level,normalLevels:normal,coreLevels:core,ingotLevels:ingot,baseDpsLog,liveDpsLog,rawBaseHpLog:baseHp,hp,killSecondsLog:hp.largeOrichalcum-liveDpsLog,feed,topSpawn:spawn.actual,rawTopSpawn:spawn.raw,terminalSupply,contactRate,dpsKillRate,processedPerSecond:processed,queuePressure:terminalSupply/Math.max(1e-12,processed),rarity,avgOriHp,normalIncomePerTerminalLog,expectedIncomePerTerminalLog,incomePerSecondLog,supplySafeDpsLog,compressionE};
  }

  function requiredPreparedDpsLog10(opts){
    const level=Math.max(1,Math.floor(finite(opts&&opts.level,1))),slowdown=Math.max(1,finite(opts&&opts.slowdown,1)),hpCalibration=Math.max(1e-300,finite(opts&&opts.hpCalibration,1)),compressionE=Math.max(0,finite(opts&&opts.compressionE,0)),damageBoostMultiplier=Math.max(1e-300,finite(opts&&opts.damageBoostMultiplier,1)),targetSeconds=Math.max(.001,finite(opts&&opts.targetKillSeconds,1));
    const tierLog=2*Math.log10(ORE_TIER_HP_MULTIPLIER),raw=baseOreHpLog10(level)+tierLog,postCap=Math.log10(slowdown)+Math.log10(hpCalibration)+compressionE+Math.log10(ORICHALCUM_HP_MULTIPLIER),boostLog=Math.log10(damageBoostMultiplier),timeLog=Math.log10(targetSeconds);
    const hpAtBaseDps=baseDpsLog=>softCapHpLog(raw,baseDpsLog+Math.log10(ORE_MAX_CRUSH_SECONDS)+tierLog)+postCap;
    const margin=baseDpsLog=>baseDpsLog+boostLog+timeLog-hpAtBaseDps(baseDpsLog);
    let lo=-1000,hi=raw+postCap-timeLog-boostLog+100;
    while(margin(hi)<0&&hi<1e7)hi+=Math.max(100,Math.abs(hi-lo));
    for(let i=0;i<96;i++){const mid=(lo+hi)/2;if(margin(mid)>=0)hi=mid;else lo=mid}
    return hi+boostLog;
  }

  function calculateRankingTarget(input){
    const level=Math.max(1,Math.floor(finite(input&&input.level,4885))),core=(input&&input.coreLevels||DEFAULT_CORE).map(x=>Math.max(0,Math.floor(finite(x)))),ingot=(input&&input.ingotLevels||DEFAULT_INGOT_LEVELS).map(x=>Math.max(0,Math.floor(finite(x)))),slowdown=Math.max(1,finite(input&&input.slowdown,1)),physicalCap=Math.max(.05,finite(input&&input.physicalCap,11)),common={level,coreLevels:core,ingotLevels:ingot,totalIngotsEarned:Math.max(0,finite(input&&input.totalIngotsEarned)),slowdown,dpsCalibration:input&&input.dpsCalibration,damageBoostMultiplier:input&&input.damageBoostMultiplier,hpCalibration:input&&input.hpCalibration,compressionE:input&&input.compressionE,physicalCap};
    const off=targetOreStats({...common,normalLevels:Array(8).fill(0)}),curve=simulateCurve({maxTarget:level+1,core,ingot,slowdown,physicalCap,totalIngotsEarned:common.totalIngotsEarned,dpsCalibration:common.dpsCalibration,damageBoostMultiplier:common.damageBoostMultiplier,hpCalibration:common.hpCalibration,compressionEnabled:Math.max(0,finite(common.compressionE))>0,compressionE:common.compressionE,compressionRequiredIngots:Math.max(0,finite(input&&input.nextRequirement,nextAscensionRequirement(input&&input.ascensionCount))),normalAutoEnabled:true,normalAutoUpdatesPerSecond:input&&input.normalAutoUpdatesPerSecond,normalAutoCalibration:input&&input.normalAutoCalibration}),autoLevels=(curve.normalUsedAtTarget||curve.normalAtTarget||Array(8).fill(0)).slice(),auto=targetOreStats({...common,normalLevels:autoLevels});
    const customLevels=Array.isArray(input&&input.customNormalLevels)&&input.customNormalLevels.length===8?input.customNormalLevels.map(x=>Math.max(0,Math.floor(finite(x)))):null,custom=customLevels?targetOreStats({...common,normalLevels:customLevels}):null,preparedLog=Number(input&&input.liveDpsLogOverride),prepared=Number.isFinite(preparedLog)?targetOreStats({...common,normalLevels:Array(8).fill(0),liveDpsLogOverride:preparedLog}):null,targetKillSeconds=Math.max(.001,finite(input&&input.targetKillSeconds,1)),requiredDpsLog=requiredPreparedDpsLog10({...common,targetKillSeconds}),autoPurchaseCount=autoLevels.reduce((a,b)=>a+b,0),autoSpendLog10=normalBundleCostLog10(autoLevels,coreEffect(3,core[3]));
    return {level,slowdown,compressionE:common.compressionE||0,targetKillSeconds,coreLevels:core,ingotLevels:ingot,off,auto,custom,prepared,requiredDpsLog,autoPurchaseCount,autoSpendLog10,autoDpsGainLog:auto.liveDpsLog-off.liveDpsLog,autoIncomeGainLog:auto.incomePerSecondLog-off.incomePerSecondLog,offRequiredMarginLog:off.liveDpsLog-requiredDpsLog,preparedRequiredMarginLog:prepared?prepared.liveDpsLog-requiredDpsLog:NaN};
  }

  function evaluateRankingCurve(curve,core,ingot,slowdown,cal,input){
    const duration=Math.max(60,finite(input.afkHours,8)*3600),available=Math.max(0,duration-finite(input.setupSeconds,0)),level=levelAtCalibratedTime(curve,cal,available),rare=curve.normalRareLevels?curve.normalRareLevels[level]:curve.normalAtTarget[3];
    const totalEarned=Math.max(0,finite(input.totalIngotsEarned)),compressionLog=Math.max(0,finite(curve&&curve.compressionE,0)),normalLog=rankingIncomeLog10(level,slowdown,core,ingot,totalEarned,rare,false)+compressionLog,expectedLog=rankingIncomeLog10(level,slowdown,core,ingot,totalEarned,rare,true)+compressionLog;
    const events=Math.max(1e-12,curve.contactRates[level]||curve.contactRateAtTarget||1),window=Math.max(1,Math.min(60,available));
    return {level,normalScoreLog:normalLog+Math.log10(Math.max(1,events*window)),expectedScoreLog:expectedLog+Math.log10(Math.max(1,events*window)),incomeLog:expectedLog,eventsPerSec:events,topSpawn:curve.topSpawnRates[level]||0,rawTopSpawn:curve.rawTopSpawnRates[level]||0,queuePressure:curve.queuePressure[level]||0};
  }

  function optimizeRanking(input,measurements){
    const a=Math.max(0,Math.floor(finite(input.ascensionCount,7))),totalCore=Math.max(0,finite(input.totalCore,totalCoreForAscension(a))),ingot=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),cal=fitCalibration(measurements,input.normalAutoUpdatesPerSecond);
    const maxTarget=Math.max(1000,Math.floor(finite(input.rankingMaxLevel,10000))),searchInput={...input,ascensionCount:a,totalCore,ingotLevels:ingot,strictOneShot:false};
    let bootstrap=optimizeNormalAutoBootstrap(searchInput,totalCore,ingot,cal);if(!bootstrap)return {plan:null,calibration:cal,totalCore};
    const post=bootstrap.postState||searchInput,totalEarned=Math.max(0,finite(post.totalIngotsEarned));let best=null;
    // Core Ingot is deliberately zero: no Prestige occurs during the ranking sleep run.
    for(const cand of paretoCoreCandidates(totalCore,0)){
      for(const slowdown of slowdownCandidates(cand.core,ingot,cal.physicalCap)){
        const curve=simulateCurve({maxTarget,core:cand.core,ingot,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:totalEarned,dpsCalibration:post.dpsCalibration,damageBoostMultiplier:post.damageBoostMultiplier,hpCalibration:post.hpCalibration,...compressionCurveOptions(post),normalAutoEnabled:true,normalAutoUpdatesPerSecond:post.normalAutoUpdatesPerSecond,normalAutoCalibration:cal});
        const ev=evaluateRankingCurve(curve,cand.core,ingot,slowdown,cal,{...post,afkHours:input.afkHours,setupSeconds:bootstrap.seconds});
        const row={core:cand.core.slice(),coreUsed:cand.used,coreLeft:cand.left,ingot:ingot.slice(),slowdown,bootstrap,...ev,durationSeconds:Math.max(60,finite(input.afkHours,8)*3600)};
        if(!best||row.expectedScoreLog>best.expectedScoreLog+1e-12||(Math.abs(row.expectedScoreLog-best.expectedScoreLog)<1e-12&&row.normalScoreLog>best.normalScoreLog))best=row;
      }
    }
    return {plan:best,calibration:cal,totalCore,ascensionCount:a};
  }

  function optimizeRankingIngotUpgrades(input,rankingResult,measurements,maxSteps=48){
    const base=rankingResult&&rankingResult.plan;if(!base)return {steps:[],targetLevels:(input.ingotLevels||Array(8).fill(0)).slice(),spent:0};
    const cal=rankingResult.calibration||fitCalibration(measurements,input.normalAutoUpdatesPerSecond),totalCore=Math.max(0,finite(input.totalCore,totalCoreForAscension(input.ascensionCount))),duration=Math.max(60,finite(input.afkHours,8)*3600);
    let levels=(input.ingotLevels||Array(8).fill(0)).map(x=>Math.max(0,Math.floor(finite(x)))),held=Math.max(0,finite(input.heldIngots)),spent=0,steps=[],core=base.core.slice(),slowdown=base.slowdown,currentScore=base.expectedScoreLog;
    function fixedScore(candidateLevels){
      const curve=simulateCurve({maxTarget:Math.max(1000,Math.floor(finite(input.rankingMaxLevel,10000))),core,ingot:candidateLevels,slowdown,physicalCap:cal.physicalCap,totalIngotsEarned:input.totalIngotsEarned,dpsCalibration:input.dpsCalibration,damageBoostMultiplier:input.damageBoostMultiplier,hpCalibration:input.hpCalibration,...compressionCurveOptions(input),normalAutoEnabled:true,normalAutoUpdatesPerSecond:input.normalAutoUpdatesPerSecond,normalAutoCalibration:cal});
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

  function formatShort(v){return Number(v.toFixed(2)).toString()}
  function formatNumber(v){
    v=finite(v);if(v<1000)return formatShort(v);if(!(v>0))return '0';
    const log=Math.log10(v);
    if(log<15){
      let tier=log>=3?Math.floor(log/3):0,scaled=Math.pow(10,log-tier*3);
      if(scaled>=999.995){tier++;scaled=Math.pow(10,log-tier*3)}
      if(tier<=4)return formatShort(scaled)+['','K','M','B','T'][tier];
    }
    let exponent=Math.floor(log),mantissa=Math.pow(10,log-exponent);
    if(mantissa>=9.995){mantissa=1;exponent++}
    return mantissa.toFixed(2)+'e'+exponent;
  }
  function formatSlowdownMultiplier(value){
    const v=Math.max(1,finite(value,1));
    if(v<1000&&Number.isInteger(v))return String(v);
    return v.toExponential(2).replace('e+','e');
  }
  function formatLog10(log){
    if(log===-Infinity)return '0';if(!Number.isFinite(log))return '—';
    if(log>=-2&&log<15)return formatNumber(Math.pow(10,log));
    let exponent=Math.floor(log),mantissa=Math.pow(10,log-exponent);if(mantissa>=9.995){mantissa=1;exponent++}return mantissa.toFixed(2)+'e'+exponent;
  }
  function parseNumber(value,fallback=0){
    if(typeof value==='number')return Number.isFinite(value)?value:fallback;
    const s=String(value??'').trim().replace(/,/g,'');if(!s)return fallback;
    const match=s.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([kKmMbBtT])$/);
    if(match){const factor={k:1e3,m:1e6,b:1e9,t:1e12}[match[2].toLowerCase()],n=Number(match[1])*factor;return Number.isFinite(n)?n:fallback}
    const n=Number(s);return Number.isFinite(n)?n:fallback;
  }
  function quickStartAdvice(input){
    const totalCore=Math.max(0,finite(input&&input.totalCore,totalCoreForAscension(input&&input.ascensionCount))),held=Math.max(0,finite(input&&input.heldIngots));
    const needed=Math.max(0,NORMAL_AUTO_UNLOCK_COST-held);
    if(input&&input.normalAutoUnlocked!==false)return {needed:false,ready:true,runs:0,neededIngots:0};
    if(needed<=0)return {needed:true,ready:true,runs:0,neededIngots:0,coreIngotLevel:0,gainAtLevel50:0};
    const maxIngotLevel=maxCoreLevel(1,totalCore),wanted=Math.max(0,Math.ceil(Math.log2(Math.max(1,needed)))),coreIngotLevel=Math.min(maxIngotLevel,wanted),gainAtLevel50=prestigeGain(50,coreIngotLevel),runs=Math.max(1,Math.ceil(needed/Math.max(1,gainAtLevel50)));
    return {needed:true,ready:false,runs,neededIngots:needed,coreIngotLevel,gainAtLevel50,maxCoreIngotLevel:maxIngotLevel,targetLevel:50};
  }

  return {
    TERMINAL_ORES_PER_TOP,MAX_TOP_SPAWN_RATE,NORMAL_AUTO_UNLOCK_COST,OUTER_DAMAGE_FACTOR,ORE_MAX_CRUSH_SECONDS,MAX_ZONE_ORES,ORE_TIER_HP_MULTIPLIER,ORICHALCUM_HP_MULTIPLIER,LEGACY_REQUIRED_ASCENSIONS,COMPRESSION_UNLOCK_DISCARDED,LEGACY_START_INGOT_CAP,ASCENSION_MAX_COUNT,COMPRESSION_INGOT_DENOMINATOR,COMPRESSION_VOLUME_TARGET_LOG,ORE_VOLUME,BOMB_RARITY_CHANCE,THEORETICAL_TERMINAL_SALES_RATE,EARLY_ORE_VALUE,EARLY_ORE_HP,NORMAL,INGOT,CORE_NAMES,CORE_FEED,SLOWDOWN,ASCENSION_INGOT_REQ,DEFAULT_INGOT_LEVELS,DEFAULT_CORE,A18_VIDEO_CORE,A18_VIDEO_INGOT,DEFAULT_MEASUREMENTS,
    totalCoreForAscension,slowdownLevel,nextAscensionRequirement,coreCost,maxCoreLevel,coreEffect,coreBundleCost,coreReallocationPlan,ascensionInteractionPlan,slowdownReallocationPlan,ingotEffect,ingotNextCost,ingotCumulativeCost,ingotBundleCost,inferTotalIngotsEarned,legacyStartIngot,afterAscensionState,compressionUnlocked,compressionE,compressionRarityState,compressionRarityValueMultiplier,compressionExpectedIngotPerOre,compressionDirectIngotPlan,compressionLevelPushPlan,compressionVolumeLog,observableUniverseBestLevel,prestigeGateBaselineSeconds,compressionAscensionEstimate,compressionCycleEstimate,optimizeCompressionPreparation,optimizeLegacyPartitions,optimizeCompressionSwitchPlan,normalEffect,requiredExpLog10,requiredExp,baseOreValueLog10,baseOreValue,baseOreHpLog10,baseOreHp,expectedTerminalPerTop,prestigeBase,prestigeGain,prestigePermanent,
    topSpawnRate,expectedUsefulExpPerTerminal,directExpPaceAtLevel,calculateExpPaceBoundary,expectedRarityValueMultiplier,rankingIncomeLog10,normalBundleCostLog10,dpsLog10,softCapHpLog,targetOreStats,requiredPreparedDpsLog10,calculateRankingTarget,simulateCurve,deriveDpsCalibration,fitCalibration,exactTimingMeasurements,timingResolver,mergePrestigeSchedule,prestigeScheduleFunding,planNormalAutoBootstrap,optimizeNormalAutoBootstrap,paretoCoreCandidates,slowdownCandidates,optimizeFixedCore,evaluateAutoPrestigeSetting,evaluateAutoPrestigeScheduleSetting,optimizeAscension,optimizeSingularity,optimizeIngotUpgrades,completeAscensionState,ascensionSearchMaxLevel,optimizeTargetLevel,optimizeRanking,optimizeRankingIngotUpgrades,CORE_STRATEGY_PROFILES,coreStrategyWorkload,assessCoreStrategyPair,formatNumber,formatSlowdownMultiplier,formatLog10,parseNumber,quickStartAdvice
  };
});
