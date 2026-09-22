const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function body(source,anchor){
  const start=source.indexOf(anchor);assert(start>=0,anchor);
  const open=source.indexOf('{',start);let depth=1,end=open+1;
  for(;depth&&end<source.length;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
  assert.equal(depth,0);return source.slice(open+1,end-1);
}
test('bootstrap controller build preserves consumed artifacts and every recovery action',()=>{
  const priorPath='build/admission-native/probe.sh';
  const before=hash(priorPath);
  assert.equal(before,'23a46e5b4ccf8e08e73bcc6e986e595f43207bd62fcc3dfb9f568d20bd195007');
  execFileSync(process.execPath,['ops/build-admission-controller.mjs']);
  assert.equal(hash(priorPath),before);
  const prior=fs.readFileSync(priorPath,'utf8');
  const current=fs.readFileSync('build/admission-bootstrap-native/probe.sh','utf8');
  for(const fn of ['recover','release_injected_pen','owner_cgroup_empty','publish_policy'])
    assert.equal(body(current,fn+'()'),body(prior,fn+'()'),fn);
  assert.equal(body(current,'cleanup_host()'),body(prior,'cleanup_host()')
    .replace('NativeHost.qml PairStore.js qml','NativeHost.qml PairStore.js libcompanionbootstrap.so qml'));
  assert.match(current,/RuntimeMaxSec=420/);assert.match(current,/\$\(stamp\) \+ 180/);
  assert.doesNotMatch(current,/ExecStart|--preload|ld-linux/);
  assert.match(current,/\[ "\$\(readlink -f "\/proc\/\$p\/exe"\)" = \/usr\/bin\/xochitl \]/);
});
test('rendered service policy preloads only bootstrap plus unchanged base XOVI',()=>{
  const source=fs.readFileSync('build/admission-bootstrap-native/probe.sh','utf8');
  const policy=execFileSync('/bin/bash',['-c',
    'R=/private-runtime; B=/private-backup; render_policy(){'+body(source,'render_policy()')+'}; render_policy probe'],{encoding:'utf8'});
  assert.match(policy,/^Environment="LD_PRELOAD=\/home\/root\/\.local\/lib\/companion-notebook\/libcompanionbootstrap\.so:\/home\/root\/xovi\/xovi\.so"$/m);
  assert.match(policy,/^Environment="QML_IMPORT_PATH=\/home\/root\/\.local\/lib\/companion-notebook\/qml"$/m);
  assert.doesNotMatch(policy,/LD_PRELOAD=.*admissionplugin|ExecStart|--preload/);
});
test('stage, prepared runtime, cleanup and health account for both exact modules',()=>{
  const source=fs.readFileSync('build/admission-bootstrap-native/probe.sh','utf8');
  const elf=JSON.parse(fs.readFileSync('build/admission-arm64/elf-review.json'));
  for(const fn of ['verify_stage','verify_observer'])
    assert(body(source,fn+'()').includes(elf.bootstrap.sha256),fn);
  assert.match(body(source,'verify_stage()'),/wc -l.*-eq 10/);
  for(const fn of ['verify_prepared','cleanup_host'])
    assert.match(body(source,fn+'()'),/NativeHost.qml PairStore.js libcompanionbootstrap.so qml/);
  const health=body(source,'healthy()');
  assert.match(health,/for item in "\$H\/libcompanionbootstrap.so" "\$H\/qml\/Companion\/Admission\/libcompanionadmissionplugin.so"/);
  assert.equal((health.match(/libcompanion\(admissionplugin\|bootstrap\)/g)||[]).length,2);
  assert.doesNotMatch(source,/admission-smoke|admission-preload-child|old-combined/);
});
test('actual bootstrap and child ELF dependencies remain Qt and C++ free',()=>{
  for(const name of ['libcompanionbootstrap.so','admission-preload-child']) {
    const dynamic=execFileSync('aarch64-linux-gnu-readelf',['-d','build/admission-arm64/'+name],{encoding:'utf8'});
    const needed=[...dynamic.matchAll(/\(NEEDED\).*\[([^\]]+)\]/g)].map(x=>x[1]);
    assert(needed.length>0);
    assert(needed.every(p=>['libc.so.6','libdl.so.2'].includes(p)),name);
    assert.doesNotMatch(dynamic,/RPATH|RUNPATH|TEXTREL/);
  }
});
test('standalone audit pins a hard descendant bound and cannot mutate existing services',()=>{
  const script=fs.readFileSync('ops/test-admission-bootstrap.sh','utf8');
  assert.match(script,/MainPID --value "\$unit"\)" = "\$\$"/);
  assert.match(script,/KillMode --value "\$unit"\)" = control-group/);
  assert.match(script,/RuntimeMaxUSec --value "\$unit"\)" = 45s/);
  assert.match(script,/TimeoutStopUSec --value "\$unit"\)" = 2s/);
  assert.match(script,/SendSIGKILL --value "\$unit"\)" = yes/);
  assert.match(script,/timeout -k 2 8 env -i/);
  assert.match(script,/ADMISSION_CHILD_FAIL: inherited Qt or admission module/);
  assert.doesNotMatch(script,/systemctl (restart|start|stop|kill|enable|daemon-reload)|\/dev\/input|pincode-rs|LD_PRELOAD=.*xovi\.so/);
});
