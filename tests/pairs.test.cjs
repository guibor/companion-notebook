const {test}=require('node:test'); const assert=require('node:assert/strict');
const P=require('../src/PairStore.js');
const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
test('pair metadata round trips without content',()=>{
  const p=P.set(P.empty(),a,b,0.4,''); assert.deepEqual(P.parse(JSON.stringify(p)),p);
  assert.deepEqual(P.remove(p,a),P.empty());
});
test('reject self pairs, malformed IDs, unknown schema and non-finite layout',()=>{
  assert.throws(()=>P.set(P.empty(),a,a,0.4,'')); assert.throws(()=>P.set(P.empty(),'../../x',b,0.4,''));
  assert.throws(()=>P.set(P.empty(),a,b,Infinity,'')); assert.throws(()=>P.parse('{"version":2,"pairs":{}}'));
  assert.throws(()=>P.set(P.empty(),a,b,0.4,'bad-page'));
});
test('invalid input is not repaired or allowed to overwrite data silently',()=>{
  assert.throws(()=>P.parse('not json')); assert.throws(()=>P.parse(' '.repeat(262145)));
  assert.throws(()=>P.parse('{"version":1,"pairs":[]}'));
});
