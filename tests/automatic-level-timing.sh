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
probe=r'''<script>setTimeout(()=>{const level=document.getElementById('level');const auto=document.getElementById('cashAuto');auto.checked=false;auto.dispatchEvent(new Event('change',{bubbles:true}));level.value='11';level.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('levelUp').click();setTimeout(()=>{const first=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1'));const started=first.level===12&&first.timing&&first.timing.level===12&&Number.isFinite(first.timing.startedAt);document.getElementById('levelUp').click();setTimeout(()=>{const second=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1'));const h=second.history&&second.history[0];const recovered=!!h&&h.from===12&&h.to===13&&h.source==='level-up'&&h.ms>=400;const out=document.createElement('pre');out.id='timing-result';out.textContent=JSON.stringify({started,recovered,history:h||null,pass:started&&recovered});document.body.appendChild(out)},50)},500)},100)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18767
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="timing-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
