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
localStorage.setItem('crush-goal-optimizer-v2',JSON.stringify({goal:'ascension',ascensionCount:99,heldIngots:0,prestigeCount:0,prestigeMultiplier:1,currentCoreLevels:[156,0,154,9,56],currentSlowdownLevel:46,compressionEnabled:true,discardedAscensions:52,maxLevelEver:18066,compressionLockedLevel:9485,normalAutoUnlocked:true,uiClickRate:4,normalAutoUpdatesPerSecond:36.5,dpsCalibration:1,hpCalibration:1,ingotLevels:[218,218,217,217,10,212,17,100],strategyStyle:'normal'}));
window.Worker=class{constructor(){this.onmessage=null;this.onerror=null}postMessage(){}terminate(){}};
</script>'''
s=s.replace('<script src="ascension-model.js?v=r82-runtime-20260831a"></script>',seed+'<script src="ascension-model.js?v=r82-runtime-20260831a"></script>',1)
probe=r'''<script>setTimeout(()=>{const req=document.getElementById('nextRequirementObserved');req.value='3.15e69';req.dispatchEvent(new Event('input',{bubbles:true}));const effects=document.getElementById('coreEffects');effects.value='9.134385233318143e46,1,155,90%,1e52';document.getElementById('applyCoreEffects').click();const before={a:document.getElementById('ascension').value,core:document.getElementById('currentCore').value,status:document.getElementById('stateConsistency').textContent};document.getElementById('ascendSync').click();const saved=JSON.parse(localStorage.getItem('crush-goal-optimizer-v2')),out=document.createElement('pre');out.id='state-inference-ui-result';out.textContent=JSON.stringify({before,afterA:document.getElementById('ascension').value,afterRequirement:saved.nextRequirementObserved,savedA:saved.ascensionCount,pass:before.a==='109'&&before.core==='156,0,154,9,56'&&saved.ascensionCount===110&&document.getElementById('ascension').value==='110'&&Math.abs(saved.nextRequirementObserved/1.1172415488304904e70-1)<1e-12});document.body.appendChild(out)},250)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=$((23000 + RANDOM % 8000))
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --window-size=1600,900 --virtual-time-budget=1000 --dump-dom "http://127.0.0.1:$port/ascension.html" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="state-inference-ui-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
