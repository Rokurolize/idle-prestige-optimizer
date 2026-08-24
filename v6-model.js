(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PrestigeV6 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = '6.1-shadow';
  const BASE_GAME_DPS = 0.73245;
  const UPGRADE_ORDER = ['speed', 'power', 'reducer', 'rare', 'gravity', 'spikeCount', 'spikeSize', 'feed'];
  // Bootstrap calibration from Runs #2-#6 using within-level fixed effects:
  // choose exponents that make inferred required EXP work invariant across runs,
  // rather than regressing raw elapsed seconds. These are a telemetry-free proxy,
  // not asserted game physics; direct crush/feed observations override its bottleneck response.
  const PROXY_EXPONENTS = Object.freeze({dps: 0.18, speed: 0.23, feed: 0.09});

  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const quantile = (values, q) => {
    const a = values.filter(Number.isFinite).sort((x, y) => x - y);
    if (!a.length) return NaN;
    const p = (a.length - 1) * q;
    const i = Math.floor(p);
    const f = p - i;
    return i + 1 < a.length ? a[i] * (1 - f) + a[i + 1] * f : a[i];
  };

  function upgradeValue(upgrades, key, fallback) {
    const raw = upgrades && upgrades[key];
    return Math.max(0, num(raw && typeof raw === 'object' ? raw.value : raw, fallback));
  }

  function permanentSnapshot(source) {
    return {
      prestigeCash: Math.max(0, num(source && source.prestigeCash, 1)),
      prestigeDmg: Math.max(0, num(source && source.prestigeDmg, 1)),
      refining: Math.max(0, num(source && source.refining, 1)),
      crush: Math.max(0, num(source && source.crush, 1)),
      expEff: Math.max(0, num(source && source.expEff, 1)),
      ingots: Math.max(0, num(source && source.ingots, 0))
    };
  }

  function displayedDps(snapshot) {
    const u = snapshot && snapshot.upgrades || {};
    const p = permanentSnapshot(snapshot && (snapshot.permanent || snapshot));
    const settings = snapshot && snapshot.settings || {};
    const speed = upgradeValue(u, 'speed', 10);
    const power = upgradeValue(u, 'power', 2);
    const reducer = Math.max(1e-9, upgradeValue(u, 'reducer', 1));
    const gravity = Math.max(1e-9, upgradeValue(u, 'gravity', 9.81));
    const spikes = upgradeValue(u, 'spikeCount', 4);
    const reducerExponent = num(settings.reducerExponent, 1.25);
    const gravityExponent = num(settings.gravityExponent, 0.715);
    const live = Math.max(0, num(snapshot && snapshot.dpsCalibration, 1));
    return Math.max(0,
      BASE_GAME_DPS * p.prestigeDmg * p.crush * (speed / 10) * (power / 2) *
      Math.pow(reducer, reducerExponent + 1) * (spikes / 4) *
      Math.pow(gravity / 9.81, gravityExponent) * live
    );
  }

  function rareOnlyEv(rarePercent) {
    return 1 + 9 * Math.max(0, num(rarePercent)) / 100;
  }

  function machineProxy(snapshot) {
    const dps = Math.max(1e-9, num(snapshot && snapshot.dps, NaN) || displayedDps(snapshot));
    const speed = Math.max(1e-9, upgradeValue(snapshot && snapshot.upgrades, 'speed', 10));
    return Math.pow(dps, PROXY_EXPONENTS.dps) * Math.pow(speed, PROXY_EXPONENTS.speed);
  }

  function fallbackThroughputProxy(snapshot) {
    const feed = Math.max(1e-9, upgradeValue(snapshot && snapshot.upgrades, 'feed', 1));
    return machineProxy(snapshot) * Math.pow(feed, PROXY_EXPONENTS.feed);
  }

  function latestTelemetry(observations, level, runId, at = Infinity) {
    const rows = (observations || []).filter(o => {
      if (!o || !o.at) return false;
      if (!(num(o.crushRate) > 0 || num(o.feedRate) > 0 || num(o.feedSmallRate) > 0 || o.oreValues)) return false;
      if (Number.isFinite(runId) && num(o.runId, -1) !== runId) return false;
      if (Number.isFinite(level) && num(o.level, -1) !== level) return false;
      if (num(o.at, Infinity) > at) return false;
      return true;
    }).sort((a, b) => b.at - a.at);
    return rows[0] || null;
  }

  function throughputContext(snapshot, options = {}) {
    const telemetry = options.telemetry || null;
    const dps = Math.max(1e-9, num(snapshot && snapshot.dps, NaN) || displayedDps(snapshot));
    if (telemetry && num(telemetry.crushRate) > 0) {
      const observedSnapshot = {
        ...snapshot,
        dps: Math.max(1e-9, num(telemetry.dps, dps)),
        upgrades: clone(telemetry.upgrades || snapshot && snapshot.upgrades || {}),
        permanent: permanentSnapshot(telemetry.permanent || snapshot && (snapshot.permanent || snapshot)),
        dpsCalibration: num(telemetry.dpsCalibration, snapshot && snapshot.dpsCalibration || 1)
      };
      return {
        mode: 'observed-crush-rate',
        baseCrushRate: num(telemetry.crushRate),
        baseFeedRate: Math.max(0, num(telemetry.feedRate)),
        baseFeedSmallRate: Math.max(0, num(telemetry.feedSmallRate)),
        baseDps: observedSnapshot.dps,
        baseFeedUpgrade: Math.max(1e-9, num(telemetry.feedUpgrade, upgradeValue(snapshot && snapshot.upgrades, 'feed', 1))),
        baseMachineProxy: machineProxy(observedSnapshot),
        baseCanonicalProxy: fallbackThroughputProxy(observedSnapshot),
        confidence: num(telemetry.feedRate) > 0 ? 'medium' : 'medium-low'
      };
    }
    return {mode: 'calibrated-proxy', baseDps: dps, proxyExponents: PROXY_EXPONENTS, confidence: 'medium-low'};
  }

  function effectiveThroughput(snapshot, context) {
    if (context && context.mode === 'observed-crush-rate') {
      const machineRatio = machineProxy(snapshot) / Math.max(1e-12, context.baseMachineProxy);
      const machineRate = context.baseCrushRate * machineRatio;
      let effectiveRate = machineRate;
      if (context.baseFeedRate > 0) {
        const feed = Math.max(1e-9, upgradeValue(snapshot && snapshot.upgrades, 'feed', context.baseFeedUpgrade));
        const feedCapacity = context.baseFeedRate * (feed / Math.max(1e-9, context.baseFeedUpgrade));
        if (context.baseCrushRate < context.baseFeedRate * 0.85) effectiveRate = Math.min(machineRate, feedCapacity);
        // If the observation was already feed-limited, machine capacity is only a lower bound.
        else effectiveRate = Math.min(Math.max(machineRate, context.baseCrushRate), feedCapacity);
      }
      // Keep one canonical work unit across old proxy-only runs and new direct telemetry.
      // The observed crush rate calibrates *relative* machine/feed response, while the
      // observation-point DPS fixes the scale so a telemetry arrival cannot create an
      // artificial discontinuity in inferred EXP work.
      return context.baseCanonicalProxy * effectiveRate / Math.max(1e-9, context.baseCrushRate);
    }
    return fallbackThroughputProxy(snapshot);
  }

  function expPotential(snapshot, context) {
    const p = permanentSnapshot(snapshot && (snapshot.permanent || snapshot));
    const rare = upgradeValue(snapshot && snapshot.upgrades, 'rare', 0);
    return Math.max(1e-12, effectiveThroughput(snapshot, context) * rareOnlyEv(rare) * Math.max(1e-9, p.expEff));
  }

  function cashPotential(snapshot, context) {
    const p = permanentSnapshot(snapshot && (snapshot.permanent || snapshot));
    const rare = upgradeValue(snapshot && snapshot.upgrades, 'rare', 0);
    return Math.max(1e-12,
      effectiveThroughput(snapshot, context) * rareOnlyEv(rare) *
      Math.max(1e-9, p.prestigeCash) * Math.max(1e-9, p.refining)
    );
  }

  function normalizeActionSnapshot(action, fallbackSettings) {
    return {
      level: num(action && action.level, 1),
      cash: Math.max(0, num(action && action.cash, 0)),
      dps: Math.max(0, num(action && action.dps, 0)),
      dpsCalibration: Math.max(0, num(action && action.dpsCalibration, 1)),
      upgrades: clone(action && action.upgrades || {}),
      permanent: permanentSnapshot(action && action.permanent || {}),
      settings: clone(action && action.settings || fallbackSettings || {})
    };
  }

  function isTrainableExactCompletion(event) {
    if (!event || event.type !== 'exp_full_level_up' || !event.detail || !(num(event.detail.durationMs) > 0)) return false;
    if (event.detail.exactTiming === false) return false;
    if (event.observationQuality === 'aggregate' || event.observationQuality === 'state_only') return false;
    return true;
  }

  const WORK_STATE_TYPES = new Set([
    'purchase', 'bundle_purchase', 'upgrade_edit', 'permanent_edit', 'model_setting',
    'state_paste', 'state_reconcile', 'catchup_sync', 'dps_calibration',
    'run_start', 'prestige_boundary', 'level_start', 'run_state', 'state'
  ]);

  function isWorkRelevantAction(event) {
    return !!event && (isTrainableExactCompletion(event) || WORK_STATE_TYPES.has(event.type));
  }

  function completedLevelSegmentsFromRows(rows, endIndex, level, fallbackSettings) {
    if (endIndex < 0) return null;
    const end = rows[endIndex];
    const startedAt = end.at - num(end.detail.durationMs);
    let seed = null;
    for (let i = endIndex; i >= 0; i--) {
      const e = rows[i];
      if (e.at <= startedAt && e.upgrades) { seed = e; break; }
    }
    if (!seed) {
      for (let i = 0; i <= endIndex; i++) {
        const e = rows[i];
        if (e.at >= startedAt && e.upgrades) { seed = e; break; }
      }
    }
    if (!seed) return null;
    const segments = [];
    let cursor = startedAt;
    let current = normalizeActionSnapshot(seed, fallbackSettings);
    for (let i = 0; i <= endIndex; i++) {
      const e = rows[i];
      if (e.at <= startedAt || e.at > end.at) continue;
      const dt = Math.max(0, (e.at - cursor) / 1000);
      if (dt > 0) segments.push({dt, at: cursor, snapshot: current});
      if (e.upgrades) current = normalizeActionSnapshot(e, fallbackSettings);
      cursor = e.at;
    }
    if (cursor < end.at) segments.push({dt: (end.at - cursor) / 1000, at: cursor, snapshot: current});
    return {runId: num(end.runId, 1), level, startedAt, endedAt: end.at, duration: num(end.detail.durationMs) / 1000, segments, end};
  }

  function completedLevelSegments(actionLog, runId, level, fallbackSettings) {
    const rows = (actionLog || []).filter(e => num(e.runId, -1) === runId && isWorkRelevantAction(e)).sort((a, b) => a.at - b.at);
    const endIndex = rows.findIndex(e => isTrainableExactCompletion(e) && num(e.detail.from, -1) === level);
    return completedLevelSegmentsFromRows(rows, endIndex, level, fallbackSettings);
  }

  function inferCompletedLevelWork(actionLog, observations, runId, level, fallbackSettings) {
    const data = completedLevelSegments(actionLog, runId, level, fallbackSettings);
    if (!data) return null;
    let work = 0;
    let proxySeconds = 0;
    let directSeconds = 0;
    for (const segment of data.segments) {
      const telemetry = latestTelemetry(observations, level, runId, segment.at);
      const context = throughputContext(segment.snapshot, {telemetry});
      work += segment.dt * expPotential(segment.snapshot, context);
      proxySeconds += context.mode === 'calibrated-proxy' ? segment.dt : 0;
      directSeconds += context.mode !== 'calibrated-proxy' ? segment.dt : 0;
    }
    if (!(work > 0)) return null;
    return {
      runId,
      level,
      work,
      duration: data.duration,
      directFraction: data.duration > 0 ? directSeconds / data.duration : 0,
      proxyFraction: data.duration > 0 ? proxySeconds / data.duration : 1
    };
  }

  function runIds(actionLog) {
    return [...new Set((actionLog || []).map(e => num(e.runId, NaN)).filter(Number.isFinite))].sort((a, b) => a - b);
  }

  function buildWorkModel(actionLog, observations, currentRunId, fallbackSettings) {
    const byLevel = new Map();
    const byRun = new Map();
    const aggregateConstraints = (actionLog || []).filter(e => e && e.type === 'catchup_sync' && e.detail && e.detail.aggregateOnly && num(e.detail.elapsedMs) > 0 && num(e.detail.toLevel, -1) > num(e.detail.fromLevel, -1)).map(e => ({
      runId: num(e.runId, 1),
      fromLevel: num(e.detail.fromLevel),
      toLevel: num(e.detail.toLevel),
      elapsedSeconds: num(e.detail.elapsedMs) / 1000,
      playMode: e.detail.playMode || 'unknown',
      observationQuality: e.observationQuality || e.detail.observationQuality || 'aggregate',
      trainablePerLevel: false,
      at: num(e.at)
    }));
    const grouped = new Map();
    for (const e of actionLog || []) {
      if (!isWorkRelevantAction(e)) continue;
      const runId = num(e.runId, NaN);
      if (!Number.isFinite(runId)) continue;
      if (!grouped.has(runId)) grouped.set(runId, []);
      grouped.get(runId).push(e);
    }
    for (const [runId, rawRows] of grouped) {
      const rows = rawRows.sort((a, b) => a.at - b.at);
      for (let endIndex = 0; endIndex < rows.length; endIndex++) {
        const end = rows[endIndex];
        if (!isTrainableExactCompletion(end)) continue;
        const level = num(end.detail.from, -1);
        if (!(level >= 1)) continue;
        const data = completedLevelSegmentsFromRows(rows, endIndex, level, fallbackSettings);
        if (!data) continue;
        let work = 0, directSeconds = 0;
        for (const segment of data.segments) {
          const telemetry = latestTelemetry(observations, level, runId, segment.at);
          const context = throughputContext(segment.snapshot, {telemetry});
          work += segment.dt * expPotential(segment.snapshot, context);
          if (context.mode !== 'calibrated-proxy') directSeconds += segment.dt;
        }
        if (!(work > 0)) continue;
        const row = {runId, level, work, duration: data.duration, directFraction: data.duration > 0 ? directSeconds / data.duration : 0, proxyFraction: data.duration > 0 ? 1 - directSeconds / data.duration : 1};
        if (!byLevel.has(level)) byLevel.set(level, []);
        byLevel.get(level).push(row);
        if (!byRun.has(runId)) byRun.set(runId, []);
        byRun.get(runId).push(row);
      }
    }

    function prior(level) {
      let rows = (byLevel.get(level) || []).filter(r => r.runId < currentRunId);
      let source = 'same-level prior runs';
      if (!rows.length) {
        const nearby = [];
        for (let d = 1; d <= 3; d++) {
          nearby.push(...(byLevel.get(level - d) || []).filter(r => r.runId < currentRunId));
          nearby.push(...(byLevel.get(level + d) || []).filter(r => r.runId < currentRunId));
        }
        rows = nearby;
        source = rows.length ? 'nearby-level prior runs' : 'none';
      }
      if (!rows.length && level > 50) {
        const current = (byRun.get(currentRunId) || []).filter(r => r.level >= 50 && r.level < level).sort((a, b) => a.level - b.level).slice(-8);
        if (current.length) {
          const logs = current.map(r => Math.log(Math.max(r.work, 1e-12)));
          let growth = 1;
          if (logs.length >= 2) {
            const diffs = [];
            for (let i = 1; i < logs.length; i++) diffs.push(logs[i] - logs[i - 1]);
            growth = Math.exp(clamp(quantile(diffs, .5), Math.log(.65), Math.log(1.8)));
          }
          const last = current[current.length - 1];
          const steps = Math.max(1, level - last.level);
          const mid = last.work * Math.pow(growth, steps);
          return {low: mid * .7, mid, high: mid * 1.45, count: current.length, source: 'current-run post50 work trend', directFraction: quantile(current.map(r => r.directFraction), .5)};
        }
      }
      if (!rows.length) return {low: NaN, mid: NaN, high: NaN, count: 0, source, directFraction: 0};
      let values = rows.map(r => r.work).filter(v => v > 0);
      if (values.length >= 4) {
        const med = quantile(values, .5);
        values = values.filter(v => v >= med / 4 && v <= med * 4);
      }
      const mid = quantile(values, .5);
      const floorFactor = values.length <= 1 ? 1.8 : values.length === 2 ? 1.6 : values.length === 3 ? 1.45 : 1.3;
      return {
        low: Math.min(quantile(values, .15), mid / floorFactor),
        mid,
        high: Math.max(quantile(values, .85), mid * floorFactor),
        count: values.length,
        source,
        directFraction: quantile(rows.map(r => r.directFraction), .5)
      };
    }

    return {byLevel, byRun, aggregateConstraints, prior};
  }

  function integratedCurrentWork(input, context) {
    const {actionLog, runId, level, levelStartedAt, now, state} = input;
    if (!Number.isFinite(levelStartedAt)) return 0;
    const all = (actionLog || []).filter(e => num(e.runId, -1) === runId && isWorkRelevantAction(e)).sort((a, b) => a.at - b.at);
    const rows = all.filter(e => e.at > levelStartedAt && e.at <= now && num(e.level, -1) === level);
    let current = clone(state);
    for (let i = all.length - 1; i >= 0; i--) {
      const e = all[i];
      if (e.at <= levelStartedAt && e.upgrades) { current = normalizeActionSnapshot(e, state.settings); break; }
    }
    let cursor = levelStartedAt;
    let work = 0;
    for (const e of rows) {
      const dt = Math.max(0, (e.at - cursor) / 1000);
      work += dt * expPotential(current, context);
      if (e.upgrades) current = normalizeActionSnapshot(e, state.settings);
      cursor = e.at;
    }
    if (cursor < now) work += (now - cursor) / 1000 * expPotential(current, context);
    return Math.max(0, work);
  }

  function nextValue(u) {
    return u.cap == null ? num(u.value) + num(u.step) : Math.min(num(u.cap), num(u.value) + num(u.step));
  }

  function validUpgradeAtLevel(u, level) {
    return !!u && level >= num(u.unlock, 1) && Number.isFinite(num(u.cost, NaN)) && num(u.cost) > 0 && (u.cap == null || num(u.value) < num(u.cap) - 1e-9);
  }

  function advanceUpgrade(upgrades, key) {
    const out = clone(upgrades);
    const u = out[key];
    if (!u) return out;
    if (key === 'reducer') {
      const old = Math.max(1e-9, num(u.value, 1));
      const next = nextValue(u);
      const ratio = old / Math.max(1e-9, next);
      if (out.speed) {
        out.speed.value = num(out.speed.value) * ratio;
        out.speed.step = num(out.speed.step) * ratio;
      }
      u.value = next;
    } else u.value = nextValue(u);
    u.step = num(u.step) + num(u.stepDelta);
    u.cost = num(u.cost) * Math.max(1, num(u.growth, 1));
    return out;
  }

  function levelUpReward(level) {
    const observed = {3: 10.59, 4: 16.10, 5: 24.81, 6: 38.94, 7: 62.58, 8: 104.03, 9: 181.90};
    if (Object.prototype.hasOwnProperty.call(observed, level)) return observed[level];
    if (level >= 10 && level < 50) return Math.floor((346.35 * Math.pow(1.36, level - 10) + 1e-9) * 100) / 100;
    return 0;
  }

  function modelState(base, upgrades, dpsCalibration) {
    const s = {
      level: base.level,
      upgrades,
      permanent: permanentSnapshot(base.permanent || base),
      settings: clone(base.settings || {}),
      dpsCalibration: num(dpsCalibration, base.dpsCalibration || 1)
    };
    s.dps = displayedDps(s);
    return s;
  }

  function predictedRates(baseState, upgrades, context, baseCashRate, baseCashPotential) {
    const s = modelState(baseState, upgrades, baseState.dpsCalibration);
    const expRate = expPotential(s, context);
    const cp = cashPotential(s, context);
    const cashRate = baseCashRate > 0 && baseCashPotential > 0 ? baseCashRate * cp / baseCashPotential : 0;
    return {state: s, expRate, cashRate, cashPotential: cp};
  }

  function buildCashRateModel(actionLog, currentRunId, fallbackSettings) {
    const logs = actionLog || [];
    const samples = logs.filter(e => e.type === 'income_sync' && e.detail && num(e.detail.after) > 0 && e.upgrades).map(e => {
      const snapshot = normalizeActionSnapshot(e, fallbackSettings);
      const context = throughputContext(snapshot, {telemetry: null});
      return {runId: num(e.runId, 1), level: num(e.level, 1), rate: num(e.detail.after), potential: cashPotential(snapshot, context), snapshot, kind: 'manual'};
    }).filter(x => x.rate > 0 && x.potential > 0);
    const syncs = logs.map((e, i) => ({e, i})).filter(x => x.e.type === 'cash_sync' && x.e.detail && Number.isFinite(num(x.e.detail.after, NaN)));
    for (let s = 1; s < syncs.length; s++) {
      const a = syncs[s - 1], b = syncs[s], dt = (b.e.at - a.e.at) / 1000;
      if (a.e.runId !== b.e.runId || dt < 1 || dt > 180 || !b.e.upgrades) continue;
      let spend = 0, invalid = false;
      for (let i = a.i + 1; i <= b.i; i++) {
        const e = logs[i], d = e.detail || {};
        if (e.type === 'purchase') spend += num(d.cost);
        else if (e.type === 'bundle_purchase') spend += num(d.spent);
        else if (e.type === 'exp_full_level_up' || e.type === 'level_up_manual' || e.type === 'level_sync' || e.type === 'prestige_boundary' || e.type === 'run_start') invalid = true;
      }
      if (invalid) continue;
      const rate = (num(b.e.detail.after) - num(a.e.detail.after) + spend) / dt;
      if (!(rate > 0)) continue;
      const snapshot = normalizeActionSnapshot(b.e, fallbackSettings);
      const context = throughputContext(snapshot, {telemetry: null});
      const potential = cashPotential(snapshot, context);
      if (potential > 0) samples.push({runId: num(b.e.runId, 1), level: num(b.e.level, 1), rate, potential, snapshot, kind: 'cash-sync'});
    }
    function forecast(level, targetSnapshot) {
      let pool = samples.filter(s => s.level === level && s.runId < currentRunId);
      let source = 'same-level cash history';
      if (pool.length < 2) {
        pool = samples.filter(s => Math.abs(s.level - level) <= 1 && s.runId < currentRunId);
        source = 'near-level cash history';
      }
      if (!pool.length) {
        pool = samples.filter(s => s.runId < currentRunId).slice(-12);
        source = 'recent cash history';
      }
      if (!pool.length) return {rate: NaN, count: 0, source: 'none'};
      const targetContext = throughputContext(targetSnapshot, {telemetry: null});
      const targetPotential = cashPotential(targetSnapshot, targetContext);
      let scaled = pool.map(s => s.rate * clamp(targetPotential / Math.max(1e-12, s.potential), .1, 10)).filter(x => x > 0 && Number.isFinite(x));
      if (scaled.length >= 4) {
        const logs = scaled.map(Math.log), med = quantile(logs, .5), mad = quantile(logs.map(x => Math.abs(x - med)), .5), limit = Math.max(Math.log(2.5), 3 * mad);
        const clean = scaled.filter(x => Math.abs(Math.log(x) - med) <= limit);
        if (clean.length >= 2) scaled = clean;
      }
      return {rate: quantile(scaled, .5), low: quantile(scaled, .25), high: quantile(scaled, .75), count: scaled.length, source};
    }
    return {samples, forecast};
  }

  function targetLevelForCampaign(input, workModel, currentRates, currentPrior) {
    const level = input.state.level;
    if (level < 50) return 50;
    const resetCycle = num(input.resetCycleSeconds, NaN);
    const hardMax = level + 20;
    if (!(resetCycle > 0)) return Math.min(hardMax, level + 8);
    let target = level + 1;
    for (let l = level; l < hardMax; l++) {
      const prior = l === level ? currentPrior : workModel.prior(l);
      if (!(prior.mid > 0)) break;
      const sec = prior.mid / Math.max(1e-12, currentRates.expRate);
      if (l > level && sec >= resetCycle) break;
      target = l + 1;
    }
    return Math.max(level + 1, target);
  }

  function levelContext(input, level, snapshot, currentLevel) {
    if (level === currentLevel) {
      const telemetry = latestTelemetry(input.observations, level, num(input.runId, 1));
      return throughputContext(snapshot, {telemetry});
    }
    return throughputContext(snapshot, {telemetry: null});
  }

  function cashRateForLevel(level, snapshot, context, env) {
    const potential = cashPotential(snapshot, context);
    if (level === env.currentLevel && env.currentCashRate > 0 && env.currentCashPotential > 0) {
      return env.currentCashRate * potential / env.currentCashPotential;
    }
    const forecast = env.cashRateModel.forecast(level, snapshot);
    if (forecast.rate > 0) return forecast.rate;
    if (env.currentCashRate > 0 && env.currentFallbackPotential > 0) {
      const fallbackContext = throughputContext(snapshot, {telemetry: null});
      return env.currentCashRate * cashPotential(snapshot, fallbackContext) / env.currentFallbackPotential;
    }
    return 0;
  }

  function ratesForNode(node, input, env) {
    const snapshot = modelState({...env.baseState, level: node.level}, node.upgrades, env.baseState.dpsCalibration);
    const context = levelContext(input, node.level, snapshot, env.currentLevel);
    return {
      snapshot,
      context,
      expRate: expPotential(snapshot, context),
      cashRate: cashRateForLevel(node.level, snapshot, context, env)
    };
  }

  function finishWithoutMorePurchases(node, targetLevel, workModel, input, env) {
    let level = node.level;
    let work = node.remainingWork;
    let t = node.t;
    let cash = node.cash;
    while (level < targetLevel) {
      const rates = ratesForNode({level, upgrades: node.upgrades}, input, env);
      const rate = Math.max(1e-12, rates.expRate);
      const dt = Math.max(0, work) / rate;
      t += dt;
      cash += rates.cashRate * dt;
      cash += levelUpReward(level);
      level += 1;
      if (level >= targetLevel) break;
      const p = workModel.prior(level);
      if (!(p.mid > 0)) return {finish: Infinity, t, cash, level};
      work = p.mid;
    }
    return {finish: t, t, cash, level};
  }

  function searchOneConfiguration(input, options) {
    const state = input.state;
    const now = num(input.now, Date.now());
    const runId = num(input.runId, 1);
    const telemetry = latestTelemetry(input.observations, state.level, runId);
    const context = throughputContext(state, {telemetry});
    const workModel = buildWorkModel(input.actionLog, input.observations, runId, state.settings);
    const prior = workModel.prior(state.level);
    if (!(prior.mid > 0)) return {status: 'insufficient-work-prior', first: null, confidence: 'low', reason: 'same/nearby level work prior is unavailable', workModel, context};
    const timingQuality = input.levelTimingQuality || 'exact';
    const currentWork = integratedCurrentWork({actionLog: input.actionLog, runId, level: state.level, levelStartedAt: input.levelStartedAt, now, state}, context);
    const remainingWork = Math.max(0, prior.mid - currentWork);
    const baseState = clone(state);
    baseState.permanent = permanentSnapshot(state.permanent || state);
    const baseRates = predictedRates(baseState, state.upgrades, context, num(input.cashRate), 1);
    const baseCashPotential = cashPotential(baseRates.state, context);
    if (num(input.cashRate) > 0) baseRates.cashRate = num(input.cashRate);
    const cashRateModel = buildCashRateModel(input.actionLog, runId, state.settings);
    const fallbackCurrentState = modelState(baseState, state.upgrades, baseState.dpsCalibration);
    const currentFallbackPotential = cashPotential(fallbackCurrentState, throughputContext(fallbackCurrentState, {telemetry: null}));
    const env = {baseState, currentLevel: state.level, currentCashRate: baseRates.cashRate, currentCashPotential: baseCashPotential, currentFallbackPotential, cashRateModel};
    const currentSec = remainingWork / Math.max(1e-12, baseRates.expRate);
    const targetLevel = targetLevelForCampaign(input, workModel, baseRates, prior);
    const latency = clamp(num(input.decisionLatency, 2), .25, 8);
    const maxPurchases = Math.max(1, num(options.maxPurchases, options.maxDepth || 10));
    const maxLevelTransitions = Math.max(1, num(options.maxLevelTransitions, 3));
    const maxEvents = maxPurchases + maxLevelTransitions;
    const beamWidth = Math.max(4, num(options.beamWidth, 48));
    const start = {level: state.level, cash: Math.max(0, num(input.cash)), upgrades: clone(state.upgrades), remainingWork, t: 0, decisions: [], purchases: 0, levelTransitions: 0};
    const baseline = finishWithoutMorePurchases(start, targetLevel, workModel, input, env).finish;
    let best = {finish: baseline, decisions: []};
    let beam = [start];
    for (let depth = 0; depth < maxEvents; depth++) {
      const expanded = [];
      for (const node of beam) {
        if (node.level >= targetLevel) {
          if (node.t < best.finish) best = {finish: node.t, decisions: node.decisions};
          continue;
        }
        const nodeRates = ratesForNode(node, input, env);
        const timeToLevel = node.remainingWork / Math.max(1e-12, nodeRates.expRate);
        if (node.levelTransitions < maxLevelTransitions) {
          const nextLevel = node.level + 1;
          const nextPrior = nextLevel < targetLevel ? workModel.prior(nextLevel) : null;
          if (nextLevel >= targetLevel || (nextPrior && nextPrior.mid > 0)) {
            const levelChild = {
              level: nextLevel,
              cash: node.cash + nodeRates.cashRate * timeToLevel + levelUpReward(node.level),
              upgrades: node.upgrades,
              remainingWork: nextLevel >= targetLevel ? 0 : nextPrior.mid,
              t: node.t + timeToLevel,
              decisions: node.decisions.concat({type: 'level-up', from: node.level, to: nextLevel, wait: timeToLevel}),
              purchases: node.purchases,
              levelTransitions: node.levelTransitions + 1
            };
            levelChild.finish = nextLevel >= targetLevel ? levelChild.t : finishWithoutMorePurchases(levelChild, targetLevel, workModel, input, env).finish;
            expanded.push(levelChild);
            if (levelChild.finish < best.finish - 1e-6) best = {finish: levelChild.finish, decisions: levelChild.decisions};
          }
        }
        if (node.purchases < maxPurchases && nodeRates.cashRate > 0) {
          for (const key of UPGRADE_ORDER) {
            const u = node.upgrades[key];
            if (!validUpgradeAtLevel(u, node.level)) continue;
            const wait = Math.max(0, num(u.cost) - node.cash) / Math.max(1e-12, nodeRates.cashRate);
            if (!Number.isFinite(wait) || wait + latency >= timeToLevel) continue;
            if (timingQuality !== 'exact' && node.level === state.level && wait >= .8) continue;
            let work = Math.max(0, node.remainingWork - nodeRates.expRate * wait);
            let cash = node.cash + nodeRates.cashRate * wait - num(u.cost);
            const upgraded = advanceUpgrade(node.upgrades, key);
            const afterRates = ratesForNode({level: node.level, upgrades: upgraded}, input, env);
            const activeLatency = Math.min(latency, work / Math.max(1e-12, afterRates.expRate));
            work = Math.max(0, work - afterRates.expRate * activeLatency);
            cash += afterRates.cashRate * activeLatency;
            const decision = {type: 'purchase', key, name: u.name || key, cost: num(u.cost), wait, from: num(u.value), to: num(upgraded[key].value), level: node.level};
            const child = {level: node.level, cash, upgrades: upgraded, remainingWork: work, t: node.t + wait + activeLatency, decisions: node.decisions.concat(decision), purchases: node.purchases + 1, levelTransitions: node.levelTransitions};
            child.finish = finishWithoutMorePurchases(child, targetLevel, workModel, input, env).finish;
            if (Number.isFinite(child.finish)) {
              expanded.push(child);
              if (child.finish < best.finish - 1e-6) best = {finish: child.finish, decisions: child.decisions};
            }
          }
        }
      }
      if (!expanded.length) break;
      expanded.sort((a, b) => a.finish - b.finish);
      const seen = new Set();
      const next = [];
      for (const node of expanded) {
        const sig = node.level + '|' + UPGRADE_ORDER.map(k => Number(num(node.upgrades[k] && node.upgrades[k].value).toPrecision(6))).join('|') + '|' + Math.round(node.cash / Math.max(1, baseRates.cashRate));
        if (seen.has(sig)) continue;
        seen.add(sig);
        next.push(node);
        if (next.length >= beamWidth) break;
      }
      beam = next;
    }
    const firstDecision = best.decisions[0] || null;
    const purchases = best.decisions.filter(d => d.type === 'purchase');
    return {
      status: 'ok',
      firstDecision,
      first: firstDecision && firstDecision.type === 'purchase' ? firstDecision : null,
      actions: purchases,
      decisions: best.decisions,
      baselineSeconds: baseline,
      finishSeconds: best.finish,
      savedSeconds: Math.max(0, baseline - best.finish),
      currentLevelSeconds: currentSec,
      targetLevel,
      remainingWork,
      workPrior: prior,
      expRate: baseRates.expRate,
      cashRate: baseRates.cashRate,
      context,
      workModel,
      cashRateModel,
      timingQuality
    };
  }

  function planShadow(input) {
    const a = searchOneConfiguration(input, {maxPurchases: 7, maxLevelTransitions: 2, beamWidth: 36});
    const b = searchOneConfiguration(input, {maxPurchases: 11, maxLevelTransitions: 4, beamWidth: 72});
    if (a.status !== 'ok' || b.status !== 'ok') {
      const failed = b.status === 'ok' ? a : b;
      return {...failed, version: VERSION, stable: false, confidence: 'low'};
    }
    const decisionKey = r => r.firstDecision ? (r.firstDecision.type === 'purchase' ? `purchase:${r.firstDecision.key}` : r.firstDecision.type) : 'none';
    const aKey = decisionKey(a);
    const bKey = decisionKey(b);
    const stable = aKey === bKey;
    const samples = num(b.workPrior && b.workPrior.count, 0);
    const direct = num(b.workPrior && b.workPrior.directFraction, 0);
    const timingExact = (input.levelTimingQuality || 'exact') === 'exact';
    let confidence = stable && samples >= 3 && timingExact ? 'medium' : 'low';
    if (stable && samples >= 4 && direct >= .5 && timingExact) confidence = 'high';
    return {
      ...b,
      version: VERSION,
      stable,
      confidence,
      searchCheck: {shallowFirst: aKey, deepFirst: bKey, shallowSaved: a.savedSeconds, deepSaved: b.savedSeconds},
      uncertainty: {
        workLow: b.workPrior.low,
        workMid: b.workPrior.mid,
        workHigh: b.workPrior.high,
        etaLow: Math.max(0, b.workPrior.low - (b.workPrior.mid - b.remainingWork)) / Math.max(1e-12, b.expRate),
        etaMid: b.currentLevelSeconds,
        etaHigh: Math.max(0, b.workPrior.high - (b.workPrior.mid - b.remainingWork)) / Math.max(1e-12, b.expRate),
        partialCurrentLevel: !timingExact
      }
    };
  }

  function afkPlan(input) {
    const horizon = Math.max(0, num(input.afkSeconds));
    if (!(horizon > 0) || !(num(input.cashRate) > 0)) return {status: 'inactive', actions: [], terminalCash: num(input.cash)};
    const runId = num(input.runId, 1);
    const telemetry = latestTelemetry(input.observations, input.state.level, runId);
    const context = throughputContext(input.state, {telemetry});
    const baseState = clone(input.state);
    baseState.permanent = permanentSnapshot(input.state.permanent || input.state);
    const basePotential = cashPotential(baseState, context);
    const start = {cash: Math.max(0, num(input.cash)), upgrades: clone(input.state.upgrades), rate: num(input.cashRate), actions: []};
    let beam = [start];
    let best = {...start, terminalCash: start.cash + start.rate * horizon};
    for (let depth = 0; depth < 8; depth++) {
      const next = [];
      for (const node of beam) {
        for (const key of UPGRADE_ORDER) {
          const u = node.upgrades[key];
          if (!validUpgradeAtLevel(u, input.state.level) || num(u.cost) > node.cash) continue;
          const upgraded = advanceUpgrade(node.upgrades, key);
          const s = modelState(baseState, upgraded, baseState.dpsCalibration);
          const ratio = cashPotential(s, context) / Math.max(1e-12, basePotential);
          const rate = num(input.cashRate) * ratio;
          const child = {cash: node.cash - num(u.cost), upgrades: upgraded, rate, actions: node.actions.concat({key, name: u.name || key, cost: num(u.cost)})};
          child.terminalCash = child.cash + child.rate * horizon;
          if (child.terminalCash > best.terminalCash) best = child;
          next.push(child);
        }
      }
      if (!next.length) break;
      next.sort((a, b) => b.terminalCash - a.terminalCash);
      beam = next.slice(0, 48);
    }
    return {status: 'ok', actions: best.actions, terminalCash: best.terminalCash, noPurchaseCash: start.cash + start.rate * horizon, gain: best.terminalCash - (start.cash + start.rate * horizon)};
  }

  function campaignSummary(input, shadow) {
    const level = input.state.level;
    const prestigeCount = Math.max(0, num(input.campaign && input.campaign.prestigeCount, 0));
    const prestigeGoal = Math.max(1, num(input.campaign && input.campaign.prestigeGoal, 25));
    const ingots = Math.max(0, num(input.campaign && input.campaign.ingots, input.state.ingots));
    const ingotGoal = Math.max(1, num(input.campaign && input.campaign.ingotGoal, 250));
    const gained = level >= 50 ? level - 49 : 0;
    const resetCycle = num(input.resetCycleSeconds, NaN);
    const nextIngot = shadow && shadow.status === 'ok' ? shadow.currentLevelSeconds : NaN;
    const needsPrestigeCount = prestigeCount < prestigeGoal;
    let pureIngotRecommendation = 'undetermined';
    let recommendation = needsPrestigeCount ? 'underdetermined' : 'continue';
    let reason = 'campaign model is still collecting enough causal work observations';
    if (level >= 50 && resetCycle > 0 && nextIngot > 0) {
      pureIngotRecommendation = nextIngot >= resetCycle ? 'prestige' : 'continue';
      if (!needsPrestigeCount) recommendation = pureIngotRecommendation;
      reason = needsPrestigeCount
        ? 'Prestige-count gate is incomplete. Pure Ingot efficiency can be computed, but the full campaign optimum is intentionally left undetermined until the Prestige multiplier progression is observed.'
        : `Prestige-count gate is complete; marginal Ingot time is compared directly against the measured reset cycle (${resetCycle.toFixed(1)}s).`;
    }
    return {prestigeCount, prestigeGoal, ingots, ingotGoal, gainedThisPrestige: gained, needsPrestigeCount, recommendation, pureIngotRecommendation, reason, resetCycleSeconds: resetCycle, nextIngotSeconds: nextIngot};
  }

  function makeObservedTelemetry(text, base = {}) {
    const out = {...base};
    const matchNumber = re => {
      const m = String(text || '').match(re);
      return m ? num(m[1], NaN) : NaN;
    };
    const feedRate = matchNumber(/Feed rate\s+([\d.]+)\s*\/s/i);
    const feedSmallRate = matchNumber(/Feed rate \(small\)\s+([\d.]+)\s*\/s/i);
    const crushRate = matchNumber(/Crush rate\s+([\d.]+)\s*\/s/i);
    const hpBlock = String(text || '').match(/Ore HP([\s\S]*?)(?:Crush rate|$)/i);
    const hpMatch = hpBlock && hpBlock[1].match(/Small\s+([\d.]+)\s*([KMBT])?/i);
    const hpSmall = hpMatch ? num(hpMatch[1]) * ({K:1e3,M:1e6,B:1e9,T:1e12}[String(hpMatch[2] || '').toUpperCase()] || 1) : NaN;
    if (Number.isFinite(feedRate)) out.feedRate = feedRate;
    if (Number.isFinite(feedSmallRate)) out.feedSmallRate = feedSmallRate;
    if (Number.isFinite(crushRate)) out.crushRate = crushRate;
    if (Number.isFinite(hpSmall)) out.oreHpSmall = hpSmall;
    const money = (label) => {
      const m = String(text || '').match(new RegExp(label + '\\s+\\$?([\\d.]+)\\s*([KMBT])?', 'i'));
      if (!m) return NaN;
      return num(m[1]) * ({K:1e3,M:1e6,B:1e9,T:1e12}[String(m[2] || '').toUpperCase()] || 1);
    };
    const normal = money('Normal');
    const rare = money('Rare');
    const epic = money('Epic');
    const orichalcum = money('Orichalcum');
    if ([normal, rare, epic, orichalcum].some(Number.isFinite)) out.oreValues = {normal, rare, epic, orichalcum};
    return out;
  }

  function walkForwardReplay(input) {
    const rows = (input.actionLog || []).filter(isTrainableExactCompletion).sort((a, b) => a.at - b.at);
    const out = [];
    for (const event of rows) {
      const from = num(event.detail.from, -1);
      const runId = num(event.runId, 1);
      const startedAt = event.at - num(event.detail.durationMs);
      const prefix = (input.actionLog || []).filter(e => e.at < startedAt);
      const model = buildWorkModel(prefix, (input.observations || []).filter(o => o.at < startedAt), runId, input.settings);
      const prior = model.prior(from);
      if (!(prior.mid > 0)) continue;
      const duration = num(event.detail.durationMs) / 1000;
      const realizedLog = (input.actionLog || []).filter(e => e.at <= event.at);
      const realizedObs = (input.observations || []).filter(o => o.at <= event.at);
      const realized = inferCompletedLevelWork(realizedLog, realizedObs, runId, from, input.settings);
      if (!realized || !(realized.work > 0)) continue;
      const ratio = realized.work / prior.mid;
      out.push({runId, level: from, observedSeconds: duration, predictedWork: prior.mid, realizedWork: realized.work, workRatio: ratio, absLogError: Math.abs(Math.log(Math.max(1e-12, ratio))), workPrior: prior, source: prior.source});
    }
    return out;
  }

  function replayMetrics(rows) {
    const clean = (rows || []).filter(r => num(r.predictedWork) > 0 && num(r.realizedWork) > 0);
    if (!clean.length) return {count: 0, medianRatio: NaN, medianAbsLogError: NaN, p80AbsLogError: NaN, coverage: NaN};
    const ratios = clean.map(r => r.workRatio);
    const errors = clean.map(r => r.absLogError);
    const covered = clean.filter(r => r.realizedWork >= r.workPrior.low && r.realizedWork <= r.workPrior.high).length;
    return {count: clean.length, medianRatio: quantile(ratios, .5), medianAbsLogError: quantile(errors, .5), p80AbsLogError: quantile(errors, .8), coverage: covered / clean.length};
  }

  return {
    VERSION,
    PROXY_EXPONENTS,
    displayedDps,
    rareOnlyEv,
    throughputContext,
    effectiveThroughput,
    expPotential,
    cashPotential,
    inferCompletedLevelWork,
    buildWorkModel,
    buildCashRateModel,
    advanceUpgrade,
    planShadow,
    afkPlan,
    campaignSummary,
    makeObservedTelemetry,
    walkForwardReplay,
    replayMetrics
  };
});
