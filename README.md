# Prestige Route Optimizer

Physics-based idle game's Prestige route optimizer built from observed play data.

## Features

- Rapidly update Level, cash, DPS, and each upgrade's current value / next cost / increment.
- Recommend the highest estimated marginal benefit per dollar from currently affordable upgrades.
- One-click purchase mirroring updates cash, projected DPS, current value, and next cost.
- Parse the same Japanese state templates used during manual testing.
- Built-in level timer and run history.
- Persist all state locally in the browser.
- Editable empirical model parameters for Reducer, Gravity, Feed Rate, and Spike Size.

The optimizer deliberately keeps uncertain mechanics editable instead of pretending they are exact. The primary workflow is to mirror one real purchase at a time and let the recommendation recalculate immediately.

Closes #1.
