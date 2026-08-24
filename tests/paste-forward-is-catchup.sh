#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$root/v6-model.js" "$tmp/"
python3 - "$tmp/index.html" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text()
probe=r'''<script>setTimeout(()=>{const level=document.getElementById('level');level.value='10';level.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{document.getElementById('paste').value='Level: 13\n所持金: $1K';document.getElementById('parseBtn').click();setTimeout(()=>{const st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),c=(st.actionLog||[]).filter(x=>x.type==='catchup_sync').slice(-1)[0],out=document.createElement('pre');out.id='paste-catchup-result';out.textContent=JSON.stringify({level:st.level,timing:st.timing,catchup:c&&c.detail,expCount:(st.actionLog||[]).filter(x=>x.type==='exp_full_level_up').length,pass:st.level===13&&st.cash===1000&&st.timing.quality==='partial'&&c&&c.detail.fromLevel===10&&c.detail.toLevel===13&&c.detail.trainablePerLevel===false&&(st.actionLog||[]).filter(x=>x.type==='exp_full_level_up').length===0});document.body.appendChild(out)},120)},100)},120)</script>'''
s=s.replace('</body>',probe+'</body>');p.write_text(s)
PY
port=$((22000 + RANDOM % 8000))
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2200 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="paste-catchup-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
