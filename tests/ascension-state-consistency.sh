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
seed=r'''<script>
localStorage.setItem('crush-goal-optimizer-v2',JSON.stringify({goal:'ascension',ascensionCount:19,heldIngots:281216,prestigeCount:0,prestigeMultiplier:1,currentCoreLevels:[28,31,28,9,18],currentSlowdownLevel:12,compressionEnabled:true,normalAutoUnlocked:true,discardedAscensions:52,maxLevelEver:9485,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1,ingotLevels:[0,0,0,0,0,0,0,0],strategyStyle:'normal'}));
window.__workerPosts=0;
window.Worker=class{constructor(){this.onmessage=null;this.onerror=null}postMessage(){window.__workerPosts++}terminate(){}};
</script>'''
s=s.replace('<script src="ascension-model.js?v=r82-runtime-20260831a"></script>',seed+'<script src="ascension-model.js?v=r82-runtime-20260831a"></script>',1)
probe=r'''<script>
setTimeout(()=>{
 const warningBefore=document.getElementById('stateConsistency').textContent;
 const verdictBefore=document.getElementById('strategyVerdict').textContent;
 const postsBefore=window.__workerPosts;
 const a=document.getElementById('ascension');a.value='20';a.dispatchEvent(new Event('input',{bubbles:true}));
 document.getElementById('optimize').click();
 setTimeout(()=>{
   const warningAfter=document.getElementById('stateConsistency').textContent;
   const postsAfter=window.__workerPosts;
   const out=document.createElement('pre');out.id='consistency-result';
   out.textContent=JSON.stringify({warningBefore,verdictBefore,postsBefore,warningAfter,postsAfter,pass:warningBefore.includes('A19')&&warningBefore.includes('A20')&&verdictBefore.includes('入力状態が矛盾')&&postsBefore===0&&warningAfter===''&&postsAfter>0});
   document.body.appendChild(out);
 },400);
},150);
</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18845
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --window-size=1648,900 --virtual-time-budget=1200 --dump-dom "http://127.0.0.1:$port/ascension.html" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="consistency-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
