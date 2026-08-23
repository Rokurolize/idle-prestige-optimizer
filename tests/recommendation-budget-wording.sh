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
probe=r'''<script>setTimeout(()=>{const level=document.getElementById('level');level.value='46';level.dispatchEvent(new Event('change',{bubbles:true}));const auto=document.getElementById('incomeAuto');auto.checked=false;auto.dispatchEvent(new Event('change',{bubbles:true}));const income=document.getElementById('income');income.value='1M';income.dispatchEvent(new Event('change',{bubbles:true}));const setValue=(k,v)=>{const e=document.querySelector(`.value[data-key="${k}"]`);if(e){e.value=String(v);e.dispatchEvent(new Event('change',{bubbles:true}))}},setCost=(k,v)=>{const e=document.querySelector(`.cost[data-key="${k}"]`);if(e){e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}};setValue('spikeCount',12);setValue('spikeSize',1.15);setValue('feed',4);setCost('speed','62.51M');setCost('power','335.4M');setCost('reducer','178.7M');setCost('rare','204.8M');setCost('gravity','98.3M');const cash=document.getElementById('cash');cash.value='57.46M';cash.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const text=document.getElementById('recommend').textContent,pass=text.includes('最大8手の時間ベース先読み')&&text.includes('購入可能まで')&&text.includes('Lv50までの残り')&&text.includes('満タン予測を越える待機は候補から外し')&&!text.includes('現在買える候補の中');const out=document.createElement('pre');out.id='budget-wording-result';out.textContent=JSON.stringify({text,pass});document.body.appendChild(out)},160)},120)</script>'''
s=s.replace('</body>', probe+'</body>')
open(p,'w', encoding='utf-8').write(s)
PY
port=18777
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1800 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="budget-wording-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
