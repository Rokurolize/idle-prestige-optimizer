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
seed=r'''<script>(()=>{const now=Date.now(),logs=[];for(let l=2;l<50;l++)logs.push({at:now-200000+(l-2)*1000,runId:2,type:'exp_full_level_up',level:l+1,cash:0,dps:100,dpsCalibration:1,permanent:{prestigeCash:1,prestigeDmg:1,refining:1,crush:1,expEff:1,ingots:0},upgrades:{speed:10,power:2,reducer:1,gravity:9.81,spikeCount:4,spikeSize:1,feed:1,rare:0},recommendation:null,detail:{from:l,to:l+1,durationMs:20000,exactTiming:true}});localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:11,run:{id:2,startedAt:now-1200000},level:52,cash:0,cashAuto:false,cashUpdatedAt:now,income:0,incomeMode:'manual',prestigeProbes:[{at:now-100000,runId:2,level:50,gained:1,post50Elapsed:0,cycleTo50Seconds:960},{at:now-50000,runId:2,level:51,gained:1,post50Elapsed:50,cycleTo50Seconds:960}],actionLog:logs,upgrades:{speed:{name:'Speed',value:10,cost:50,step:1,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:2,cost:14,step:2.2,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:1,cost:75000,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:9.81,cost:3000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:4,cost:1200,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1,cost:1500,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:1,cost:400,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:0,cost:50000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}}}))})();</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1)
probe=r'''<script>setTimeout(()=>{document.getElementById('prestigeGainProbe').value='2';document.getElementById('recordPrestigeProbe').click();setTimeout(()=>{const text=document.getElementById('prestigeProbeVerdict').textContent,out=document.createElement('pre');out.id='plateau-result';out.textContent=JSON.stringify({text,pass:text.includes('1分40秒/▲')&&text.includes('16分00秒/▲')});document.body.appendChild(out)},80)},100)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18781
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="plateau-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
