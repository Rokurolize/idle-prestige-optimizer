/* Heavy causal-v6 planning lives here so DOM interaction never waits for it. */
importScripts('v6-model.js');

let actionLog = [];
let observations = [];

function trimHistory() {
  if (actionLog.length > 12000) actionLog = actionLog.slice(-12000);
  if (observations.length > 600) observations = observations.slice(-600);
}

self.addEventListener('message', event => {
  const message = event.data || {};
  try {
    if (message.type === 'init' || message.type === 'replaceHistory') {
      actionLog = Array.isArray(message.actionLog) ? message.actionLog : [];
      observations = Array.isArray(message.observations) ? message.observations : [];
      trimHistory();
      self.postMessage({type: 'ready'});
      return;
    }
    if (message.type === 'resetHistory') {
      actionLog = [];
      observations = Array.isArray(message.observations) ? message.observations : [];
      return;
    }
    if (message.type === 'appendActions') {
      if (Array.isArray(message.entries) && message.entries.length) actionLog.push(...message.entries);
      trimHistory();
      return;
    }
    if (message.type === 'appendAction') {
      actionLog.push(message.entry);
      trimHistory();
      return;
    }
    if (message.type === 'appendObservation') {
      observations.push(message.row);
      trimHistory();
      return;
    }
    if (message.type === 'plan') {
      const started = performance.now();
      const input = {...message.input, actionLog, observations};
      const result = message.mode === 'afk'
        ? PrestigeV6.afkPlan({...input, afkSeconds: message.afkSeconds})
        : PrestigeV6.planShadow(input);
      const transferableResult = message.mode === 'active'
        ? (({workModel, cashRateModel, ...rest}) => rest)(result)
        : result;
      self.postMessage({type: 'planResult', requestId: message.requestId, mode: message.mode, result: transferableResult, elapsedMs: performance.now() - started});
    }
  } catch (error) {
    self.postMessage({type: 'planError', requestId: message.requestId, error: String(error && error.message || error)});
  }
});
