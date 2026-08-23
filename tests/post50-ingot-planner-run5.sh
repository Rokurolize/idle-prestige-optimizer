#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$tmp/index.html"
python3 - "$tmp/index.html" <<'PY'
import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
seed=r'''<script>(()=>{const now=Date.now(),dur={55:141976,56:146818,57:230952,58:338315,59:284869,60:317433,61:419076,62:348505,63:337833},logs=Object.entries(dur).map(([l,ms],i)=>({at:now-500000+i*1000,runId:5,type:'exp_full_level_up',level:Number(l)+1,cash:0,dps:100000,dpsCalibration:1,detail:{from:Number(l),to:Number(l)+1,durationMs:ms,exactTiming:true}}));localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:12,run:{id:5,startedAt:now-3000000},level:64,cash:36250000000,cashAuto:false,cashUpdatedAt:now,income:455690000,incomeMode:'manual',prestigeCash:1.26,prestigeDmg:1.26,refining:3.04,crush:3.04,expEff:1.16,ingots:0,timing:{level:64,startedAt:now,recordedAt:null},actionLog:logs,upgrades:{speed:{name:'Speed',value:50,cost:25640000000,step:.4167,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:420.2,cost:80540000000,step:18.6,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:2.4,cost:27380000000,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:21.31,cost:25170000000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:0,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1.15,cost:0,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:4,cost:0,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:9.5,cost:26214400000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}},settings:{reducerExponent:1.25,gravityExponent:.715,feedExponent:.75,spikeSizeEffect:.00397}}))})();</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1)
probe=r'''<script>setTimeout(()=>{const eta=document.getElementById('levelEta').textContent,rec=document.getElementById('recommend').textContent,goal=document.getElementById('goalLabel').textContent,probe=document.getElementById('prestigeProbeVerdict').textContent,out=document.createElement('pre');out.id='post50-ingot-plan-result';out.textContent=JSON.stringify({eta,rec,goal,probe,pass:goal.includes('▲15')&&goal.includes('▲16')&&/分/.test(eta)&&rec.includes('Rare Ore Rate')&&probe.includes('Level − 49')});document.body.appendChild(out)},180)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18777
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="post50-ingot-plan-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
