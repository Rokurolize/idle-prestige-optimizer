#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp "$root/index.html" "$tmp/index.html"
python3 - "$tmp/index.html" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text()
seed=r'''<script>(()=>{const now=Date.now();localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:12,level:64,cash:60e9,cashAuto:false,cashUpdatedAt:now,income:0,incomeMode:'manual',run:{id:5,startedAt:now-1e6},upgrades:{rare:{name:'Rare Ore Rate',value:10,cost:52428800000,step:.5,stepDelta:0,growth:2,unlock:1,cap:10,model:'rare',confidence:'高'}}}))})();</script>'''
probe=r'''<script>setTimeout(()=>{const card=document.querySelector('[data-upgrade-card="rare"]'),btn=card&&card.querySelector('.buy'),before=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1'));if(btn)btn.click();setTimeout(()=>{const after=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),out=document.createElement('pre');out.id='rare-cap-result';out.textContent=JSON.stringify({beforeCap:before.upgrades.rare.cap,buttonDisabled:btn&&btn.disabled,value:after.upgrades.rare.value,cost:after.upgrades.rare.cost,cap:after.upgrades.rare.cap,pass:before.upgrades.rare.cap===null&&btn&&!btn.disabled&&Math.abs(after.upgrades.rare.value-10.5)<1e-9&&Math.abs(after.upgrades.rare.cost-104857600000)<1&&after.upgrades.rare.cap===null});document.body.appendChild(out)},80)},100)</script>'''
s=s.replace('</head>',seed+'</head>').replace('</body>',probe+'</body>')
p.write_text(s)
PY
port=$((21000 + RANDOM % 10000))
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -rf "$tmp"' EXIT
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="rare-cap-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
[[ "$result" == *'"pass":true'* ]]
