const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync, execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-visible-rows-'));
const run = (binary, args) => spawnSync(root + '/' + binary, args,
    {timeout: 6000, maxBuffer: 32 * 1024 * 1024});
before(() => {
    for (const [name, source, flags] of [
        ['fixture', 'ops/read-visual-frame.c', ['-DFRAME_DESKTOP_FIXTURE']],
        ['production-cli', 'ops/read-visual-frame.c', []],
        ['syscalls', 'tests/visual-reader-harness.c', []]
    ]) execFileSync('cc', ['-std=c11', '-D_DARWIN_C_SOURCE', '-O2', '-Wall', '-Wextra', '-Werror', ...flags, source, '-o', root + '/' + name]);
});
after(() => fs.rmSync(root, {recursive: true, force: true}));
test('visible-only read skips sentinel padding and succeeds without final row padding', () => {
    const input = Buffer.alloc(65536 + 2159 * 6528 + 6480, 250);
    const expected = Buffer.alloc(2160 * 6480);
    for (let y = 0; y < 2160; ++y) {
        input.fill(y % 240, 65536 + y * 6528, 65536 + y * 6528 + 6480);
        expected.fill(y % 240, y * 6480, (y + 1) * 6480);
    }
    const file = root + '/padded.rgb32';
    fs.writeFileSync(file, input);
    const result = run('fixture', ['--fixture', file, '0x10000']);
    assert.equal(result.status, 0, String(result.stderr));
    assert.deepEqual(result.stdout, expected);
    assert.equal(result.stdout.length, 13996800);
    assert(!result.stdout.includes(250));
    fs.truncateSync(file, input.length - 1);
    const short = run('fixture', ['--fixture', file, '0x10000']);
    assert.notEqual(short.status, 0);
    assert.equal(short.stdout.length, 2159 * 6480, 'incomplete row is never output');
    assert.match(String(short.stderr), /Visible row read failed/);
    fs.symlinkSync(file, file + '.link');
    const linked = run('fixture', ['--fixture', file + '.link', '0x10000']);
    assert.notEqual(linked.status, 0); assert.equal(linked.stdout.length, 0);
});
test('production CLI rejects fixture mode, malformed PID/address and extra arguments before reads', () => {
    for (const args of [[], ['--fixture', '/tmp/example', '0x10000'], ['0', '0x10000'],
        ['01', '0x10000'], ['-1', '0x10000'], ['2147483648', '0x10000'],
        ['1/../2', '0x10000'], ['1', '65536'], ['1', '0xffffffffffff'],
        ['1', '0x10000', 'extra']]) {
        const result = run('production-cli', args);
        assert.notEqual(result.status, 0, JSON.stringify(args));
        assert.equal(result.stdout.length, 0);
        assert.match(String(result.stderr), /Expected exact PID and buffer address/);
    }
});
for (const scenario of ['parse', 'normal', 'partial-interrupted', 'read-eof', 'read-error',
    'read-interrupt-forever', 'write-zero', 'write-error', 'write-interrupt-forever'])
    test('actual C row-copy/parse implementation: ' + scenario, () => {
        const result = run('syscalls', [scenario]);
        assert.equal(result.status, 0, String(result.stderr));
    });
test('staged reader is static ARM64 with no desktop fixture entrypoint', () => {
    const file = 'build/visual-native/read-frame';
    const info = execFileSync('aarch64-linux-gnu-readelf', ['-h', '-l', '-d', file], {encoding: 'utf8'});
    assert.match(info, /Class:\s+ELF64/); assert.match(info, /Machine:\s+AArch64/);
    assert.match(info, /Type:\s+EXEC/); assert.doesNotMatch(info, /INTERP|NEEDED|RPATH|RUNPATH/);
    assert(!fs.readFileSync(file).includes(Buffer.from('--fixture')));
});
test('controller pins the seventh payload before each capture without installing it in the host', () => {
    const controller = fs.readFileSync('build/visual-native/probe.sh', 'utf8');
    const helperHash = createHash('sha256').update(fs.readFileSync('build/visual-native/read-frame')).digest('hex');
    assert(controller.includes('[ "$(wc -l <"$S/SHA256SUMS")" -eq 7 ]'));
    assert.equal(controller.split('probe.sh capture-frame read-frame | sort)').length, 3);
    assert(controller.includes('exact "$S/read-frame" ' + helperHash + ' || return 1'));
    assert(controller.includes('exact "$S/read-frame" ' + helperHash + '\n    "$S/capture-frame"'));
    assert(controller.includes('[ "$(stat -c %u:%g:%a "$S/read-frame")" = 0:0:700 ]'));
    assert.doesNotMatch(controller, /(?:cp|mv|install)[^\n]*read-frame|\$H\/read-frame/);
});
