#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$root/v6-model.js" "$tmp/"
python3 - "$tmp/index.html" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
seed=r'''<script>(()=>{const now=Date.now();localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:14,run:{id:6,startedAt:now-1000000},level:58,cash:1000000000,cashAuto:false,cashUpdatedAt:now,dps:100000,dpsCalibration:1,income:0,incomeMode:'manual',timing:{level:58,startedAt:now-30000,recordedAt:null,quality:'exact'},actionLog:[],v6:{mode:'active',afkMinutes:120,prestigeCount:6,prestigeGoal:25,ingotGoal:250,observations:[],observed:{},lastShadow:null},upgrades:{speed:{name:'Speed',value:45,cost:1000000,step:.5,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:400,cost:2000000,step:18.2,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:2.3,cost:3000000,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},rare:{name:'Rare Ore Rate',value:9.5,cost:4000000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'rare',confidence:'高'},gravity:{name:'Gravity',value:20.81,cost:5000000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:1,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1.15,cost:1,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:4,cost:1,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'}}}))})();</script>'''
probe=r'''<script>setTimeout(()=>{document.getElementById('paste').value=`Level: 64
所持金: $36.25B
DPS: 110.6K
Speed: 50
Speed次回価格: $25.64B +0.4167
Power: 420.2
Power次回価格: $80.54B +18.6
Reducer: 2.4
Reducer次回価格: $27.38B +0.05
Rare Ore Rate: 10%
Rare次回価格: $52.43B +0.5
Gravity: 21.31
Gravity次回価格: $25.17B +0.5
Spike Count: 12 MAX
Spike Size: 1.15 MAX
Feed Rate: x4 MAX`;document.getElementById('catchupElapsed').value='18:42';document.getElementById('catchupPlayMode').value='active';document.getElementById('catchupBtn').click();setTimeout(()=>{let st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),c=st.actionLog.find(x=>x.type==='catchup_sync'),noFake=st.actionLog.filter(x=>x.type==='exp_full_level_up').length===0,first={level:st.level,cash:st.cash,speed:st.upgrades.speed.value,timing:st.timing,catchup:c&&c.detail,quality:c&&c.observationQuality,noFake,v6Catchups:(st.v6.observations||[]).filter(x=>x.kind==='catchup').length};document.getElementById('timerRecord').click();setTimeout(()=>{st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1'));const exp=[...st.actionLog].reverse().find(x=>x.type==='exp_full_level_up'),out=document.createElement('pre');out.id='catchup-result';out.textContent=JSON.stringify({first,after:{level:st.level,timing:st.timing,expExact:exp&&exp.detail.exactTiming,expQuality:exp&&exp.observationQuality},pass:first.level===64&&Math.abs(first.cash-36250000000)<1&&first.speed===50&&first.timing.quality==='partial'&&first.quality==='aggregate'&&first.catchup.elapsedMs===1122000&&first.catchup.fromLevel===58&&first.catchup.toLevel===64&&first.catchup.trainablePerLevel===false&&first.catchup.purchaseOrder==='unknown'&&first.catchup.upgradeChanges.length>0&&first.noFake&&first.v6Catchups===1&&st.level===65&&st.timing.quality==='exact'&&exp.detail.exactTiming===false&&exp.observationQuality==='state_only'});document.body.appendChild(out)},120)},140)},120)</script>'''
s=s.replace('<script src="v6-model.js"></script>',seed+'<script src="v6-model.js"></script>').replace('</body>',probe+'</body>');p.write_text(s)
PY
port=$((22000 + RANDOM % 8000))
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2600 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="catchup-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
