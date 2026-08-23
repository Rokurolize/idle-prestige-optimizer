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
probe=r'''<script>setTimeout(()=>{const auto=document.getElementById('cashAuto');auto.checked=false;auto.dispatchEvent(new Event('change',{bubbles:true}));const cash=document.getElementById('cash');cash.value='1000';cash.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{document.getElementById('applyBest').click();setTimeout(()=>{const dps=document.getElementById('dps');dps.value='1.50';dps.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),purchase=(st.actionLog||[]).find(x=>x.type==='purchase'),cal=(st.actionLog||[]).find(x=>x.type==='dps_calibration'),pass=!!purchase&&!!purchase.recommendation&&!!cal&&Number.isFinite(cal.detail.afterFactor)&&document.getElementById('actionLog').textContent.includes('購入')&&document.getElementById('runLabel').textContent.includes('Run #');const out=document.createElement('pre');out.id='action-log-result';out.textContent=JSON.stringify({count:st.actionLog.length,purchase,calibration:cal,pass});document.body.appendChild(out)},80)},80)},80)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18778
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="action-log-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
