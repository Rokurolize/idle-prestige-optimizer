# Prestige Route Optimizer

Physics-based idle game's Prestige route optimizer built from observed play data.

## Features

- Rapidly update Level, cash, DPS, and each upgrade's current value / next cost / increment.
- Recommend the highest estimated marginal benefit per dollar from currently affordable upgrades.
- One-click purchase mirroring deducts the purchase from tracked cash and updates projected DPS, current value, next increment, and next cost.
- Optional live-cash tracking advances the balance from an entered $/s estimate so the user does not need to retype a constantly changing balance.
- Power uses the observed growing increment sequence (+2.2 initially, then +0.4 to the increment per purchase).
- Upgrade actions use a responsive card layout, keeping the purchase button visible without horizontal scrolling.
- Parse the same Japanese state templates used during manual testing.
- Built-in level timer and run history.
- Persist all state locally in the browser.
- Editable empirical model parameters for Reducer, Gravity, Feed Rate, and Spike Size.

The optimizer deliberately keeps uncertain mechanics editable instead of pretending they are exact. The primary workflow is to mirror one real purchase at a time and let the recommendation recalculate immediately.

Closes #1.
