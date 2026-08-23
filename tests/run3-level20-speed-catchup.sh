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
seed=r'''<script>(()=>{const now=Date.now();localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:10,level:20,cash:47298.03,cashAuto:false,cashUpdatedAt:now,income:1300,incomeMode:'manual',prestigeCash:1.22,prestigeDmg:1.22,refining:1.56,crush:3.04,expEff:1.16,ingots:0,dpsCalibration:1.004175478,run:{id:3,startedAt:now-1e6},timing:{level:20,startedAt:now,recordedAt:null},levelAnchors:[],history:[],actionLog:[{at:now-2e6,runId:2,type:'exp_full_level_up',level:21,cash:0,dps:1678.643427,upgrades:{speed:43,power:85.2,reducer:1,gravity:11.31,spikeCount:12,spikeSize:1.045,feed:2.2,rare:0},detail:{from:20,to:21,durationMs:31848}}],upgrades:{speed:{name:'Speed',value:16,cost:149.2992,step:1,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:93.8,cost:155923.57686118546,step:9,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:1,cost:75000,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:9.81,cost:3000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:30754.6875,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1,cost:1500,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:1.2,cost:784,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:0,cost:50000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}},settings:{reducerExponent:1.25,gravityExponent:.715,feedExponent:.75,spikeSizeEffect:.00397}}))})();</script>'''
probe=r'''<script>setTimeout(()=>{const text=document.getElementById('recommend').innerText,out=document.createElement('pre');out.id='run3-lv20-result';out.textContent=JSON.stringify({text,pass:text.includes('Speed を1回')&&!text.includes('89秒待')&&!text.startsWith('約1分')});document.body.appendChild(out)},220)</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1).replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18781
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="run3-lv20-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
