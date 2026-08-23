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
probe=r'''<script>setTimeout(()=>{const level=document.getElementById('level');level.value='50';level.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{level.value='1';level.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),types=(st.actionLog||[]).map(x=>x.type),pass=st.run&&st.run.id===2&&types.includes('prestige_boundary')&&types.includes('run_start');const out=document.createElement('pre');out.id='run-boundary-result';out.textContent=JSON.stringify({run:st.run,types,pass});document.body.appendChild(out)},80)},80)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18779
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="run-boundary-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
