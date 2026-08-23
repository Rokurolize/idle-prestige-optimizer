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
probe=r'''<script>setTimeout(()=>{const auto=document.getElementById('cashAuto');auto.checked=false;auto.dispatchEvent(new Event('change',{bubbles:true}));const cash=document.getElementById('cash');cash.value='1000';cash.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const beforeCash=Number(cash.value),beforePower=Number(document.querySelector('.value[data-key="power"]').value),beforeSpeed=Number(document.querySelector('.value[data-key="speed"]').value),btn=document.getElementById('applyBundle');if(btn)btn.click();setTimeout(()=>{const afterCash=Number(cash.value),afterPower=Number(document.querySelector('.value[data-key="power"]').value),afterSpeed=Number(document.querySelector('.value[data-key="speed"]').value),out=document.createElement('pre');out.id='bundle-result';out.textContent=JSON.stringify({button:!!btn,beforeCash,afterCash,beforePower,afterPower,beforeSpeed,afterSpeed,pass:!!btn&&afterCash<beforeCash&&(afterPower>beforePower||afterSpeed>beforeSpeed)});document.body.appendChild(out)},80)},80)},100)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18768
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1500 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="bundle-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
