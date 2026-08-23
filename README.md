# Prestige Route Optimizer

Physics-based idle game's Prestige route optimizer built from observed play data.

## Features

- Rapidly update Level, cash, DPS, and each upgrade's current value / next cost / increment.
- Recommend the highest estimated marginal benefit per dollar from currently affordable upgrades.
- The current-best recommendation includes its own one-click purchase mirror, so the user can buy it in-game and sync the optimizer without locating the matching upgrade tile.
- One-click purchase mirroring deducts the purchase from tracked cash and updates projected DPS, current value, next increment, and next cost.
- Reducer's first observed/derived price is $75K: with ×1.58 price growth this reproduces the observed 10-buy total of about $12.41M.
- The DPS calibration input accepts the game's suffix notation directly (`2.33K`, `1.2M`, etc.) and persists the resulting calibration for subsequent projections.
- Displayed DPS is derived from the complete current upgrade state instead of accumulated purchase history; entering an observed DPS calibrates the model without making later state edits stale.
- Spike Count starts at an observed `$1.2K` next cost, and Feed Rate at `$400` with the observed `×1.4` cost progression.
- One-click full-budget mirroring applies the currently displayed investment plan in one action, including repeated purchases and cumulative price/increment growth.
- Level Up mirrors its immediate cash reward. Observed Lv3–9 rewards are stored directly; Lv10+ follows the observed `346.35 × 1.36^(level-10)` progression with cent truncation.
- Level Up also starts the next level's wall-clock timer automatically. Exact EXP-full records and missed-record press-to-press fallbacks are kept distinct, while persistent level-start anchors allow elapsed time to be recovered from any recorded level.
- Optional live-cash tracking advances the balance from an entered $/s estimate so the user does not need to retype a constantly changing balance.
- Cash accepts the game's compact notation directly (`47.65M`, `850K`, `1.2B`) so no manual unit conversion is needed.
- Power uses the observed growing increment sequence (+2.2 initially, then +0.4 to the increment per purchase).
- Reducer DPS scaling uses the refined observed exponent 1.2711 so the known 1.5 and 1.6 configurations round to the same DPS displays as the game; older saved states using the former approximations migrate automatically.
- The primary panel mirrors the game's visual hierarchy: compact cash/DPS/level strip followed by the exact 4×2 upgrade order `Speed / Power / Reducer / Rare` then `Gravity / Spike Count / Spike Size / Feed`, with current values dominant and optimizer-only rank/effect information secondary.
- Upgrade actions use a responsive card layout, keeping the purchase button visible without horizontal scrolling.
- Full-budget proposals show each upgrade's current value → proposed value, with total spend kept secondary, and can be mirrored with one click.
- Parse the same Japanese state templates used during manual testing.
- Built-in level timer, persistent level-start anchors, and run history.
- Persist all state locally in the browser.
- Editable empirical model parameters for Reducer, Gravity, Feed Rate, and Spike Size.

The optimizer deliberately keeps uncertain mechanics editable instead of pretending they are exact. The primary workflow is to mirror one real purchase at a time and let the recommendation recalculate immediately.

Closes #1.
