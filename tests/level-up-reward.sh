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
probe=r'''<script>setTimeout(()=>{const pm=v=>{const m=String(v).match(/^([\d.]+)([KMBT])?$/i);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2]||'').toUpperCase()]||1):NaN};const level=document.getElementById('level');const cash=document.getElementById('cash');const auto=document.getElementById('cashAuto');auto.checked=false;auto.dispatchEvent(new Event('change',{bubbles:true}));level.value='11';level.dispatchEvent(new Event('change',{bubbles:true}));cash.value='1000';cash.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{document.getElementById('levelUp').click();setTimeout(()=>{const actual=pm(document.getElementById('cash').value);const expected=1471.03;const out=document.createElement('pre');out.id='lvup-result';out.textContent=JSON.stringify({level:document.getElementById('level').value,actual,expected,pass:document.getElementById('level').value==='12'&&Math.abs(actual-expected)<0.005});document.body.appendChild(out)},50)},50)},100)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18766
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1500 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="lvup-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
