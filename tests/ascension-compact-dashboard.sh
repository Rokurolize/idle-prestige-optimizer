#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/ascension.html" "$root/ascension-model.js" "$root/ascension-worker.js" "$tmp/"
python3 - "$tmp/ascension.html" <<'PY'
import sys
p=sys.argv[1]
s=open(p,encoding='utf-8').read()
seed=r'''<script>localStorage.setItem('crush-goal-optimizer-v2',JSON.stringify({goal:'ascension',ascensionCount:17,heldIngots:0,prestigeCount:1,currentCoreLevels:[0,25,0,0,0],currentSlowdownLevel:15,normalAutoUnlocked:true,afkHours:10,rankTarget:'',discardedAscensions:28,maxLevelEver:9485,compressionTerminalSalesPerSecond:15.75,compressionRarePercent:100,compressionGemLevel:10,totalCrushLog:8.46e44,coreOverrideEnabled:false,coreOverride:129140162,manualClickRate:4,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,damageBoostActive:false,dpsCalibration:1,hpCalibration:1,ingotLevels:[0,44,0,1,0,38,17,38],compareApLevel:'3758',compareSlowdownLevel:'14'}));</script>'''
s=s.replace('<script src="ascension-model.js"></script>',seed+'<script src="ascension-model.js"></script>',1)
probe=r'''<script>setTimeout(()=>{const hero=document.getElementById('hero'),compare=document.getElementById('apCompare'),cores=document.getElementById('coreGrid'),op=document.getElementById('operationGuide');hero.innerHTML='<div class="tag">固定★推奨</div><div class="main">AP Lv3758 ×13 → AP Lv50 ×11</div><div class="sub"><b class="heroEta">総ETA 45m 40s</b> · <b class="heroSlow">Slowdown Lv 14 (×10.0B)</b> · 下のCoreをそのまま使用</div>';compare.classList.remove('hidden');document.getElementById('apCompareResult').innerHTML='ETA <b>45m 40s</b> · 最適案と同等 · Lv3758×13 → Lv50×11';cores.innerHTML=['Income','Ingot','Damage','Cost','Feed'].map((n,i)=>'<div class="core"><span>'+(i+1)+'. '+n+'</span><b>Lv'+[0,26,21,0,15][i]+'</b><small>×1</small></div>').join('');op.classList.remove('hidden');op.innerHTML='<b>次の操作</b><br>開始Coreを走行Coreへ変更 / Core固定 → ▲PRESTIGE → PRESTIGE';const pick=(id,sel)=>document.getElementById(id)||document.querySelector(sel),box=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}},layout=pick('primaryDashboard','.layout'),stateEl=pick('stateCard','.stateCard'),purchaseEl=document.getElementById('purchaseCard'),resultEl=pick('resultCard','.resultCard'),state=box(stateEl),purchase=box(purchaseEl),result=box(resultEl),goals=document.querySelector('.goals').getBoundingClientRect(),aux=[...document.querySelectorAll('[data-auxiliary]')],cols=getComputedStyle(layout).gridTemplateColumns.split(' ').filter(Boolean).length,criticalBottom=Math.max(state.bottom,purchase.bottom,result.bottom),sameTop=Math.abs(state.top-result.top)<2,noHorizontalScroll=document.documentElement.scrollWidth<=innerWidth,primaryFits=criticalBottom<=innerHeight+1,goalsCompact=goals.height<=58,auxCollapsed=aux.length>=3&&aux.every(x=>x.tagName==='DETAILS'&&!x.open),recommendationReady=byId=>{const el=document.getElementById(byId);return el&&!el.classList.contains('hidden')},heroReady=hero.textContent.includes('AP Lv'),compareVisible=recommendationReady('apCompare'),operationVisible=recommendationReady('operationGuide'),coreCount=document.querySelectorAll('#coreGrid .core').length;const out=document.createElement('pre');out.id='compact-dashboard-result';out.textContent=JSON.stringify({innerWidth,innerHeight,cols,state,purchase,result,goalsHeight:goals.height,criticalBottom,sameTop,noHorizontalScroll,primaryFits,goalsCompact,auxCollapsed,heroReady,compareVisible,operationVisible,coreCount,pass:innerWidth>=1500&&cols===2&&sameTop&&noHorizontalScroll&&primaryFits&&goalsCompact&&auxCollapsed&&heroReady&&compareVisible&&operationVisible&&coreCount===5});document.body.appendChild(out)},120)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18841
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --window-size=1648,780 --virtual-time-budget=1000 --dump-dom "http://127.0.0.1:$port/ascension.html" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="compact-dashboard-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
