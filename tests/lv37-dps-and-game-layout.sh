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
seed=r'''<script>localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:6,level:37,cash:6086000,dps:7382,dpsCalibration:1.02517,income:0,prestigeCash:1.14,prestigeDmg:1.14,refining:1.56,crush:1.56,expEff:1,settings:{reducerExponent:1.27,gravityEffect:0.022,feedExponent:0.75,spikeSizeEffect:0.00397},upgrades:{speed:{name:'Speed',value:46.25,cost:5842000,step:.625,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:201.8,cost:37440000,step:13,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'},reducer:{name:'Reducer',value:1.6,cost:18150000,step:.05,stepDelta:0,growth:1.58,unlock:11,cap:null,model:'reducer',confidence:'高'},gravity:{name:'Gravity',value:15.81,cost:12290000,step:.5,stepDelta:0,growth:2,unlock:1,cap:null,model:'gravity',confidence:'中'},spikeCount:{name:'Spike Count',value:12,cost:0,step:1,stepDelta:0,growth:1.5,unlock:5,cap:12,model:'linear',confidence:'中'},spikeSize:{name:'Spike Size',value:1.15,cost:0,step:.015,stepDelta:0,growth:1.25,unlock:8,cap:1.15,model:'spikeSize',confidence:'低'},feed:{name:'Feed Rate',value:4,cost:0,step:.1,stepDelta:0,growth:1.4,unlock:3,cap:4,model:'feed',confidence:'高'},rare:{name:'Rare Ore Rate',value:4.5,cost:25600000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}}}));</script>'''
s=s.replace('<script>\n(() => {', seed+'<script>\n(() => {', 1)
probe=r'''<script>setTimeout(()=>{const dps=Number(document.getElementById('dps').value),cards=[...document.querySelectorAll('[data-upgrade-card]')],order=cards.map(x=>x.dataset.upgradeCard),grid=document.getElementById('upgradeRows'),cols=getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,noHorizontalScroll=document.documentElement.scrollWidth<=innerWidth;const expected=['speed','power','reducer','rare','gravity','spikeCount','spikeSize','feed'],rounded=(dps/1000).toFixed(2)+'K';const out=document.createElement('pre');out.id='lv37-layout-result';out.textContent=JSON.stringify({dps,rounded,order,cols,noHorizontalScroll,pass:rounded==='7.39K'&&JSON.stringify(order)===JSON.stringify(expected)&&cols===4&&noHorizontalScroll});document.body.appendChild(out)},180)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18774
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --window-size=840,900 --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="lv37-layout-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
