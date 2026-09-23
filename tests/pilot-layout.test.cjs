const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function functions(path) {
  const s = fs.readFileSync(path, 'utf8');
  let result = '';
  for (const m of s.matchAll(/^\s*function (\w+)\([^\n]*\) \{/gm)) {
    let start = m.index + m[0].indexOf('function'), i = s.indexOf('{', start), depth = 1;
    for (++i; depth; ++i) { if (s[i] === '{') depth++; if (s[i] === '}') depth--; }
    result += s.slice(start, i) + '\n';
  }
  return result;
}
function fixture() {
  const s = {idle:true, mayShow:true, secondary:{}, savedRatio:.5, height:2160,
    minimumHeight:360, maximumHeight:1836, revealHeight:1080, primaryId:'a',
    companionId:'b', isFullCompanion:false, pendingLayout:-1,
    requestTransition(name, cb) {s.apply = cb; return true;}};
  s.host = s;
  vm.createContext(s);
  vm.runInContext(functions('native/NativeHost.qml') + functions('native/layout-actions.qml.inc'), s);
  s.choose = () => {s.choosing=true;};
  s.openSecondary = () => {s.opened=true; return true;};
  s.tuck = () => {s.tucked=true; return true;};
  return s;
}
test('every split choice survives deferred parked application', () => {
  const s=fixture();
  for (const ratio of [.25,.375,.5]) {
    assert.equal(s.applyLayoutChoice(ratio),true); s.apply();
    assert.equal(s.savedRatio,ratio); assert.equal(s.revealHeight,2160*ratio);
  }
});
test('menu choices queue while the native transition is busy', () => {
  const s=fixture(); s.idle=false;
  assert.equal(s.layoutChoice(.375),true);
  assert.equal(s.pendingLayout,.375); assert.equal(s.pendingLayoutSource,'a');
  assert.equal(s.revealHeight,1080);
});
test('unpaired size choice opens picker with requested size', () => {
  for (const ratio of [.25,.375,.5,1]) {
    const s=fixture(); s.secondary=null; s.companionId='';
    assert.equal(s.applyLayoutChoice(ratio),true);
    assert.equal(s.choosing,true); assert.equal(s.pickerLayout,ratio);
    assert.equal(s.savedRatio,ratio===1?.375:ratio);
  }
});
test('reverse pairing is a default, not an overwrite of another saved pair', () => {
  const s=fixture(); s.Store=require('../src/PairStore.js'); s.storeReady=true;
  s.primaryId='11111111-1111-4111-8111-111111111111';
  s.companionId='22222222-2222-4222-8222-222222222222';
  s.pairs=s.Store.empty(); s.bridge={primary:{currentPageId:''}}; s.persist=()=>true;
  s.rememberReversePair();
  assert.equal(s.pairs.pairs[s.companionId].companion,s.primaryId);
  const before=JSON.stringify(s.pairs); s.savedRatio=.75; s.rememberReversePair();
  assert.equal(JSON.stringify(s.pairs),before);
});
