#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/ascension.html" "$root/ascension-model.js" "$root/ascension-worker.js" "$tmp/"
python3 - "$tmp/ascension.html" <<'PY'
import sys
p=sys.argv[1]
s=open(p,encoding='utf-8').read()
probe=r'''<script>setTimeout(()=>{const hero=document.getElementById('paceHero').textContent,metrics=document.getElementById('paceMetrics').textContent,out=document.createElement('pre');out.id='pace-result';out.textContent=JSON.stringify({hero,metrics,pass:hero.includes('AP Lv4280')&&hero.includes('Lv4100')&&metrics.includes('Lv4100')&&metrics.includes('1.79×')});document.body.appendChild(out)},100)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18831
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=1600 --dump-dom "http://127.0.0.1:$port/ascension.html" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="pace-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
