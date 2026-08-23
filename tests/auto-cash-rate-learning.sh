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
seed=r'''<script>(()=>{const now=Date.now(),mk=(at,after)=>({at,runId:2,type:'cash_sync',level:20,cash:after,dps:100,upgrades:{speed:10,power:2,reducer:1,gravity:9.81,spikeCount:4,spikeSize:1,feed:1,rare:0},detail:{before:after,after}});localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:10,run:{id:2,startedAt:now-30000},level:20,cash:2000,cashAuto:true,cashUpdatedAt:now,income:0,incomeMode:'auto',actionLog:[mk(now-20000,0),mk(now-10000,1000),mk(now,2000)]}))})();</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1)
probe=r'''<script>setTimeout(()=>{const auto=document.getElementById('incomeAuto').checked,rate=document.getElementById('income').value,source=document.getElementById('incomeSource').textContent;setTimeout(()=>{const cash=document.getElementById('cash').value,pm=v=>{const m=String(v).match(/^([\d.]+)([KMBT])?$/i);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2]||'').toUpperCase()]||1):NaN},out=document.createElement('pre');out.id='auto-rate-result';out.textContent=JSON.stringify({auto,rate,source,cash,pass:auto&&/^100(?:\.0+)?$/.test(rate)&&source.includes('$100/s')&&pm(cash)>2000});document.body.appendChild(out)},1250)},150)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18776
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2600 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="auto-rate-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
