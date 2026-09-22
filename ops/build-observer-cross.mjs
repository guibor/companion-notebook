// Build only. This script has no SSH, installation or service-management path.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=path.resolve('build/observer-arm64');
const src=path.resolve('native-observer');
const include=path.resolve('build/observer-sdk/usr/include/aarch64-linux-gnu/qt6');
const fw='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148/libs';
const run=(tool,args,options={})=>execFileSync(tool,args,{stdio:'inherit',...options});
assert(fs.readFileSync(include+'/QtCore/qconfig.h','utf8').includes('#define QT_VERSION_STR "6.8.2"'));
fs.mkdirSync(out,{recursive:true});
const includes=[include,...['QtCore','QtQml','QtQmlIntegration'].map(x=>include+'/'+x),src,out].map(x=>'-I'+x);
const defines=['-DQT_NO_DEBUG','-DQT_SHARED','-DQT_CORE_LIB','-DQT_QML_LIB'];
// Host moc reads Linux headers; the generated source is compiled by the Linux
// compiler. No macOS Qt configuration/header or dylib participates in the ELF.
const moc='/opt/homebrew/share/qt/libexec/moc';
assert.match(execFileSync(moc,['-v'],{encoding:'utf8'}),/6\.8\.2/);
run(moc,[...includes,...defines,src+'/retirementobserver.h','-o',out+'/moc_retirementobserver.cpp']);
run(moc,[...includes,...defines,src+'/plugin.cpp','-o',out+'/plugin.moc']);
const module=out+'/qml/Companion/Lifecycle';
fs.mkdirSync(module,{recursive:true});
const binary=module+'/libcompanionlifecycleplugin.so';
run('aarch64-linux-gnu-g++',['-std=c++17','-O2','-fPIC','-fvisibility=hidden','-Wall','-Wextra','-Werror',
  ...includes,...defines,'-shared',src+'/retirementobserver.cpp',out+'/moc_retirementobserver.cpp',src+'/plugin.cpp',
  '-Wl,-z,relro,-z,now,-z,noexecstack,-z,defs,--as-needed,--allow-shlib-undefined',
  fw+'/libQt6Qml.so.6.10.3',fw+'/libQt6Core.so.6.10.3','-o',binary]);
fs.copyFileSync(src+'/qmldir',module+'/qmldir');
const readelf=args=>execFileSync('aarch64-linux-gnu-readelf',args,{encoding:'utf8',maxBuffer:8*1024*1024});
const header=readelf(['-h',binary]);
assert.match(header,/Class:\s+ELF64/);assert.match(header,/Machine:\s+AArch64/);assert.match(header,/Type:\s+DYN/);
assert.match(header,/Data:.*little endian/);
const dynamic=readelf(['-d',binary]);
assert(!/RPATH|RUNPATH|TEXTREL/.test(dynamic),'No host search paths or text relocations');
const runtime=path.resolve('build/observer-target-libs');
const providers={
  'libQt6Core.so.6':fw+'/libQt6Core.so.6.10.3',
  'libQt6Qml.so.6':fw+'/libQt6Qml.so.6.10.3',
  'libstdc++.so.6':runtime+'/libstdc++.so.6.0.36',
  'libgcc_s.so.1':runtime+'/libgcc_s.so.1',
  'libc.so.6':runtime+'/libc.so.6',
  'libm.so.6':runtime+'/libm.so.6',
};
const needed=[...dynamic.matchAll(/\(NEEDED\).*\[([^\]]+)\]/g)].map(x=>x[1]);
assert(needed.length>0);
const symbols=p=>readelf(['--dyn-syms','--wide',p]).split('\n').map(l=>l.trim().split(/\s+/)).filter(x=>/^\d+:$/.test(x[0]));
const exported=new Set();
for(const lib of needed){
  assert(providers[lib],`Unreviewed runtime dependency: ${lib}`);
  for(const fields of symbols(providers[lib]))
    if(fields[6]!=='UND'&&['GLOBAL','WEAK','UNIQUE'].includes(fields[4])&&['DEFAULT','PROTECTED'].includes(fields[5]))
      exported.add(fields[7].replace('@@','@'));
}
const ownExports=new Set(symbols(binary).filter(x=>x[6]!=='UND'&&x[4]==='GLOBAL'&&x[5]==='DEFAULT').map(x=>x[7]));
for(const name of ['qt_plugin_instance','qt_plugin_query_metadata_v2']) assert(ownExports.has(name),`Plugin entrypoint missing: ${name}`);
const required=symbols(binary).filter(x=>x[6]==='UND'&&x[4]!=='WEAK'&&x[7]).map(x=>x[7]);
for(const symbol of required) assert(exported.has(symbol),`Missing exact target symbol: ${symbol}`);
run(moc,[...includes,...defines,src+'/smoke.cpp','-o',out+'/smoke.moc']);
const smoke=out+'/observer-smoke';
run('aarch64-linux-gnu-g++',['-std=c++17','-O2','-fPIE','-pie','-Wall','-Wextra','-Werror',...includes,...defines,
  src+'/smoke.cpp','-Wl,-z,relro,-z,now,-z,noexecstack,--as-needed,--allow-shlib-undefined',
  fw+'/libQt6Qml.so.6.10.3',fw+'/libQt6Core.so.6.10.3','-o',smoke]);
