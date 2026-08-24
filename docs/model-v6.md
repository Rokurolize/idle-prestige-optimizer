# Causal v6 model

The v6 model is a shadow replacement for the old remaining-seconds/progress-factor planner. It is deliberately not the primary recommendation engine until replay and live shadow evidence are strong enough.

## Objective

The long-run objective is expected wall-clock time to the Ascension requirements, not DPS, cash, or one-level time in isolation.

The state is modeled as:

`S = (level, EXP work completed, cash, normal upgrades, permanent upgrades, telemetry, campaign state, interaction mode)`.

Time itself is not stored as "remaining work". The simulator advances cash and EXP work together until an event happens.

## Causal flow

The intended causal direction is:

`normal/permanent upgrades -> crusher/feed throughput -> ore outcomes -> cash + EXP -> level-up -> Prestige -> Ascension`.

Displayed DPS is retained as an observed/mechanical submodel. It is no longer treated as EXP per second directly.

When direct crush/feed telemetry is unavailable, v6 uses a calibrated canonical throughput proxy rather than raw DPS:

`machineProxy = DPS^0.18 * Speed^0.23`

`fallbackThroughput = machineProxy * Feed^0.09`.

These exponents are **not** asserted game physics. They are a bootstrap calibration from Runs #2-#6 using level fixed effects: the fitting target is invariance of inferred required EXP work for the same level across different runs. On the current 49 levels with at least three run samples, the median cross-run log standard deviation drops from about `0.31` for raw elapsed seconds to about `0.21` for the calibrated work proxy, and the work proxy is less variable than raw seconds on about `85%` of those levels. Rare and EXP Efficiency remain structural multipliers rather than free fitted exponents.

When a `Crush rate` observation exists, v6 uses it to estimate the *relative* machine/feed bottleneck response while preserving the same canonical work scale. This avoids a unit discontinuity when a direct observation first arrives. Direct telemetry therefore supersedes the fallback Feed exponent for local counterfactuals without making old proxy-only work samples incomparable.

## EXP work

For a completed level, v6 integrates a state-dependent EXP potential over the actual action timeline:

`H_level ~= integral(expPotential(S(t)) dt)`.

The historical quantity learned for each level is therefore required EXP work, not historical elapsed seconds. A purchase halfway through a level changes the rate only after the purchase timestamp.

Current ETA is derived from:

`remainingWork / currentExpPotential`.

The prior is taken from the same level in earlier runs when available. Nearby levels are a fallback. For post-50 levels with no prior-run sample, a robust recent current-run work-growth trend is used.

Small-sample uncertainty is not allowed to collapse to zero merely because only one historical run exists. The current bootstrap interval floor is multiplicative (`×/÷1.8` for one sample, `1.6` for two, `1.45` for three, `1.3` thereafter, widened further by empirical quantiles). On the currently available Runs #2-#6 this raises walk-forward work-interval coverage from the severely overconfident raw-quantile result to roughly three quarters of eligible levels. These floors are calibration safeguards and should be re-estimated as the campaign log grows.

## Throughput and Feed

Direct telemetry records:

- feed rate
- small-equivalent feed rate
- crush rate
- ore HP
- ore value by rarity

If observed crush rate is far below feed rate, v6 treats the state as machine-limited and does not grant Feed an unconditional progression multiplier. If the observation is close to feed capacity, Feed may become the active cap.

This replaces the old hard-coded `Feed^0.5` progression credit.

## Rare ore

The currently identified Normal/Rare relation is retained only as a low-confidence relative fallback: `1 + 9p`. Epic and Orichalcum values are logged separately. Their probability law is not invented. Until those probabilities are observed, v6 must not describe the rarity model as exact.

## Cash

The existing robust `$ / s` learner remains the current-rate sensor. v6 does not claim that its absolute physical cash model is exact. Counterfactual cash rates after an upgrade are obtained by scaling the observed current rate by the causal cash-potential ratio.

## Event simulator

For every candidate purchase, v6 compares:

- time to afford the purchase;
- time until the current EXP work reaches its level requirement.

A wait that crosses the current level boundary is not a valid branch. After a purchase, cash and EXP continue to advance during the empirically learned decision latency because the game does not pause while the player clicks or mirrors an action.

The search is receding-horizon: the first action is optimized now and recomputed after every real action or level-up. A purchase's benefit is evaluated through future levels because normal upgrades persist until Prestige.

## Search convergence

Every shadow recommendation is solved twice with different search budgets. The recommendation is considered search-stable only when the shallow and deeper searches agree on the first action. Search depth/beam width are computational limits, not game mechanics.

## Campaign layer

At level 50+, the observed rule `Ingots gained = Level - 49` is used.

Pure Ingot efficiency can compare the predicted next-Ingot time with the measured level-2-to-50 reset cycle. This does **not** solve the full campaign while the required Prestige-count gate is incomplete, because the progression law for the automatic Prestige cash/damage multipliers is not yet identified. v6 therefore reports the overall campaign decision as underdetermined rather than inventing a weighting between one Prestige count and one Ingot.

Once the Prestige multiplier transition law is observed, campaign state can be expanded into a dynamic program over `(prestigeCount, ingots, permanent upgrades)` and optimized directly to the Ascension constraints.

## Active and AFK modes

Active mode minimizes progression time under the event simulator.

AFK mode assumes no level-up or purchases can happen after the player leaves. It searches only purchases that can be made immediately before departure and ranks them by predicted state/cash at the return horizon. This is intentionally separate from the Active policy.

## Logging contract

New decision logs separate:

- `observed`: direct player/game observations such as cash and calibrated DPS;
- `predicted`: model outputs including the compact v6 shadow recommendation;
- `modelVersion`;
- the legacy v5 recommendation snapshot for comparison.

State paste also recognizes feed rate, small-equivalent feed rate, crush rate, ore HP, and rarity values and stores them as causal telemetry observations.

## Validation

`tools/replay-v6.mjs` performs walk-forward work-prior validation. For each completed level it constructs the prior using only information available before that level started, then compares it with the realized integrated work after the level completes.

The primary UI should switch from v5 to v6 only after all of the following are true over multiple runs:

1. work-prior replay error is stable rather than drifting with permanent upgrades;
2. prediction intervals have reasonable coverage;
3. the first action is usually stable when search budget is increased;
4. v6-v5 disagreements can be explained by observed mechanics instead of arbitrary coefficients;
5. live route times do not regress after controlling for permanent-upgrade changes.

Until then, v6 remains visible shadow output and its predictions are saved for later audit.
