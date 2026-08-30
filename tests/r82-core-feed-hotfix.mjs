import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),M=require('../ascension-model.js');

assert.equal(M.SLOWDOWN.length,47,'Slowdown must remain Lv0..46');
assert.equal(M.SLOWDOWN.at(-1),1e42,'Slowdown Lv46 must remain x1e42');
assert.equal(M.CORE_FEED.length,57,'Core Feed must extend through Lv56');
assert.equal(M.CORE_FEED.at(-1),1e52,'Core Feed Lv56 must be x1e52');

const a51=[78,79,79,9,47];
const used=M.coreBundleCost(a51),available=M.totalCoreForAscension(51);
assert.ok(Number.isFinite(used),`A51 live Core must not become Infinity: ${used}`);
assert.ok(used<=available,`A51 live Core must fit: used=${used}, available=${available}`);
assert.equal(used,2.1465296721442388e24);
assert.equal(available,2.1536939630755577e24);

const table=M.compressionFarmCoreTable(0,500);
assert.equal(table.length,501);
assert.equal(table[51].ascensionCount,51);
assert.equal(table[51].feedCapLevel,47,'post-gate stable feed cap should be Lv47 at max Slowdown');
assert.ok(table[51].core[4]<=47,'reference table must not waste Core above the stable feed cap');
assert.ok(table.every(row=>Number.isFinite(row.usedCore)&&row.usedCore<=row.totalCore+Math.max(1,row.totalCore)*1e-12));

console.log(JSON.stringify({used,available,a51Reference:table[51]},null,2));
