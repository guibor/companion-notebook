// Local cross-build only. No tablet connection, capture or staging clearance.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const source = 'ops/read-visual-frame.c', out = 'build/visual-native/read-frame';
fs.mkdirSync('build/visual-native', {recursive: true});
execFileSync('aarch64-linux-gnu-gcc', ['-std=c11', '-O2', '-Wall', '-Wextra', '-Werror',
    '-static', '-s', source, '-o', out]);
const elf = execFileSync('aarch64-linux-gnu-readelf', ['-h', '-l', '-d', out], {encoding: 'utf8'});
assert.match(elf, /Class:\s+ELF64/);
assert.match(elf, /Machine:\s+AArch64/);
assert.match(elf, /Type:\s+EXEC/);
assert.doesNotMatch(elf, /INTERP|NEEDED|RPATH|RUNPATH/);
assert(!fs.readFileSync(out).includes(Buffer.from('--fixture')), 'Desktop fixture must not be staged');
fs.chmodSync(out, 0o700);
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
console.log(JSON.stringify({sourceSha256: hash(source), helperSha256: hash(out),
    rows: 2160, rowBytes: 6480, stride: 6528, outputBytes: 13996800, staticArm64: true}));
