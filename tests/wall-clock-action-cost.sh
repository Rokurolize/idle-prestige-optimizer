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
seed=r'''<script>(()=>{const now=Date.now(),log=[{at:now-200000,runId:5,type:'exp_full_level_up',level:50,cash:0,dps:90000,detail:{from:49,to:50,durationMs:40000,exactTiming:true}}];for(let i=0;i<12;i++)log.push({at:now-100000+i*2400,runId:6,type:'purchase',level:48,cash:1e9,dps:90000,detail:{key:'speed',cost:1,from:10+i,to:11+i}});localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:13,run:{id:6,startedAt:now-1000000},level:49,cash:1e9,cashAuto:false,cashUpdatedAt:now,income:69000000,incomeMode:'manual',timing:{level:49,startedAt:now-39000,recordedAt:null},actionLog:log,upgrades:{speed:{name:'Speed',value:48.5,cost:387024457.4344418,step:.5,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:285.8,cost:1e15,step:15.4,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:2,cost:1e15,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:18.81,cost:1e15,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:0,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1.15,cost:0,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:4,cost:0,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:7,cost:1e15,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'rare',confidence:'高'}}}))})();</script>'''
probe=r'''<script>setTimeout(()=>{const text=document.getElementById('recommend').textContent,out=document.createElement('pre');out.id='wall-clock-result';out.textContent=JSON.stringify({text,pass:text.includes('EXP満タンを優先')&&text.includes('判断レイテンシ')&&!document.getElementById('applyBest')});document.body.appendChild(out)},160)</script>'''
s=s.replace('</head>',seed+'</head>').replace('</body>',probe+'</body>');p.write_text(s)
PY
port=$((22000 + RANDOM % 8000))
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="wall-clock-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
