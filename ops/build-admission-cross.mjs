// Build-only exact-target public Qt adapter. No device or service operations.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=path.resolve('build/admission-arm64'), src=path.resolve('native-admission');
const include=path.resolve('build/observer-sdk/usr/include/aarch64-linux-gnu/qt6');
const fw='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148/libs';
const runtime=path.resolve('build/observer-target-libs');
const run=(tool,args)=>execFileSync(tool,args,{stdio:'inherit'});
const readelf=args=>execFileSync('aarch64-linux-gnu-readelf',args,{encoding:'utf8',maxBuffer:12*1024*1024});
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert(fs.readFileSync(include+'/QtCore/qconfig.h','utf8').includes('#define QT_VERSION_STR "6.8.2"'));
const module=out+'/qml/Companion/Admission'; fs.mkdirSync(module,{recursive:true});
const inc=[include,...['QtCore','QtGui','QtQml','QtQmlIntegration'].map(x=>include+'/'+x),src,out].map(x=>'-I'+x);
const def=['-DQT_NO_DEBUG','-DQT_SHARED','-DQT_CORE_LIB','-DQT_GUI_LIB','-DQT_QML_LIB'];
const moc='/opt/homebrew/share/qt/libexec/moc';
assert.match(execFileSync(moc,['-v'],{encoding:'utf8'}),/6\.8\.2/);
for(const [input,output] of [['admissiongate.h','moc_admissiongate.cpp'],['plugin.cpp','plugin.moc'],['smoke.cpp','smoke.moc']])
    run(moc,[...inc,...def,src+'/'+input,'-o',out+'/'+output]);
const common=['-std=c++17','-O2','-Wall','-Wextra','-Werror',...inc,...def];
const link=['-Wl,-z,relro,-z,now,-z,noexecstack,-z,defs,--as-needed,--allow-shlib-undefined',
    fw+'/libQt6Qml.so.6.10.3',fw+'/libQt6Gui.so.6.10.3',fw+'/libQt6Core.so.6.10.3','-ldl','-pthread'];
const binary=module+'/libcompanionadmissionplugin.so', smoke=out+'/admission-smoke';
const bootstrap=out+'/libcompanionbootstrap.so', child=out+'/admission-preload-child';
run('aarch64-linux-gnu-g++',[...common,'-fPIC','-fvisibility=hidden','-shared',
    src+'/admissiongate.cpp',src+'/plugin.cpp',out+'/moc_admissiongate.cpp',...link,'-o',binary]);
// Link with the C driver: headers give the exact Qt tag ABI, but neither Qt nor
// libstdc++ may be pulled into the preload bootstrap or its non-Qt exec child.
const plainLink=['-Wl,-z,relro,-z,now,-z,noexecstack,-z,defs,--as-needed','-ldl'];
run('aarch64-linux-gnu-gcc',[...common,'-x','c++','-DQT_NO_VERSION_TAGGING','-fno-exceptions','-fno-rtti',
    '-fPIC','-fvisibility=hidden','-shared',src+'/preload.cpp',...plainLink,'-o',bootstrap]);
run('aarch64-linux-gnu-gcc',['-std=c11','-O2','-Wall','-Wextra','-Werror','-fPIE','-pie',
    src+'/preload-child.c',...plainLink,'-o',child]);
run('aarch64-linux-gnu-g++',[...common,'-fPIE','-pie',src+'/smoke.cpp',...link,'-o',smoke]);
fs.copyFileSync(src+'/qmldir',module+'/qmldir');
const providers={
    'libQt6Core.so.6':fw+'/libQt6Core.so.6.10.3','libQt6Gui.so.6':fw+'/libQt6Gui.so.6.10.3',
    'libQt6Qml.so.6':fw+'/libQt6Qml.so.6.10.3','libstdc++.so.6':runtime+'/libstdc++.so.6.0.36',
    'libgcc_s.so.1':runtime+'/libgcc_s.so.1','libc.so.6':runtime+'/libc.so.6','libm.so.6':runtime+'/libm.so.6',
    'libdl.so.2':runtime+'/libdl.so.2','libpthread.so.0':runtime+'/libpthread.so.0'};
const symbols=p=>readelf(['--dyn-syms','--wide',p]).split('\n').map(l=>l.trim().split(/\s+/)).filter(x=>/^\d+:$/.test(x[0]));
function verify(file) {
    const header=readelf(['-h',file]),dynamic=readelf(['-d',file]);
    assert.match(header,/Class:\s+ELF64/); assert.match(header,/Machine:\s+AArch64/);
    assert.match(header,/Data:.*little endian/); assert.match(header,/Type:\s+DYN/);
    assert(!/RPATH|RUNPATH|TEXTREL/.test(dynamic));
    const needed=[...dynamic.matchAll(/\(NEEDED\).*\[([^\]]+)\]/g)].map(x=>x[1]);
    const exports=new Set();
    for(const lib of needed) {
        assert(providers[lib],`Unreviewed dependency ${lib}`);
        for(const f of symbols(providers[lib])) if(f[6]!=='UND'&&['GLOBAL','WEAK','UNIQUE'].includes(f[4])&&['DEFAULT','PROTECTED'].includes(f[5])) exports.add(f[7].replace('@@','@'));
    }
    const required=symbols(file).filter(f=>f[6]==='UND'&&f[4]!=='WEAK'&&f[7]).map(f=>f[7]);
    for(const symbol of required) assert(exports.has(symbol),`Missing exact target symbol ${symbol}`);
    return {sha256:sha(file),dependencies:needed,requiredSymbols:required,runtimeHashes:Object.fromEntries(needed.map(x=>[x,sha(providers[x])]))};
}
const moduleReceipt=verify(binary),smokeReceipt=verify(smoke);
const bootstrapReceipt=verify(bootstrap),childReceipt=verify(child);
for(const receipt of [bootstrapReceipt,childReceipt])
    assert(receipt.dependencies.every(p=>['libc.so.6','libdl.so.2'].includes(p)), 'Bootstrap/child must remain Qt-free');
const own=new Set(symbols(binary).filter(f=>f[6]!=='UND'&&f[4]==='GLOBAL'&&f[5]==='DEFAULT').map(f=>f[7]));
for(const name of ['qt_plugin_instance','qt_plugin_query_metadata_v2','companion_admission_observe_v1']) assert(own.has(name),`Missing public export ${name}`);
assert(!own.has('_ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE'), 'Only Qt-free bootstrap interposes');
const bootstrapExports=symbols(bootstrap).filter(f=>f[6]!=='UND'&&['GLOBAL','WEAK','UNIQUE'].includes(f[4])&&f[5]==='DEFAULT').map(f=>f[7]);
assert.deepEqual(bootstrapExports,['_ZN7QObject12moveToThreadEP7QThreadN2Qt15Disambiguated_tE']);
assert.match(readelf(['-l',smoke]),/Requesting program interpreter: \/lib\/ld-linux-aarch64\.so\.1/);
const receipt={status:'built-not-device-qualified',module:moduleReceipt,smoke:smokeReceipt,
    bootstrap:bootstrapReceipt,child:childReceipt,
    sourceHashes:Object.fromEntries(['admissiongate.h','admissiongate.cpp','preload.cpp','preload-child.c','plugin.cpp','qmldir','smoke.cpp'].map(x=>[x,sha(src+'/'+x)]))};
fs.writeFileSync(out+'/elf-review.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,module:moduleReceipt.sha256,smoke:smokeReceipt.sha256,
    bootstrap:bootstrapReceipt.sha256,child:childReceipt.sha256}));
