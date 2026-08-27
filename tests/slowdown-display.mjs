import assert from 'node:assert/strict';
import M from '../ascension-model.js';

assert.equal(M.formatSlowdownMultiplier(2),'2');
assert.equal(M.formatSlowdownMultiplier(4),'4');
assert.equal(M.formatSlowdownMultiplier(6),'6');
assert.equal(M.formatSlowdownMultiplier(10),'10');
assert.equal(M.formatSlowdownMultiplier(100),'100');
assert.equal(M.formatSlowdownMultiplier(1000),'1.00e3');

console.log('slowdown display formatting: PASS');
