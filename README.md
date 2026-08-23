# Prestige Route Optimizer

Physics-based idle game's Prestige route optimizer built from observed play data.

## Features

- Rapidly update Level, cash, DPS, and each upgrade's current value / next cost / increment.
- Recommend the highest estimated marginal benefit per dollar from currently affordable upgrades.
- One-click purchase mirroring deducts the purchase from tracked cash and updates projected DPS, current value, next increment, and next cost.
- Displayed DPS is derived from the complete current upgrade state instead of accumulated purchase history; entering an observed DPS calibrates the model without making later state edits stale.
- Spike Count starts at an observed `$1.2K` next cost, and Feed Rate at `$400` with the observed `×1.4` cost progression.
- One-click full-budget mirroring applies the currently displayed investment plan in one action, including repeated purchases and cumulative price/increment growth.
- Level Up mirrors its immediate cash reward. Observed Lv3–9 rewards are stored directly; Lv10+ follows the observed `346.35 × 1.36^(level-10)` progression with cent truncation.
- Level Up also starts the next level's wall-clock timer automatically. Exact EXP-full records and missed-record press-to-press fallbacks are kept distinct, while persistent level-start anchors allow elapsed time to be recovered from any recorded level.
- Optional live-cash tracking advances the balance from an entered $/s estimate so the user does not need to retype a constantly changing balance.
- Power uses the observed growing increment sequence (+2.2 initially, then +0.4 to the increment per purchase).
- Upgrade actions use a responsive card layout, keeping the purchase button visible without horizontal scrolling.
- Parse the same Japanese state templates used during manual testing.
- Built-in level timer, persistent level-start anchors, and run history.
- Persist all state locally in the browser.
- Editable empirical model parameters for Reducer, Gravity, Feed Rate, and Spike Size.

The optimizer deliberately keeps uncertain mechanics editable instead of pretending they are exact. The primary workflow is to mirror one real purchase at a time and let the recommendation recalculate immediately.

Closes #1.
