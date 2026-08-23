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
seed=r'''<script>localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:4,level:22,cash:378500,dps:320.78,dpsCalibration:1,prestigeDmg:1.14,crush:1.56,settings:{reducerExponent:1.25,gravityEffect:0.022,feedExponent:0.75,spikeSizeEffect:0.00397},upgrades:{speed:{value:46,cost:35440,step:1},power:{value:93.8,cost:155900,step:9},reducer:{value:1,cost:0,step:.05,growth:1.58},gravity:{value:11.81,cost:48000,step:.5},spikeCount:{value:4,cost:1200,step:1,growth:1.5},spikeSize:{value:1.15,cost:1500,step:.015},feed:{value:1,cost:400,step:.1,growth:1.4},rare:{value:.5,cost:100000,step:.5}}}));</script>'''
s=s.replace('<script>\n(() => {', seed+'<script>\n(() => {', 1)
probe=r'''<script>setTimeout(()=>{const pm=v=>{const m=String(v).match(/^([\d.]+)([KMBT])?$/i);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2]||'').toUpperCase()]||1):NaN},dps=document.getElementById('dps');dps.value='2.33K';dps.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const reducerCost=pm(document.querySelector('.cost[data-key="reducer"]').value),actual=Number(document.getElementById('dps').value);const out=document.createElement('pre');out.id='reducer-dps-result';out.textContent=JSON.stringify({reducerCost,actual,pass:reducerCost===75000&&Math.abs(actual-2330)<.01});document.body.appendChild(out)},80)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18772
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="reducer-dps-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
