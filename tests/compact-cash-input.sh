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
probe=r'''<script>setTimeout(()=>{const level=document.getElementById('level');level.value='22';level.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const cash=document.getElementById('cash');const gravityBefore=document.querySelector('.buy[data-key="gravity"]').disabled;cash.value='47.65M';cash.dispatchEvent(new Event('paste',{bubbles:true}));setTimeout(()=>{const displayed=cash.value;const gravityAfter=document.querySelector('.buy[data-key="gravity"]').disabled;const out=document.createElement('pre');out.id='compact-cash-result';out.textContent=JSON.stringify({displayed,gravityBefore,gravityAfter,pass:displayed==='47650000'&&gravityBefore===true&&gravityAfter===false});document.body.appendChild(out)},80)},60)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18773
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="compact-cash-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