const smokeHeader=readelf(['-h',smoke]),smokeDynamic=readelf(['-d',smoke]);
assert.match(smokeHeader,/Class:\s+ELF64/);assert.match(smokeHeader,/Data:.*little endian/);
assert.match(smokeHeader,/Machine:\s+AArch64/);assert.match(smokeHeader,/Type:\s+DYN/);
assert.match(readelf(['-l',smoke]),/Requesting program interpreter: \/lib\/ld-linux-aarch64\.so\.1/);
assert(!/RPATH|RUNPATH|TEXTREL/.test(smokeDynamic));
const smokeNeeded=[...smokeDynamic.matchAll(/\(NEEDED\).*\[([^\]]+)\]/g)].map(x=>x[1]);
for(const lib of smokeNeeded) assert(needed.includes(lib),`Smoke needs separate runtime review: ${lib}`);
const smokeRequired=symbols(smoke).filter(x=>x[6]==='UND'&&x[4]!=='WEAK'&&x[7]).map(x=>x[7]);
for(const symbol of smokeRequired) assert(exported.has(symbol),`Smoke missing target symbol: ${symbol}`);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const receipt={status:'cross-built-symbol-compatible-not-device-qualified',architecture:'AArch64',qtHeaders:'6.8.2',
  binarySha256:sha(binary),dependencies:needed,requiredSymbols:required,
  sourceHashes:Object.fromEntries(['retirementobserver.h','retirementobserver.cpp','plugin.cpp','qmldir','smoke.cpp'].map(p=>[p,sha(src+'/'+p)])),
  runtimeHashes:Object.fromEntries(needed.map(p=>[p,sha(providers[p])]))};
receipt.toolchain={compiler:execFileSync('aarch64-linux-gnu-g++',['--version'],{encoding:'utf8'}).split('\n')[0],
  compilerSha256:sha(fs.realpathSync('/opt/homebrew/bin/aarch64-linux-gnu-g++')),mocSha256:sha(moc),
  linuxQtConfigSha256:sha(include+'/QtCore/qconfig.h'),
  headerArchives:Object.fromEntries(fs.readdirSync('build/observer-sdk').filter(x=>x.endsWith('.deb')).map(x=>[x,sha('build/observer-sdk/'+x)]))};
receipt.smoke={binarySha256:sha(smoke),dependencies:smokeNeeded,requiredSymbols:smokeRequired};
fs.writeFileSync(out+'/elf-review.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,binarySha256:receipt.binarySha256,dependencies:needed,requiredSymbols:required.length}));
