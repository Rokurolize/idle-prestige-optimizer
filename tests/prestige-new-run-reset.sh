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
probe=r'''<script>setTimeout(()=>{window.confirm=()=>true;const set=(sel,val)=>{const el=document.querySelector(sel);el.value=String(val);el.dispatchEvent(new Event('change',{bubbles:true}))};set('#level',50);set('#prestigeCash',1.2);set('#prestigeDmg',1.2);set('#crush',3.04);set('#ingots',0);set('.value[data-key="speed"]',48.95);set('.value[data-key="power"]',256.2);setTimeout(()=>{const before=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1'));document.getElementById('newRun').click();setTimeout(()=>{const after=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),types=after.actionLog.map(x=>x.type).slice(-2);const out=document.createElement('pre');out.id='prestige-reset-result';out.textContent=JSON.stringify({beforeRun:before.run.id,afterRun:after.run.id,level:after.level,cash:after.cash,speed:after.upgrades.speed.value,power:after.upgrades.power.value,prestigeCash:after.prestigeCash,prestigeDmg:after.prestigeDmg,crush:after.crush,ingots:after.ingots,timing:after.timing,types,pass:after.run.id===before.run.id+1&&after.level===1&&after.cash===0&&after.upgrades.speed.value===10&&after.upgrades.power.value===2&&after.prestigeCash===1.2&&after.prestigeDmg===1.2&&after.crush===3.04&&after.ingots===0&&after.timing.level===1&&types[0]==='prestige_boundary'&&types[1]==='run_start'});document.body.appendChild(out)},100)},100)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18779
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2200 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="prestige-reset-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
