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
seed=r'''<script>(()=>{const now=Date.now(),logs=[];for(let l=2;l<50;l++)logs.push({at:now-(50-l)*20000,runId:5,type:'exp_full_level_up',level:l+1,cash:0,dps:100,dpsCalibration:1,permanent:{prestigeCash:1.26,prestigeDmg:1.26,refining:3.04,crush:3.04,expEff:1.16,ingots:0},upgrades:{speed:49.23,power:270.8,reducer:1.95,gravity:18.31,spikeCount:12,spikeSize:1.15,feed:4,rare:7},recommendation:null,detail:{from:l,to:l+1,durationMs:20000,exactTiming:true}});localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:11,run:{id:5,startedAt:now-1000000},level:50,cash:514600000,cashAuto:false,cashUpdatedAt:now,dps:39470,dpsCalibration:1,income:0,incomeMode:'manual',prestigeCash:1.26,prestigeDmg:1.26,refining:3.04,crush:3.04,expEff:1.16,ingots:0,prestigeProbes:[],timing:{level:50,startedAt:now-500,recordedAt:null},levelAnchors:[{level:50,at:now-500,source:'exp-full'}],history:[],actionLog:logs,upgrades:{speed:{name:'Speed',value:49.23,cost:322500000,step:.5128,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:270.8,cost:580200000,step:15,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:1.95,cost:446200000,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:18.31,cost:393200000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:0,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1.15,cost:0,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:4,cost:0,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:7,cost:819200000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}}}))})();</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1)
probe=r'''<script>setTimeout(()=>{const before=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')).cash;document.getElementById('prestigeGainProbe').value='1';document.getElementById('recordPrestigeProbe').click();setTimeout(()=>{document.getElementById('timerRecord').click();setTimeout(()=>{document.getElementById('prestigeGainProbe').value='2';document.getElementById('recordPrestigeProbe').click();setTimeout(()=>{const st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),probeActions=(st.actionLog||[]).filter(x=>x.type==='prestige_probe'),exp=(st.actionLog||[]).filter(x=>x.type==='exp_full_level_up').slice(-1)[0],verdict=document.getElementById('prestigeProbeVerdict').textContent;const out=document.createElement('pre');out.id='post50-result';out.textContent=JSON.stringify({level:st.level,cash:st.cash,before,probeLevels:(st.prestigeProbes||[]).map(x=>x.level),probeGains:(st.prestigeProbes||[]).map(x=>x.gained),expFrom:exp&&exp.detail.from,expTo:exp&&exp.detail.to,reward:exp&&exp.detail.reward,probeActions:probeActions.length,verdict,pass:st.level===51&&Math.abs(st.cash-before)<.01&&exp&&exp.detail.from===50&&exp.detail.to===51&&exp.detail.reward===null&&probeActions.length===2&&st.prestigeProbes[0].level===50&&st.prestigeProbes[1].level===51&&verdict.includes('追加▲効率')});document.body.appendChild(out)},60)},80)},60)},100)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18779
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2200 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="post50-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
