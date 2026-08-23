#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$tmp/index.html"
python3 - "$tmp/index.html" <<'PY'
import sys
p=sys.argv[1]
s=open(p,encoding='utf-8').read()
seed=r'''<script>localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:10,level:10,cash:0,cashAuto:false,incomeMode:'auto',actionLog:[],run:{id:1,startedAt:Date.now()}}))</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1)
probe=r'''<script>setTimeout(()=>{const btn=document.querySelector('.buy[data-key="speed"]'),disabled=btn.disabled;btn.click();setTimeout(()=>{const st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1')),p=st.actionLog.filter(x=>x.type==='purchase').at(-1),out=document.createElement('pre');out.id='auth-reflect-result';out.textContent=JSON.stringify({disabled,speed:st.upgrades.speed.value,cash:st.cash,shortfall:p&&p.detail.cashShortfall,pass:disabled===false&&st.upgrades.speed.value===11&&st.cash===0&&p.detail.cashShortfall===50});document.body.appendChild(out)},80)},150)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18778
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="auth-reflect-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
