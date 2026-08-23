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
seed=r'''<script>localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:3,level:22,cash:378500,dps:29.48,prestigeDmg:1.14,crush:1.56,settings:{reducerExponent:1.25,gravityEffect:0.023,feedExponent:0.75,spikeSizeEffect:0.003},upgrades:{speed:{value:46,cost:35440,step:1},power:{value:93.8,cost:155900,step:9},reducer:{value:1,cost:0,step:.05},gravity:{value:11.81,cost:48000,step:.5},spikeCount:{value:4,cost:0,step:1,growth:1.5},spikeSize:{value:1.15,cost:1500,step:.015},feed:{value:1,cost:0,step:.1,growth:1.5},rare:{value:.5,cost:100000,step:.5}}}));</script>'''
s=s.replace('<script>\n(() => {', seed+'<script>\n(() => {', 1)
probe=r'''<script>setTimeout(()=>{const pm=v=>{const m=String(v).match(/^([\d.]+)([KMBT])?$/i);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2]||'').toUpperCase()]||1):NaN},dps=Number(document.getElementById('dps').value),spikeCost=pm(document.querySelector('.cost[data-key="spikeCount"]').value),feedCost=pm(document.querySelector('.cost[data-key="feed"]').value),feedGrowth=Number(document.querySelector('.growth[data-key="feed"]').value);const out=document.createElement('pre');out.id='migration-result';out.textContent=JSON.stringify({dps,spikeCost,feedCost,feedGrowth,pass:Math.abs(dps-320.78)<.3&&spikeCost===1200&&feedCost===400&&Math.abs(feedGrowth-1.4)<1e-9});document.body.appendChild(out)},150)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18770
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="migration-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
