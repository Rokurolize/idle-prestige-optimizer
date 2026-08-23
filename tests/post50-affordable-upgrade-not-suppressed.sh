#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$tmp/index.html"
python3 - "$tmp/index.html" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
seed=r'''<script>(()=>{const now=Date.now(),dur={56:67432,57:96551,58:157880,59:91482,60:104601,61:273403,62:130240,63:196738},logs=[];for(let l=2;l<50;l++)logs.push({at:now-3e6+l*1000,runId:6,type:'exp_full_level_up',level:l+1,cash:0,dps:1e5,dpsCalibration:1,detail:{from:l,to:l+1,durationMs:28650,exactTiming:true}});for(const [l,ms] of Object.entries(dur))logs.push({at:now-2e6+Number(l)*1000,runId:6,type:'exp_full_level_up',level:Number(l)+1,cash:0,dps:2e5,dpsCalibration:1,detail:{from:Number(l),to:Number(l)+1,durationMs:ms,exactTiming:true}});for(let i=0;i<110;i++)logs.push({at:now-1e6+i*2614,runId:6,type:'purchase',level:60,cash:0,dps:2e5,dpsCalibration:1,detail:{key:'speed',cost:1,from:1,to:2}});localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:13,run:{id:6,startedAt:now-4e6},level:64,cash:31212805460.93,cashAuto:false,cashUpdatedAt:now,income:500000000,incomeMode:'manual',prestigeCash:1.5,prestigeDmg:1.5,refining:5.44,crush:5.44,expEff:1.44,ingots:8,timing:{level:64,startedAt:now-13000,recordedAt:null},actionLog:logs,upgrades:{speed:{name:'Speed',value:46.8,cost:14837588810.108532,step:.4,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:438.8,cost:139336329898.74725,step:19,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:2.5,cost:68355564160.36435,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:21.81,cost:50340000000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:0,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1.15,cost:0,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:4,cost:0,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:10.5,cost:104857600000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'rare',confidence:'高'}},settings:{reducerExponent:1.25,gravityExponent:.715,feedExponent:.75,spikeSizeEffect:.00397}}))})();</script>'''
probe=r'''<script>setTimeout(()=>{const text=document.getElementById('recommend').innerText,out=document.createElement('pre');out.id='post50-affordable-result';out.textContent=JSON.stringify({text,pass:text.includes('Speed')&&!text.includes('EXP満タンを優先')&&text.includes('次8▲')});document.body.appendChild(out)},180)</script>'''
s=s.replace('</head>',seed+'</head>').replace('</body>',probe+'</body>');p.write_text(s)
PY
port=$((22000 + RANDOM % 10000))
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2200 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="post50-affordable-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
