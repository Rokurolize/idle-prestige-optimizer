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
seed=r'''<script>
localStorage.setItem('crush-goal-optimizer-v2',JSON.stringify({goal:'ascension',ascensionCount:16,heldIngots:2970000000000,prestigeCount:7,currentCoreLevels:[20,23,20,9,13],currentSlowdownLevel:14,normalAutoUnlocked:false,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1,ingotLevels:[44,43,43,43,18,38,17,38],strategyStyle:'normal'}));
const fixedCore=[20,25,19,9,14],manualCore=[20,0,21,9,15],manualPrestige=[0,25,0,0,0],fixed={core:fixedCore,runCore:fixedCore,prestigeCore:fixedCore,manualCoreReallocation:false,slowdown:1e10,targetLevel:4000,actualPrestigeLevel:4000,runs:18,totalRuns:18,eta:3600,totalEta:3689,interactionClicks:356,interactionSeconds:89,timingValidated:false,timingMeasurementCount:0,prestigeSchedule:[{targetLevel:4000,actualPrestigeLevel:4000,runs:18,runCore:fixedCore,prestigeCore:fixedCore}]},manual={core:manualCore,runCore:manualCore,prestigeCore:manualPrestige,manualCoreReallocation:true,slowdown:1e11,targetLevel:4100,actualPrestigeLevel:4100,runs:18,totalRuns:18,eta:3386,totalEta:3647.25,interactionClicks:1045,interactionSeconds:261.25,timingValidated:false,timingMeasurementCount:0,prestigeSchedule:[{targetLevel:4100,actualPrestigeLevel:4100,runs:18,runCore:manualCore,prestigeCore:manualPrestige}]};
const fakeResult={plan:manual,fixedPlan:fixed,manualPlan:manual,recommendedMode:'manual',nearAlternatives:[],calibration:{count:0,physicalCap:15.75,rmse:0}};
window.Worker=class{constructor(){this.onmessage=null;this.onerror=null}postMessage(m){setTimeout(()=>this.onmessage&&this.onmessage({data:{id:m.id,type:'result',goal:'ascension',result:fakeResult}}),0)}terminate(){}};
</script>'''
s=s.replace('<script src="ascension-model.js"></script>',seed+'<script src="ascension-model.js"></script>',1)
probe=r'''<script>setTimeout(()=>{const btn=document.getElementById('syncRecommendedState'),autoControlMissing=!document.getElementById('normalAutoUnlocked'),storedBefore=JSON.parse(localStorage.getItem('crush-goal-optimizer-v2')||'{}');btn&&btn.click();setTimeout(()=>{const currentCore=document.getElementById('currentCore').value.replace(/\s+/g,''),currentSlow=document.getElementById('currentSlowdownLevel').value,storedAfterSync=JSON.parse(localStorage.getItem('crush-goal-optimizer-v2')||'{}');document.getElementById('ascendSync').click();setTimeout(()=>{const storedAfterAscend=JSON.parse(localStorage.getItem('crush-goal-optimizer-v2')||'{}'),out=document.createElement('pre');out.id='state-sync-result';out.textContent=JSON.stringify({button:!!btn,autoControlMissing,storedBeforeAuto:storedBefore.normalAutoUnlocked,storedAfterSyncAuto:storedAfterSync.normalAutoUnlocked,storedAfterAscendAuto:storedAfterAscend.normalAutoUnlocked,currentCore,currentSlow,ascension:storedAfterAscend.ascensionCount,pass:!!btn&&autoControlMissing&&storedBefore.normalAutoUnlocked===true&&storedAfterSync.normalAutoUnlocked===true&&storedAfterAscend.normalAutoUnlocked===true&&storedAfterAscend.ascensionCount===17&&currentCore==='20,25,19,9,14'&&currentSlow==='14'});document.body.appendChild(out)},20)},20)},250)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18843
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --window-size=1648,900 --virtual-time-budget=1200 --dump-dom "http://127.0.0.1:$port/ascension.html" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="state-sync-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
