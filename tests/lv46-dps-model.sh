#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$tmp/index.html"
python3 - "$tmp/index.html" <<'PY'
import sys
p=sys.argv[1]
s=open(p, encoding='utf-8').read()
seed=r'''<script>localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:7,level:46,cash:182000000,dps:13370,dpsCalibration:1.02517,income:0,prestigeCash:1.14,prestigeDmg:1.14,refining:1.56,crush:1.56,expEff:1,settings:{reducerExponent:1.2711,gravityEffect:0.022,feedExponent:0.75,spikeSizeEffect:0.00397},upgrades:{speed:{name:'Speed',value:47.03,cost:62510000,step:.5405,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:242,cost:193900000,step:14.2,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:1.85,cost:178700000,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:17.31,cost:98300000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:0,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1.15,cost:0,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:4,cost:0,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:6,cost:204800000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}}}));</script>'''
s=s.replace('<script>\n(() => {', seed+'<script>\n(() => {', 1)
probe=r'''<script>setTimeout(()=>{const dps=Number(document.getElementById('dps').value),rounded=(dps/1000).toFixed(2)+'K',saved=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1'));const out=document.createElement('pre');out.id='lv46-dps-result';out.textContent=JSON.stringify({dps,rounded,cal:saved.dpsCalibration,pass:rounded==='13.32K'&&Math.abs(saved.dpsCalibration-1)<1e-12});document.body.appendChild(out)},180)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18776
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="lv46-dps-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
