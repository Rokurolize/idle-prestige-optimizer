#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$tmp/index.html"
python3 - "$tmp/index.html" <<'PY'
import sys
p=sys.argv[1]
s=open(p,encoding='utf-8').read()
seed=r'''<script>(()=>{const now=Date.now(),u={speed:22,power:201.8,reducer:1.6,gravity:12.81,spikeCount:12,spikeSize:1,feed:2.7,rare:4},perm={prestigeCash:1.22,prestigeDmg:1.22,refining:1.56,crush:3.04,expEff:1.16,ingots:0},rates=[590,470000,700000,800000],actionLog=rates.map((r,i)=>({at:now-100000+i*1000,runId:3,type:'income_sync',level:40,cash:0,dps:6293.7,dpsCalibration:1,permanent:perm,upgrades:u,detail:{before:0,after:r}}));localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:10,level:40,cash:1e7,cashAuto:true,cashUpdatedAt:now,income:0,incomeMode:'auto',prestigeCash:1.22,prestigeDmg:1.22,refining:1.56,crush:3.04,expEff:1.16,ingots:0,dpsCalibration:1,run:{id:4,startedAt:now},timing:{level:40,startedAt:now,recordedAt:null},actionLog,upgrades:{speed:{name:'Speed',value:22,cost:5000000,step:.625,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:201.8,cost:37443188,step:13,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:1.6,cost:18152912,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:12.81,cost:768000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:0,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1,cost:1500,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:2.7,cost:1000000,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:4,cost:12800000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}},settings:{reducerExponent:1.25,gravityExponent:.715,feedExponent:.75,spikeSizeEffect:.00397}}))})();</script>'''
probe=r'''<script>setTimeout(()=>{const rate=document.getElementById('income').value,source=document.getElementById('incomeSource').textContent,out=document.createElement('pre');out.id='manual-history-result';out.textContent=JSON.stringify({rate,source,pass:(rate==='700K'||rate==='700000')&&source.includes('手動履歴')&&!source.includes('$590/s')});document.body.appendChild(out)},220)</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1).replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18782
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="manual-history-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
