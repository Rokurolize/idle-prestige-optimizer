#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
page="$root/ascension.html"
grep -q '深掘りAPを比較' "$page"
grep -q 'M.evaluateAutoPrestigeScheduleSetting(ctx.input' "$page"
grep -q '残りのPrestige回数は最短の埋めAPへ切り替えた実用スケジュール' "$page"
! grep -q 'M.evaluateAutoPrestigeSetting(ctx.input' "$page"
echo 'schedule-aware AP comparison UI wiring: PASS'
