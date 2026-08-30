# idle-prestige-optimizer — project and handoff notes

This file exists to prevent loss of implicit context between long-running ChatGPT/DevSpace sessions. Treat it as a bootstrap/handoff, not as a substitute for the current checkout, current Git history, current Issue/PR state, or the r82 VRCW analysis artifacts. Re-verify anything that can have changed before committing or merging.

## Project / workflow contract

- Repository: `Rokurolize/idle-prestige-optimizer`
- Primary checkout: `/home/roku/src/Rokurolize/idle-prestige-optimizer`
- Current DevSpace workspace at the time this file was written: `ws_9e59043367`
- Work only in the primary checkout unless the user explicitly asks for an isolated worktree.
- Default development style: minimal implementation, YAGNI, no unnecessary compatibility layers, preserve observed game behavior rather than inventing cleaner semantics.
- Do not repeatedly re-check facts that are already established unless a code/test/result changed them.
- Use DevSpace `bash` only for inspection, tests, builds, git/gh operations, searches, and directory inspection. Use DevSpace `edit`/`write` for project-file modifications.
- Protected `main`: finish work through commit -> push -> PR -> checks -> normal merge -> Issue close -> GitHub Pages deployment/public-page verification. Do not report completion before those actually happen.
- The user allows DevSpace subagents. Read `~/.agents/skills/subagents/SKILL.md` when parallel review/research is useful. Keep agents review-only when they share this dirty checkout unless write isolation is deliberate.
- Avoid giant/broad searches outside exact known roots. In particular, do not recursively search all of `/home/roku/src` or unrelated analysis directories.

## Current Git state — 2026-08-30 handoff

At the handoff point:

- Branch: `feat/closed-loop-a500`
- HEAD = `origin/main` = `6932f1c44b9e18ae1f0399b564ec242084126c7d`
- Base commit title: `Merge pull request #136 from Rokurolize/fix/compression-direct-ingot-roadmap-performance`
- Issue #137 is OPEN: `Add closed-loop A500 policy with dynamic Ingot AUTO and Legacy resets`
- The branch has **uncommitted** work. Do not discard or reset it.
- Dirty files observed before this AGENTS.md was added:
  - `ascension-model.js`
  - `ascension.html`
  - `tests/ascension-page.sh`
  - `tests/ascension-recommended-state-sync.sh`
  - `tests/ascension-state-consistency.sh`
  - `tests/practical-core-strategy-ui.sh`
  - `tests/singularity-v76.mjs`
  - untracked `tests/a29-closed-loop-policy.mjs`
- `AGENTS.md` itself is newly created by the handoff session and will also be untracked until committed.

Always begin the next implementation session with `git status --short --branch`, `git diff --stat`, and a focused inspection of the changed sections. Do not assume this dated list remains exact.

## Authoritative CRUSH FACTORY IDLE r82 evidence

The optimizer must now target asset **r82**, not r78/r80.

Analysis root:

`/home/roku/vrc-analysis/crush-factory-idle-v82/`

Read these before changing r82 mechanics:

- `/home/roku/vrc-analysis/AGENTS.md`
- `/home/roku/vrc-analysis/crush-factory-idle-v82/reports/version-diff-v78-v82.md`
- `/home/roku/vrc-analysis/crush-factory-idle-v82/reports/runtime-config-diff-v78-v82.tsv`
- `/home/roku/vrc-analysis/crush-factory-idle-v82/reports/udon-program-diff-v78-v82.tsv`
- `/home/roku/vrc-analysis/crush-factory-idle-v82/analysis-manifest.json`
- `/home/roku/vrc-analysis/crush-factory-idle-v82/input/SOURCE.txt`

r82 source identity:

- Original VRCW: `/mnt/e/Users/jio/Downloads/World-CRUSH-FACTORY-IDLE-Asset-b.file_3287cf8d-d666-43d2-9f1c-74095cef7015.82.vrcw`
- SHA-256: `e5c63a446e6453efaf0cc26c432488c029cdf9fc5b8d34b1576c62491f4fec04`
- Size: `45,908,902` bytes

**Runtime serialized public variables are authoritative.** Udon program heap/constructor defaults can differ and must not replace instantiated scene values.

## r82 mechanics that must not regress

### Compression E

r82 preserves the r78 Legacy-lock semantic: active Compression uses the best level captured at the most recent Legacy, not the live best level reached afterward.

Use a separate `compressionLockedLevel` / locked `L` in state.

For discarded Ascensions `D`:

