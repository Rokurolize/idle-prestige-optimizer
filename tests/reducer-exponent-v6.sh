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
seed=r'''<script>localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:5,level:34,cash:8271000,dps:5477,dpsCalibration:1.02517,prestigeDmg:1.14,crush:1.56,settings:{reducerExponent:1.25,gravityEffect:0.022,feedExponent:0.75,spikeSizeEffect:0.00397},upgrades:{speed:{value:46.67,cost:2817000,step:.6667,growth:1.2},power:{value:177,cost:12510000,step:12.2,growth:1.73},reducer:{value:1.5,cost:7272000,step:.05,growth:1.58},gravity:{value:15.31,cost:6144000,step:.5,growth:2},spikeCount:{value:12,cost:0,step:1,growth:1.5,cap:12},spikeSize:{value:1.15,cost:1500,step:.015,growth:1.25,cap:1.15},feed:{value:3.7,cost:3528000,step:.1,growth:1.4,cap:4},rare:{value:3.5,cost:6400000,step:.5,growth:2}}}));</script>'''
s=s.replace('<script>\n(() => {', seed+'<script>\n(() => {', 1)
probe=r'''<script>setTimeout(()=>{const dps=Number(document.getElementById('dps').value),exp=Number(document.getElementById('reducerExponent').value);const out=document.createElement('pre');out.id='reducer-exp-result';out.textContent=JSON.stringify({dps,exp,pass:Math.abs(dps-5520)<4&&Math.abs(exp-1.27)<1e-9});document.body.appendChild(out)},160)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18774
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="reducer-exp-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
