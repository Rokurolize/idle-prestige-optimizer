import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repo = process.env.TEST_ROOT ? resolve(process.env.TEST_ROOT) : resolve(new URL('..', import.meta.url).pathname);
const temp = await mkdtemp(join(tmpdir(), 'bundle-click-race-'));
const httpPort = 18841;
const debugPort = 18842;
const server = spawn('python3', ['-m', 'http.server', String(httpPort), '--directory', repo], { stdio: 'ignore' });
const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${temp}`,
  `http://127.0.0.1:${httpPort}/`,
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function retry(fn, attempts = 40) {
  let error;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { error = e; await sleep(100); }
  }
  throw error;
}

let ws;
let seq = 0;
const pending = new Map();
function call(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolvePromise, reject) => pending.set(id, { resolve: resolvePromise, reject }));
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
  return result.result.value;
}

try {
  const pages = await retry(async () => {
    const r = await fetch(`http://127.0.0.1:${debugPort}/json`);
    if (!r.ok) throw new Error(`debug endpoint ${r.status}`);
    const x = await r.json();
    const page=x.find(p=>p.url===`http://127.0.0.1:${httpPort}/`);
    if (!page) throw new Error('app page not found');
    return [page];
  });
  ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise((resolvePromise, reject) => { ws.addEventListener('open', resolvePromise, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const p = pending.get(message.id); pending.delete(message.id);
    if (message.error) p.reject(new Error(message.error.message)); else p.resolve(message.result);
  });
  await call('Runtime.enable');
  await retry(async () => {
    const ready = await evaluate(`document.readyState === 'complete' && !!document.getElementById('applyBundle')`);
    if (!ready) throw new Error('app not ready');
    return true;
  });

  // Put an upgrade input into the exact state that triggers the real-pointer race:
  // it is focused and dirty, so pointer-down on the bundle button fires change/blur first.
  const setup = await evaluate(`(() => {
    const cash=document.getElementById('cash'); cash.value='1000'; cash.dispatchEvent(new Event('change',{bubbles:true}));
    const income=document.getElementById('income'); income.value='100'; income.dispatchEvent(new Event('change',{bubbles:true}));
    const input=document.querySelector('.cost[data-key="speed"]'); input.focus(); input.value=String(Number(input.value)+1);
    const b=document.getElementById('applyBundle'); b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect();
    const pm=v=>{const m=String(v).match(/^([\\d.]+)([KMBT])?$/i);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2]||'').toUpperCase()]||1):NaN};
    return {x:r.left+r.width/2,y:r.top+r.height/2,beforeCash:pm(cash.value),beforeSpeed:Number(document.querySelector('.value[data-key="speed"]').value)};
  })()`);
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: setup.x, y: setup.y, button: 'left', clickCount: 1 });
  // Cross the 1s live-cash refresh while the pointer is held down. The old UI
  // replaces the button between press/release and loses the click entirely.
  await sleep(1200);
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: setup.x, y: setup.y, button: 'left', clickCount: 1 });
  await sleep(100);
  const after = await evaluate(`(()=>{const pm=v=>{const m=String(v).match(/^([\\d.]+)([KMBT])?$/i);return m?Number(m[1])*({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2]||'').toUpperCase()]||1):NaN};return {cash:pm(document.getElementById('cash').value),speed:Number(document.querySelector('.value[data-key="speed"]').value),toast:document.getElementById('toast').textContent}})()`);
  const pass = after.cash < setup.beforeCash || after.speed > setup.beforeSpeed;
  console.log(JSON.stringify({ ...setup, ...after, pass }));
  if (!pass) process.exitCode = 1;
} finally {
  if (ws) ws.close();
  chrome.kill('SIGTERM');
  server.kill('SIGTERM');
  await Promise.race([new Promise(resolvePromise => chrome.once('exit', resolvePromise)), sleep(1000)]);
  await Promise.race([new Promise(resolvePromise => server.once('exit', resolvePromise)), sleep(1000)]);
  await retry(() => rm(temp, { recursive: true, force: true }), 10);
}