`E = 10^(L/7500) / 185 * sqrt(D/50) + L/1805 + 0.04*D`

Do not silently fall back to the old `L/1500` formula.

### Direct Compression Ingots

`compressionIngotTargetHours` changed `20 -> 1`, so the direct-Ingot reward per ore is exactly 20x the old r78/r80 value for an otherwise identical state.

The model currently represents this with:

- former denominator: `11,113,200`
- r82 denominator: `555,660`

The A29 live harvest measurement was recorded before this r82 evidence/model update. Its previous `11.2739...` payout multiplier must **not** be used to cancel r82's 20x reward. The current branch has `R82_DEFAULT_DIRECT_FLOW_CALIBRATION = 1` and retains the old value only as a pre-r82 reference.

If the user inputs the debug-panel crush rate, use it as calibration of the **current physical state**, then carry the ratio to candidates. Do not use the observed raw rate as a hard ceiling on upgraded candidates.

### Slowdown and Core/Infinity Feed are different tables

This is a critical user-observed correction.

- **Slowdown perk remains capped at Lv46 / x1e42.**
- **Core/Infinity Feed was extended to Lv56 / x1e52.**
- Do not use one shared table for both.

The ten added Core/Infinity Feed multipliers are approximately `1e43 ... 1e52`; costs are:

`2e22, 5e22, 1.5e23, 4e23, 1e24, 3e24, 8e24, 2e25, 6e25, 1.5e26`

The current dirty model has separate `SLOWDOWN` and `CORE_FEED` arrays. Preserve that separation.

### Bomb chance

r82 base Bomb chance is `0.20%`, represented as `.002`; Danger multiplier remains 2x.

### Ingot caps

r82 fixes max-state handling. Optimizer purchase search must not spend beyond effective caps:

- Gem Chance: +1.0 percentage point -> optimizer cap Lv10 with current effect formula.
- Orichalcum Rate: 100 percentage points -> optimizer cap Lv100.
- Stall Recovery cap/floor remains represented by Lv17 in the optimizer.

### Volume accounting

r82 adds persistent log-domain `statVolC` / total-volume-crush state. Future cumulative volume is accumulated with the Compression E that applied **at each crush**.

Do **not** model r82 cumulative volume as `historical totalCrushLog + current Compression E` applied retroactively.

The current branch UI already has an optional `totalVolumeCrushLog` input, but old helper functions such as `compressionVolumeLog(bestLevel, discarded, totalCrushLog)` / `observableUniverseBestLevel(...)` still reconstruct volume using current E. Those legacy helpers are a correctness blocker if used for r82 Singularity/A500 claims. Either migrate them to `statVolC` semantics or remove them from authoritative planning.

## User's strategic goal

The optimizer must beat the user's fast-changing manual play, not merely produce a static local optimum after several seconds.

Primary product target:

- Produce a **closed-loop policy** for reaching **A500 as fast as possible**.
- Inputs can become stale while the user types; output should therefore describe thresholds/actions (`when X happens, switch Y`) rather than only a single snapshot.
- Campaign search must consider optional `工場を捨てる` / Legacy resets and the possibility of intentionally pushing a higher best Level before Legacy when that wins total time.
- Do not assume Legacy is always useful or always useless; compare it with admissible/correct reasoning.
- Do not extrapolate “Compression ON won N consecutive Ascensions, therefore ON until A499.” The current work already found a counterexample: direct finite probing can switch back (e.g. old A2-A7 ON then A8 OFF behavior).
- Input editing should not automatically launch multi-second A500 optimization after every keystroke. Current UI intentionally waits for the explicit Optimize action after edits.

## Required Core Upgrade quick-reference table

The user explicitly requested a complete **A0-A500 Core allocation cheat sheet** so they can instantly verify that a retained previous allocation is not stealing enough Core to prevent one more Feed level.

This is not optional UX.

The current dirty branch already adds a page section and model helpers:

- `minimumCoreFeedLevelForSlowdown(...)`
- `compressionFarmPriorityCore(...)`
- `compressionFarmCoreForAscension(...)`
- `compressionFarmCoreTable(...)`
- UI table `A0–A500 Core配分早見表`

The stable post-25-Prestige reference is intentionally conservative/durable:

