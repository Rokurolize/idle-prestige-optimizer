#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'kill "${server_pid:-}" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cp "$root/index.html" "$root/v6-model.js" "$root/v6-worker.js" "$tmp/"

cat >"$tmp/seed.html" <<'HTML'
<!doctype html><meta charset="utf-8"><script>
localStorage.setItem('prestige-route-optimizer-v1', JSON.stringify({
  schemaVersion: 14,
  level: 5,
  cashAuto: false,
  run: {id: 1, startedAt: Date.now() - 10000},
  actionLog: [{
    at: Date.now() - 5000,
    runId: 1,
    type: 'purchase',
    level: 5,
    detail: {key: 'speed', name: 'Speed', cost: 50, from: null, to: null, source: 'historical-malformed'}
  }]
}));
document.body.textContent='seeded';
</script>
HTML

python3 - "$tmp/index.html" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]);s=p.read_text()
probe=r'''<script>
setTimeout(()=>{
  if(!sessionStorage.getItem('malformed-log-reloaded')){
    const level=document.getElementById('level');
    level.value='12';
    level.dispatchEvent(new Event('change',{bubbles:true}));
    const perm=document.getElementById('prestigeCash');
    perm.value='1.75';
    perm.dispatchEvent(new Event('change',{bubbles:true}));
    sessionStorage.setItem('malformed-log-reloaded','1');
    setTimeout(()=>location.reload(),120);
    return;
  }
  setTimeout(()=>{
    const st=JSON.parse(localStorage.getItem('prestige-route-optimizer-v1'));
    const malformed=(st.actionLog||[]).find(x=>x.detail&&x.detail.source==='historical-malformed');
    const catchup=(st.actionLog||[]).filter(x=>x.type==='catchup_sync').slice(-1)[0];
    const perm=(st.actionLog||[]).filter(x=>x.type==='permanent_edit'&&x.detail&&x.detail.field==='prestigeCash').slice(-1)[0];
    const rowText=document.getElementById('actionLog').textContent;
    const out=document.createElement('pre');out.id='malformed-log-persistence-result';
    out.textContent=JSON.stringify({
      level:st.level,
      prestigeCash:st.prestigeCash,
      catchup:catchup&&catchup.detail,
      permanent:perm&&perm.detail,
      malformedRendered:rowText.includes('Speed')&&rowText.includes('—'),
      pass:st.level===12&&st.prestigeCash===1.75&&!!malformed&&!!catchup&&catchup.detail.fromLevel===5&&catchup.detail.toLevel===12&&!!perm&&perm.detail.after===1.75&&rowText.includes('Speed')&&rowText.includes('—')
    });
    document.body.appendChild(out);
  },180);
},180);
</script>'''
s=s.replace('</body>',probe+'</body>');p.write_text(s)
PY

port=$((22000 + RANDOM % 8000))
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
profile="$tmp/profile"
google-chrome --headless=new --disable-gpu --no-sandbox --user-data-dir="$profile" --virtual-time-budget=500 --dump-dom "http://127.0.0.1:$port/seed.html" >/dev/null 2>"$tmp/seed-chrome.log"
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --user-data-dir="$profile" --virtual-time-budget=3000 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="malformed-log-persistence-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
