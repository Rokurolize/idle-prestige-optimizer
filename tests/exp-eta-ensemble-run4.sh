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
seed=r'''<script>(()=>{const now=Date.now(),hist={1:{9:43.728,10:62.543,11:51.423,12:48.280,13:27.392,14:46.439,15:41.472,16:28.433,17:27.968},2:{9:44.408,10:50.423,11:47.913,12:45.711,13:54.072,14:47.080,15:31.696,16:25.560,17:34.464},3:{9:26.448,10:56.160,11:38.986,12:52.360,13:46.152,14:55.536,15:48.048,16:43.442,17:52.840}},cur={9:32.296,10:39.944,11:44.048,12:42.031,13:38.161,14:44.655,15:26.768,16:25.208},log=[];for(const [r,levels] of Object.entries(hist))for(const [l,sec] of Object.entries(levels))log.push({at:now-1000000+Number(r)*10000+Number(l),runId:Number(r),type:Number(r)===1?'exp_full_legacy':'exp_full_level_up',level:Number(l)+1,cash:0,dps:100,detail:{from:Number(l),to:Number(l)+1,durationMs:sec*1000,source:'full'}});for(const [l,sec] of Object.entries(cur))log.push({at:now-100000+Number(l),runId:4,type:'exp_full_level_up',level:Number(l)+1,cash:0,dps:100,detail:{from:Number(l),to:Number(l)+1,durationMs:sec*1000,source:'full'}});localStorage.setItem('prestige-route-optimizer-v1',JSON.stringify({schemaVersion:10,run:{id:4,startedAt:now-500000},level:17,cash:1000,cashAuto:false,cashUpdatedAt:now,incomeMode:'manual',income:1000,timing:{level:17,startedAt:now,recordedAt:null},actionLog:log,upgrades:{speed:{name:'Speed',value:20,cost:1,step:1,stepDelta:0,growth:1.2,unlock:1,cap:null,model:'linear',confidence:'高'},power:{name:'Power',value:100,cost:21000,step:10,stepDelta:.4,growth:1.73,unlock:1,cap:null,model:'linear',confidence:'高'}}}))})();</script>'''
s=s.replace('<script>\n(() => {',seed+'<script>\n(() => {',1)
probe=r'''<script>setTimeout(()=>{const eta=document.getElementById('levelEta'),text=eta.textContent,title=eta.title,nums=(text.match(/\d+/g)||[]).map(Number),rec=document.getElementById('recommend').textContent,pass=text.includes('〜')&&nums.length>=2&&nums[0]<=18&&nums[1]>=25&&title.includes('中央予測')&&rec.includes('待機判定には早い側');const out=document.createElement('pre');out.id='eta-ensemble-result';out.textContent=JSON.stringify({text,title,rec:rec.slice(0,220),pass});document.body.appendChild(out)},250)</script>'''
s=s.replace('</body>',probe+'</body>')
open(p,'w',encoding='utf-8').write(s)
PY
port=18781
python3 -m http.server "$port" --directory "$tmp" >"$tmp/server.log" 2>&1 & server_pid=$!
sleep .2
result="$(google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=2000 --dump-dom "http://127.0.0.1:$port/" 2>"$tmp/chrome.log" | sed -n 's/.*<pre id="eta-ensemble-result">\(.*\)<\/pre>.*/\1/p')"
echo "$result"
grep -q '"pass":true' <<<"$result"