- Normal Feed at its Normal Upgrade cap (Lv30, effect x4)
- Ingot Feed assumed Lv0 for the lookup table because it changes too quickly to make a durable A-by-A table
- Slowdown at the actual r82 Slowdown cap (Lv46/x1e42)
- Buy only the Core Feed needed to sustain 20 top-spawns/s at that Slowdown, then put remaining Core into Core Damage
- Show both the recommended Feed level and the absolute Feed level affordable by Core so users can see where Feed has saturated and extra Feed would be waste
- Highlight current Ascension
- Display all 501 rows on the page (no separate pagination/internal vertical scrolling requested)

With Normal Feed Lv30 x4 and no Ingot Feed, the stable cap is around **Core Feed Lv47 / x1e43**. Thus at sufficiently high A, notably around the user's A49 observation, Core can afford higher Feed but it no longer increases spawn flow because Slowdown cannot exceed Lv46. Extra Core belongs in Damage instead.

The table is a **post-gate stable reference**, not necessarily the best Ascension-immediate gate allocation. The 25-Prestige bootstrap/gate may need a more Feed-heavy transient allocation while Normal/Ingot Feed are immature. UI/text must keep those phases distinct.

## User-observed A49 state / important interpretation

User observed at A49:

- next Ascension requirement = `8.00e33`▲
- Core Feed can be set around Lv48 / x1e44
- Slowdown cannot go past Lv46 / x1e42

This initially suggested direct-Ingot farming might hit a wall. Under the **current dirty r82 model**, however, the 20x direct-Ingot buff is so strong that the 25-Prestige gate can already produce enough ▲ before the gate finishes. The previous session estimated the campaign as being gate-limited rather than ▲-limited from A49 onward.

Do not treat the exact `325 s per Ascension` / `~40.73 h A49->A500` numbers as final until the current r82 branch passes final correctness review and tests. The 13 s x25 floor depends on the calibrated processing/contact model. It is a model/calibration lower bound, not a universal VRCW theorem.

If a later measurement changes the level-50 cycle, the Legacy decision must be recomputed automatically.

## Closed-loop policy class the user expects

The user's strong manual strategy that motivated Issue #137 is roughly:

1. Immediately after Ascension, lower Slowdown enough to resume progression.
2. Enable Normal Upgrade AUTO and Ingot Upgrade AUTO.
3. Set Auto Prestige Lv50 and fill the 25-Prestige requirement quickly.
4. Reallocate Core: Feed first as needed, then Damage.
5. After 25 Prestige, turn Auto Prestige OFF.
6. Raise Slowdown to the highest useful level supported by current Feed/Damage, but never beyond real r82 Lv46.
7. Let direct Ingots compound through Ingot AUTO; state can change tens of times per second.
8. Search which Ingot AUTO mask is actually worth enabling, not merely all-on. Stop AUTO when further purchases have worse payback than simply saving for Ascension.
9. Keep adapting Slowdown/Core as Feed/Damage changes.
10. At campaign scale, compare Ascend versus Legacy, including optional best-Level push before Legacy.

The optimizer should search a strategy class at least this rich; it must not claim to have beaten this strategy if it did not actually include equivalent transitions in the search space.

## Current dirty implementation — useful pieces already present

As of this handoff, the dirty branch contains substantial work in `ascension-model.js` / `ascension.html`, including:

- r82 model revision string `r82-runtime-20260830a`
- r82 source SHA comment
- r82 Compression E formula and `compressionLockedLevel`
- r82 20x direct-Ingot denominator
- r82 Bomb chance
- separate Slowdown Lv46 and Core Feed Lv56 tables
- Gem/Ori hard caps already represented by `INGOT.optimizerCap`
- `afterLegacyState(...)` helper that resets A to 0, adds discarded Ascensions, locks current best Level, resets held/prestige/Ingot/Core/Slowdown state
- dynamic Core Feed/Damage helper and A0-A500 Core cheat-sheet UI
- event-driven Ingot AUTO simulation with a 10 ms timer ceiling and default frame limit 36.5/s
- dynamic AUTO-mask search and an attempt at purchase stopping
- damage-aware farm snapshots and slowdown candidate selection
- a closed-loop A500 campaign attempt
- explicit `compressionLockedLevel` and optional `totalVolumeCrushLog` UI inputs
- explicit stale-result behavior after edits rather than auto-recomputing every input change

Do not throw these away casually. Review/refactor incrementally.

## Known correctness blockers — do not merge until resolved or deliberately removed

Multiple review-only DevSpace subagents independently flagged the campaign implementation as not merge-ready. Some findings may have been partly addressed since they were reported; verify current code instead of blindly repeating them. The major unresolved architectural risks are still visible in the dirty tree:

