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
probe=r'''<script>setTimeout(()=>{const btn=document.getElementById('timerRecord'),cash=document.getElementById('cash'),before=btn.getBoundingClientRect(),beforeText=document.getElementById('recommend').innerText;cash.value='57.46M';cash.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const mid=btn.getBoundingClientRect(),midText=document.getElementById('recommend').innerText;cash.value='500M';cash.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const after=btn.getBoundingClientRect(),afterText=document.getElementById('recommend').innerText,out=document.createElement('pre');out.id='stable-level-result';const stable=Math.abs(before.top-mid.top)<.5&&Math.abs(mid.top-after.top)<.5&&Math.abs(before.left-mid.left)<.5&&Math.abs(mid.left-after.left)<.5,changed=beforeText!==midText||midText!==afterText;out.textContent=JSON.stringify({before:{top:before.top,left:before.left},mid:{top:mid.top,left:mid.left},after:{top:after.top,left:after.left},changed,stable,pass:changed&&stable&&btn.closest('.gamePanel')!=null});document.body.appendChild(out)},90)},90)},150)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18776
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --window-size=1180,900 --virtual-time-budget=2200 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="stable-level-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
