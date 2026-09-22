const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createHash} = require('node:crypto');
const {spawnSync} = require('node:child_process');
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('ordinary host has a tap-only ruler and no drag mutation code', () => {
  const host=fs.readFileSync('native/NativeHost.qml','utf8');
  assert.match(host,/SizeRuler\s*\{/);
  assert.match(host,/function chooseSize\(ratio\)/);
  assert.match(host,/readonly property bool dragging: false/);
  assert.doesNotMatch(host,/function (beginDrag|moveDrag|finishDrag|beginPull|finishPull)\b/);
  assert.doesNotMatch(host,/onPositionChanged:/);
  assert.match(host,/property bool inkQualified: false/);
});

test('consumed hardware diagnostics retain their exact historical host', () => {
  assert.equal(sha('native/DiagnosticHost.qml'),'7b76db63188dfc4065cf88301fb0591e0b2213e4483285061c9b08e9f10621e7');
  const builder=fs.readFileSync('build-native.mjs','utf8');
  assert.match(builder,/diagnostic \? 'native\/DiagnosticHost.qml' : 'native\/NativeHost.qml'/);
});

test('ruler marks communicate current state and reject movement as a tap', () => {
  const ruler=fs.readFileSync('ui/SizeRuler.qml','utf8');
  assert.match(ruler,/\[1 \/ 3, 1 \/ 2, 2 \/ 3\]/);
  assert.match(ruler,/Accessible.checked: selected/);
  assert.match(ruler,/gesturePolicy: TapHandler.DragThreshold/);
  assert.doesNotMatch(ruler,/onPositionChanged|DragHandler/);
});

test('old load controller cannot stage a normal payload missing its new ruler runtime', () => {
  const id='20990101T000001Z-991';
  const r=spawnSync(process.execPath,['ops/stage-probe.mjs',id,'load'],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/old load controller has no matching runtime-file inventory/);
  assert.equal(fs.existsSync('build/probe-'+id),false);
});