### 1. Legacy pruning is still heuristic, not an admissible proof

The current model still contains hardcoded:

- `LEGACY_RESET_OFF_CAP_ETA`
- `LEGACY_RESET_ON_TAIL_ENVELOPE_SECONDS`
- `LEGACY_FREE_BEST_LEVEL_SPEEDUP_GUARD = .15`

and uses them to prune Legacy branches.

A sampled per-A “optimistic envelope” plus a free 15% speedup is not automatically a mathematically admissible lower bound over every discarded count / best level / policy. It must not be described as a proof unless that admissibility is established.

Replace correctness pruning with branch-and-bound against a real feasible incumbent and a genuinely optimistic lower bound. Hardcoded envelope data can remain only as a heuristic/incumbent accelerator if it cannot eliminate a potentially winning route.

### 2. Campaign state identity is too small for full Legacy/best-Level planning

Current A500 graph historically keyed states mainly by `(discarded, ascension)` and can freeze best Level. A correct campaign that allows best-Level push / Legacy must preserve enough persistent state, at minimum:

- current Ascension `A`
- discarded Ascensions `D`
- locked Compression level `L` / current best-level history needed for next Legacy
- live best Level `B` when it can affect a future Legacy
- Compression mode if mode persistence/toggle cost matters

Transient held Ingots, Ingot levels, Prestige count, Core, Slowdown, AUTO settings may be solved inside an edge when a normal Ascend deterministically resets them, but the **initial real state** must be honored and Legacy must perform the exact reset transition.

### 3. Best-Level push must be an actual campaign alternative

Do not merely append a post-A500 level-push estimate or claim that a fixed 15% Legacy guard covers every possible pre-Legacy best-Level push.

A Legacy edge should be able to compare:

- Legacy now
- push to a candidate best Level, then Legacy
- keep ascending

while preserving the r82 rule that active E before Legacy uses the old locked Level and only the Legacy captures the new best Level.

### 4. r82 statVolC invalidates old retroactive volume helpers

As noted above, any route/readiness logic that still computes cumulative volume as `totalCrushLog + compressionE(current...)` is an r82 regression. The page input is called `totalVolumeCrushLog`; model internals must actually consume it as the persistent state rather than reconstruct historical volume.

### 5. Compression OFF lower bound must use the full current state

An earlier subagent found the old lower bound unsafe for states such as `prestigeCount=24` or already-sufficient held Ingots. Current work has started moving toward a fractional/optimistic relaxation, but verify:

- remaining prestige count is `max(0,25-prestigeCount)`, not hardcoded 25
- already-held Ingots are subtracted
- custom/current requirement is honored
- no rounded cache key can alias distinct held balances unsafely
- mixed schedules are not excluded if the bound is used to prune
- lower bound is never greater than an exhaustive feasible OFF optimum on differential fixtures

### 6. Ingot AUTO mask reduction must remain valid when Damage matters

Post-gate direct farming is not always purely Feed/Gem/Ori. If the crusher is HP/DPS-limited, Ingot Damage (index 2) can increase direct-Ingot throughput and must be in the candidate mask set.

The current dirty code has `compressionFarmRateSensitiveIngot(index)` including indices `2,3,4,7`; preserve/test that logic. Do not restore the earlier eight-mask `[Feed, Gem, Ori]` reduction globally unless damage non-binding is proven for that exact state.

### 7. No arbitrary purchase truncation

A prior 512-purchase cap produced incorrect later-A policies. Current work changed the default bound to the remaining number of allowed enabled-upgrade levels. Keep a test that no result silently truncates purchases; expose a truncation flag if any explicit cap is ever used.

### 8. Gate accounting must carry actual state forward

The 25-Prestige phase must account for:

- actual level reached at the 1 s Auto Prestige poll, not blindly `prestigeGain(50)` if it overshoots
- direct Ingots during gate runs
- Ingot AUTO purchases during runs
- `totalIngotsEarned` / Prestige permanent multiplier evolution when Prestige grants Ingots
- Normal AUTO / Normal levels when relevant to the following farm
- current `prestigeCount` if already >0

The gate state passed to harvest must be the real resulting state.

### 9. Damage/HP safety must be checked along the reached path

Checking only one final level is insufficient if the UI calls the policy “proven safe”. If a proof is displayed, verify the minimum kill/supply ratio across all relevant reached levels / policy edges. Otherwise word it as a sample/diagnostic rather than proof.

### 10. Worker responsiveness / cancellation

