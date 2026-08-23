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
seed=r'''<script>(()=>{const now=Date.now(),cashSync=(at,after)=>({at,runId:2,type:'cash_sync',level:20,cash:after,dps:100,upgrades:{speed:100,power:2,reducer:1,gravity:9.81,spikeCount:4,spikeSize:1,feed:1,rare:0},detail:{before:after,after}}),hist=[];for(let l=20;l<50;l++)hist.push({at:now-100000-l,runId:1,type:'exp_full_legacy',level:l,cash:0,dps:100,detail:{from:l,to:l+1,durationMs:60000,source:'full'}});localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:10,run:{id:2,startedAt:now-30000},level:20,cash:90,cashAuto:true,cashUpdatedAt:now,income:0,incomeMode:'auto',actionLog:[...hist,cashSync(now-20000,0),cashSync(now-10000,100),cashSync(now,200)],upgrades:{speed:{name:'Speed',value:100,cost:90,step:1,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:2,cost:100,step:2.2,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:1,cost:1e12,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:9.81,cost:1e12,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:4,cost:1e12,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1,cost:1e12,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:1,cost:1e12,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:0,cost:1e12,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}}}))})();</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1)
probe=r'''<script>setTimeout(()=>{const text=document.getElementById('recommend').textContent,out=document.createElement('pre');out.id='wait-plan-result';out.textContent=JSON.stringify({text,pass:text.includes('Power')&&text.includes('待')&&text.includes('最大8手の時間ベース先読み')});document.body.appendChild(out)},250)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18777
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="wait-plan-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
