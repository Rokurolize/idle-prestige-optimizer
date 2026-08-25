#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
page="$root/ascension.html"
model="$root/ascension-model.js"
worker="$root/ascension-worker.js"
grep -q 'Ascension AFK Optimizer' "$page"
grep -q 'ascension-worker.js' "$page"
grep -q 'Core Ingot絶対最大' "$page"
grep -q 'One-shot安全率' "$page"
grep -q 'Ingot Upgrade 購入計画' "$page"
grep -q 'fitCalibration' "$model"
grep -q 'optimizeAscension' "$model"
grep -q 'optimizeIngotUpgrades' "$model"
grep -q "importScripts('ascension-model.js')" "$worker"
grep -q 'href="ascension.html"' "$root/index.html"
echo 'ascension page smoke: PASS'