A0 / low-A Singularity searches previously exceeded tens or hundreds of seconds. The user specifically rejected “change one input, wait several seconds for a mediocre answer.”

Keep heavy campaign recomputation explicit, optimize the event simulator, use safe pruning, and ensure Worker requests can be replaced/cancelled cleanly. Add a real browser/Worker smoke test with a practical timeout and no `NaN`/`undefined` result.

## Performance constraints already promised to the user

Earlier completed work established two hard regressions that must stay >=10x faster than the actual old baseline:

- Ascension search: old truncating baseline around 6-10 s; optimized result around sub-second, >10x.
- Ingot Upgrade purchase roadmap: old baseline around 14-16 s; optimized result around 0.8 s, >10x.

Official benchmark scripts:

- `benchmarks/ascension-search-10x.mjs`
- `benchmarks/ingot-roadmap-10x.mjs`

Do not “optimize” the new A500 code by regressing those paths. Rerun benchmarks after final edits.

For the new A500 horizon, target practical interactive latency. The prior A29->A500 dirty implementation was around 3.5-4 s and a performance subagent identified the event simulator and OFF-bound scan as dominant costs. Incremental/event-driven simulation and grouped exact calculations are preferred over frame-by-frame / level-by-level brute force where equivalence can be proven.

## Tests / stale expectations to repair for r82

At this handoff several tests still visibly contain r80/r78 expectations. Search them explicitly; known examples include:

- `tests/ascension-page.sh` still expects an old r80 revision string.
- `tests/singularity-v76.mjs` still has the old `COMPRESSION_INGOT_DENOMINATOR=11113200` assertion.
- `tests/v80-runtime-audit.mjs` still expects Bomb `.0015` and is named/versioned for the old runtime.
- A23/A25/A29 Compression regressions must be reviewed because r82 direct-Ingot payout is 20x and the A29 observed harvest predates r82.

Do not simply change assertions until they pass. Decide whether each test is:

- an old-world historical calibration fixture that should remain explicitly pre-r82,
- a runtime authority test that must be updated to r82,
- or obsolete and should be replaced.

Add/retain focused r82 tests for:

- source/model revision identity
- Compression E equation and locked-Level semantics
- direct-Ingot denominator 555660 / 20x old reward
- Slowdown length/max = Lv46/x1e42 while Core Feed length/max = Lv56/x1e52
- Bomb 0.20%
- Gem/Ori/Stall caps
- Legacy transition state
- `statVolC` semantics (no retroactive current-E reconstruction)
- A0-A500 Core table invariants and the high-A feed saturation boundary
- A49 supplied example / gate-limited behavior once final model is trusted
- OFF lower-bound differential validity
- AUTO mask reduction versus exhaustive masks on small/random fixtures
- no purchase truncation
- A500 boundary (finite totals/state, explicit terminal action)
- a Legacy-winning synthetic fixture and a Legacy-losing current fixture
- a push-beneficial and push-harmful synthetic fixture
- Worker/browser completion and stale-input behavior

## User facts/UX constraints that should remain encoded in product behavior

