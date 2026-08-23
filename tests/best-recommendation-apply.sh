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
probe=r'''<script>setTimeout(()=>{const cash=document.getElementById('cash');cash.value='1000';cash.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const btn=document.getElementById('applyBest'),before=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),beforeCash=before.cash,beforeValues=Object.fromEntries(Object.entries(before.upgrades).map(([k,u])=>[k,u.value]));btn.click();setTimeout(()=>{const after=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),changed=Object.keys(after.upgrades).filter(k=>after.upgrades[k].value!==beforeValues[k]);const out=document.createElement('pre');out.id='best-apply-result';out.textContent=JSON.stringify({button:!!btn,beforeCash,afterCash:after.cash,changed,pass:!!btn&&after.cash<beforeCash&&changed.length===1});document.body.appendChild(out)},80)},80)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18775
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="best-apply-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
