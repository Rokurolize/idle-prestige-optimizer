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
probe=r'''<script>setTimeout(()=>{const auto=document.getElementById('cashAuto');auto.checked=false;auto.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('paste').value='Level: 11';document.getElementById('catchupAtLevelStart').checked=true;document.getElementById('catchupBtn').click();setTimeout(()=>{document.getElementById('timerRecord').click();setTimeout(()=>{const st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),h=st.history&&st.history[0],a=(st.actionLog||[]).filter(x=>x.type==='exp_full_level_up').slice(-1)[0],eta=a&&a.detail&&a.detail.etaAtFull,pass=st.level===12&&st.timing.level===12&&h&&h.from===11&&h.to===12&&h.source==='full'&&h.ms>=350&&a&&a.detail.from===11&&a.detail.to===12&&a.detail.exactTiming===true&&eta&&Number.isFinite(eta.earlyRemaining)&&Number.isFinite(eta.midRemaining)&&Number.isFinite(eta.lateRemaining);const out=document.createElement('pre');out.id='exp-advance-result';out.textContent=JSON.stringify({level:st.level,timing:st.timing,history:h,action:a,pass});document.body.appendChild(out)},80)},420)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18776
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="exp-advance-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
