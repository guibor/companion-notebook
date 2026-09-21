const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

// Execute the actual injected JS function, not a duplicate implementation.
const source = fs.readFileSync('native/document.qml.inc', 'utf8');
const start = source.indexOf('function cnIsolateCompanionUi()');
const end = source.indexOf('Component.onCompleted:', start);
assert(start >= 0 && end > start);
const isolate = new Function('children', 'cnSecondary', source.slice(start, end) + '\ncnIsolateCompanionUi();');
const dates = 'file:///home/root/.local/lib/notebook-date-index/DatesPanel.qml';

test('secondary view disables only the duplicate Dates panel', () => {
    const panel = {source: dates, active: true};
    const other = {source: 'file:///another/Panel.qml', active: true};
    const ordinary = {visible: true};
    isolate([ordinary, other, panel], true);
    assert.equal(panel.active, false);
    assert.equal(other.active, true);
    assert.deepEqual(ordinary, {visible: true});
});

test('primary Dates panel remains active; an absent panel is harmless', () => {
    const panel = {source: dates, active: true};
    isolate([panel], false);
    assert.equal(panel.active, true);
    assert.doesNotThrow(() => isolate([], true));
});
