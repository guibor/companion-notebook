const {test} = require('node:test');
const assert = require('node:assert/strict');
const W = require('../src/Workspace.js');
function ready() { const s = W.create(600, 900); W.openPrimary(s, 'pdf'); W.attach(s, 'notes'); return s; }
test('unopened workspace cannot write', () => {
  assert.equal(W.beginStroke(W.create(600,900),20,20),'blocked');
});
test('overlay leaves main geometry fixed during every intermediate drag', () => {
  const s = ready(); W.beginDrag(s, 620);
  for (let y = 620; y >= 250; y--) { W.drag(s,y); assert.equal(s.reveal, 300 + 620-y); assert.equal(s.height,900); }
  W.endDrag(s); assert.equal(s.lastReveal,670);
});
test('first stroke writes in either pane without an activation tap', () => {
  const s = ready(); assert.equal(W.beginStroke(s,20,700),'writing'); assert.equal(s.busy.document,'notes');
  assert.equal(s.focus,'companion'); W.endStroke(s);
  assert.equal(W.beginStroke(s,20,200),'writing'); assert.equal(s.busy.document,'pdf'); assert.equal(s.focus,'main');
});
test('stroke locks focus geometry pair and primary document', () => {
  const s=ready(); W.beginStroke(s,20,200);
  for (const attempt of [() => W.select(s,'companion'), () => W.beginDrag(s,600), () => W.tuck(s),
    () => W.detach(s), () => W.attach(s,'other'), () => W.openPrimary(s,'new'), () => W.resize(s,900,600)]) assert.equal(attempt(),false);
  assert.equal(W.strokePoint(s,20,700),null); assert.equal(W.strokePoint(s,20,250).document,'pdf');
  W.endStroke(s); assert.equal(W.tuck(s),true);
});
test('occluded main and chrome cannot receive ink', () => {
  const s=ready(); assert.equal(W.hit(s,20,620),'handle'); assert.equal(W.beginStroke(s,20,620),'blocked');
  assert.equal(W.hit(s,20,700),'companion'); assert.equal(W.hit(s,-1,700),'');
});
test('tuck preserves both positions and restores previous reveal', () => {
  const s=ready(); W.saveScroll(s,'main',120); W.saveScroll(s,'companion',430);
  W.tuck(s); W.reveal(s); assert.equal(s.reveal,300); assert.equal(W.scroll(s,'main'),120); assert.equal(W.scroll(s,'companion'),430);
});
test('pairings are scoped and same-document rejected without changing previous pair', () => {
  const s=ready(); assert.equal(W.attach(s,'pdf'),false); assert.equal(s.companion,'notes');
  W.openPrimary(s,'second'); assert.equal(s.companion,''); W.attach(s,'third');
  W.openPrimary(s,'pdf'); assert.equal(s.companion,'notes'); assert.equal(s.reveal,0);
});
test('scroll ownership blocks resizing without retargeting writing', () => {
  const s=ready(); W.beginScroll(s,'companion'); assert.equal(s.focus,'main'); assert.equal(W.beginDrag(s,610),false);
  assert.equal(W.beginStroke(s,10,200),'blocked'); W.endScroll(s); assert.equal(W.beginDrag(s,610),true);
});
test('landscape safely tucks, does not attempt unsupported split', () => {
  const s=ready(); W.select(s,'companion'); W.resize(s,900,600); assert.equal(s.reveal,0); assert.equal(s.focus,'main');
  assert.equal(W.reveal(s),false); W.resize(s,600,900); W.reveal(s); assert.equal(s.reveal,300);
});
test('drag cancellation restores exact previous height', () => {
  const s=ready(); W.beginDrag(s,600); W.drag(s,200); W.endDrag(s,true); assert.equal(s.reveal,300);
});
test('drag limits and tuck threshold', () => {
  const s=ready(); W.beginDrag(s,600); W.drag(s,-1000); assert.equal(s.reveal,780); W.endDrag(s);
  W.beginDrag(s,120); W.drag(s,899); W.endDrag(s); assert.equal(s.reveal,0); assert.equal(s.lastReveal,780);
});
test('all visible points have exactly one owner at every tested margin height', () => {
  const s=ready();
  for (let reveal=100; reveal<=780; reveal+=20) {
    s.reveal=reveal;
    for (let y=0; y<900; y+=5) {
      const expected=y<900-reveal?'main':y<900-reveal+48?'handle':'companion';
      assert.equal(W.hit(s,300,y),expected);
      if (expected==='handle') continue;
      W.select(s,expected); assert.equal(W.beginStroke(s,300,y),'writing');
      const p=W.strokePoint(s,300,y); assert.equal(p.document,expected==='main'?'pdf':'notes');
      assert.equal(p.y,expected==='main'?y:y-(900-reveal+48)); W.endStroke(s);
    }
  }
});