- The “Normal Upgrade Auto unlocked (300▲)” checkbox was removed intentionally. The user does not want to re-check it after every Ascend and does not want that UI control consuming space. The product assumes it unlocked for normal optimizer use.
- Prestige count input must allow values above 25 because the game can show values such as 40/25.
- The user wants a button that synchronizes the recommended Core/Slowdown state back into the current input state after applying a recommendation in game.
- A static optimizer that assumes the user never changes Core/Slowdown manually is insufficient; both fixed/idle and manually-adjustable strategy classes were previously required.
- Avoid UI controls that can be accidentally toggled while changing nearby numeric values.
- Auto Prestige ergonomics are part of correctness. The user can only change the AP target through +100/+10/+1-style controls and does not accept a route that rewrites the target by hundreds of clicks every Ascension. Practical closed-loop plans must keep the AP target at Lv50 and express the one deep run by toggling Auto Prestige OFF, manually Prestiging once when the ▲ threshold is met, then turning Auto Prestige back ON. This is 0 AP-target-change clicks and normally 2 Auto toggles + 1 manual Prestige per Ascension.
- Repeated clicking on one stable UI target is acceptable when it materially reduces ETA and remains bounded. The focused strategy may therefore ask for Normal Rare Ore Rate clicks during the deep run only; the current 4 click/s candidate is roughly a 50-second focused interval, not a full-cycle clicking requirement. Do not promote 6-8 click/s as the default merely because it is theoretically faster.
- The former “Lv50 ×25, then wait for ▲” closed-loop conclusion was an artifact of an over-constrained gate and is not authoritative. The practical strategy overlaps the ▲ harvest with one deep Prestige run, then uses Lv50 count runs for the remaining Prestige requirement.
- Ranking/overnight search must not silently stop at Lv10000. The user has recorded reaching Lv18066. Treat `rankingMaxLevel` only as an initial horizon hint; expand until the requested wall-clock duration is covered. If the explicit safety horizon is ever reached, mark the result truncated/uncertain instead of presenting the capped Level as an optimum.
- After Legacy, the game may no longer show the current Ascension number. Treat the visible next-ASCEND ▲ requirement as a first-class state input and invert the authoritative requirement table/formula to recover A. Example: displayed `3.15e69` maps unambiguously to A109 (`3.147159292480255e69` exact model requirement). If the user keeps this input active, `ASCENDした` must advance both A and the exact internal next requirement without accumulating display-rounding error.
- High-level Core labels can leave the visible game panel while their effect values remain visible. Support inverse entry from the five displayed Core effects: Income/Ingot multipliers, Damage value, Cost reduction (percent or remaining factor), and Feed multiplier. Prefer current Core when it is tied for the minimum ETA; do not manufacture Core-click work merely to reach another equal-time allocation.
- Legacy bounds are state-dependent. At the current A109 checkpoint, the normal straight A109→A500 route is ~147,016 s while any Legacy must restart A0→A500 and therefore has a 500×25-Prestige physical floor of 162,500 s even with zero push/wait/UI time. This safely eliminates every Legacy and arbitrary pre-Legacy best-Level push for that state. Recompute the inequality from the live inferred A whenever the requirement changes; never cache A109 as a universal cutoff.

## Suggested next-session critical path

Do not start by polishing UI. Restore correctness first.

1. Read this file plus the r82 analysis authority files.
2. Inspect current dirty diff and run only targeted syntax/smoke tests to establish the starting point.
3. Finish r82 mechanics migration:
   - remove old r80/r78 constants/strings/expectations,
   - make `statVolC` authoritative for volume,
   - verify locked-Level E everywhere,
   - keep Slowdown/Core Feed split.
4. Repair the closed-loop local Ascension edge so gate -> harvest state/accounting is internally consistent and mask/Slowdown choice is damage-aware.
5. Replace unsafe OFF/Legacy correctness pruning with admissible lower bounds; keep heuristics only for ordering/incumbents.
6. Make campaign state correctly represent best-Level/locked-Level and Legacy transitions; add optional best-Level-push alternatives.
7. Validate the A49+ regime and Legacy conclusion under the corrected r82 model; do not preserve the previous 325 s claim if the corrected model disproves it.
8. Finish and validate the A0-A500 Core quick-reference table.
9. Add the missing r82/campaign differential tests.
10. Run all `tests/*.mjs` and all `tests/*.sh`, then the two >=10x benchmark scripts and an A500 performance benchmark.
11. `git diff --check`.
12. Commit all intended changes including this `AGENTS.md`, push `feat/closed-loop-a500`, create PR with `Closes #137`, wait for checks, merge normally, confirm #137 closed.
13. Confirm GitHub Pages deployment for the merge commit and verify the public `ascension.html` actually serves the new r82 revision and the A0-A500 Core table without JS errors/NaN.
14. Only then report “完了”.

## Completion definition for Issue #137

A satisfactory completion is not “the tests pass” or “A500 returned a number.” It requires all of the following:

- r82 runtime mechanics are used everywhere relevant.
- Optimizer can express the user's fast compound-AUTO strategy and produce operational threshold/policy instructions.
- Core A0-A500 cheat sheet is present and correct, with Feed saturation handled after Slowdown Lv46 cap.
- Compression OFF/ON and Legacy are compared without unsafe extrapolation/pruning.
- Optional pre-Legacy best-Level push is represented or safely proven irrelevant for a state.
- r82 volume persistence semantics are not retroactively reconstructed.
- No hidden arbitrary search horizon/purchase cap can remove a winning strategy without an explicit safe bound.
- Current-state and reset-state transitions conserve/reset the right resources.
- Results remain responsive enough to be useful while the game evolves quickly.
- Existing >=10x Ascension and Ingot-roadmap performance commitments still pass.
- Full test suite passes.
- Clean commit/PR/merge/Issue close/Pages/public runtime verification is complete.

If any item remains unresolved, state that directly rather than reporting completion.
