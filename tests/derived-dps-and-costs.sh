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
probe=r'''<script>setTimeout(()=>{const pm=v=>{const m=String(v).match(/^([\d.]+)([KMBT])?$/i);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2]||'').toUpperCase()]||1):NaN},set=(key,value)=>{const el=document.querySelector(`.value[data-key="${key}"]`);el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}))};document.getElementById('level').value='22';document.getElementById('level').dispatchEvent(new Event('change',{bubbles:true}));set('speed',46);set('power',93.8);set('reducer',1);set('gravity',11.81);set('spikeCount',4);set('spikeSize',1.15);set('feed',1);set('rare',0.5);setTimeout(()=>{const dps=Number(document.getElementById('dps').value),spikeCost=pm(document.querySelector('.cost[data-key="spikeCount"]').value),feedCost=pm(document.querySelector('.cost[data-key="feed"]').value);const out=document.createElement('pre');out.id='derived-result';out.textContent=JSON.stringify({dps,spikeCost,feedCost,pass:dps>319&&dps<322&&spikeCost===1200&&feedCost===400});document.body.appendChild(out)},100)},100)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18769
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="derived-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
