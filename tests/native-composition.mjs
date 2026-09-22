import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const fw = '/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148';
const peers = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/build/pro-3.29.0.148/qmd';
// ReManager accepted this r1 base and explicitly handed over the Pro.
const manifest = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
const tool = '/Users/mdf/code/remarkable-beta-os/.cache/tools/qmldiff-25681c3-bin';
const sha = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(sha(manifest),'5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d');
const expected = fs.readFileSync(manifest,'utf8').trim().split('\n').map(x=>x.split(/\s+/)[0]).sort();
const peerFiles = fs.readdirSync(peers).filter(x=>x.endsWith('.qmd')).map(x=>path.join(peers,x));
assert.deepEqual(peerFiles.map(sha).sort(),expected,'Base payload drifted; await a new accepted inventory');
const app = path.join(fw,'appload-0.6-embedded.qmd');
assert.equal(sha(app),'69147587485e8f90336f8e504f48ffebb39212b47572d9cd990b7cfd12ec692a');
const profile=process.env.CN_PROBE||'load';
assert(['load','render','structural','geometry','ink','retirement','visual'].includes(profile));
const payload=profile==='load'?'build/native':`build/${profile}-native`;
const candidate=path.resolve(payload+'/companion-notebook.qmd');
const input='build/composition-input'; fs.mkdirSync(input,{recursive:true});
fs.cpSync(path.join(fw,'resources'),input,{recursive:true});
fs.cpSync(path.join(fw,'appload-0.6-resources'),input,{recursive:true});
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const variants=[['companion-first',[candidate,app,...peerFiles]],['companion-last',[app,...peerFiles,candidate]],['appload-last',[...peerFiles,candidate,app]]];
const counts={};
for(const [name,patches] of variants) {
  const out='build/composed-'+name;
  execFileSync(tool,['apply-diffs','--clean','--hashtab',path.join(fw,'hashtab'),'--version','3.29.0.148',input,out,...patches],{stdio:'pipe'});
  for(const p of files(out).filter(p=>p.endsWith('.qml'))) execFileSync('qmlformat',['--ignore-settings',p],{stdio:['ignore','ignore','pipe']});
  const read=p=>fs.readFileSync(path.join(out,p),'utf8');
  const doc=read('qml/device/view/documentview/DocumentView.qml');
  assert.match(doc,/function cnStockClose/); assert.match(doc,/if \(!cnSecondary\) Settings.lastOpen = document.id/);
  assert.match(doc,/Values.ndiAddPage\(DocumentController,\s*document,/);
  assert.match(doc,/requestTableOfContents\(true\)/);
  assert.match(doc,/Component.onCompleted: Qt.callLater\(cnIsolateCompanionUi\)/);
  assert.match(doc,/child.active = false/);
  assert.match(doc,/if \(!cnSecondary\) return/);
  assert.equal((doc.match(/when: root.cnOwnsGlobals/g)||[]).length,1);
  const scene=read('qml/device/view/documentview/DeviceSceneView.qml');
  assert.match(scene,/value: root.cnPaired\?null:EPFramebuffer/);
  assert.match(scene,/value: !root.cnPaired&&root.textMode/);
  assert.match(scene,/when: root.cnSelected&&root.viewBehavior/);
  assert(/handler:(?:!root.cnHandlerDetached&&)?sceneView&&(?:root.cnInkAllowed|\(root.cnGeometryAttached)/.test(scene.replace(/\s/g,'')),'Native handler gate missing');
  assert(/height:Math.max\(0,root.cnInputHeight\)/.test(scene.replace(/\s/g,'')),'Native input clipping height missing');
  assert.match(scene,/PenInputBlocker/);
  const main=read('qml/device/view/main/MainView.qml');
  assert.match(main,/cnSecondary: true/); assert.match(main,/id: rmstreamShortcutLoader/);
  assert.match(main,/id: dispatchDocumentMenuLoader/);
  if (profile !== 'load') {
    if (profile === 'visual') {
      assert.doesNotMatch(main,/createDocument\(/);
      assert.match(main,/reopening saved disposable IDs/);
      assert.match(main,/entry.pageForId\(pages\[i\]\) !== 0/);
    }
    if (profile === 'ink' || profile === 'retirement') {
      assert(/readonlypropertyboolcnInkAllowed:!!cnHost&&cnHost.probeAllows\(root\)/.test(doc.replace(/\s/g,'')), 'Disposable-only ink gate missing');
      assert(/function_open_helper\([^)]*\)\{if\(cnHost&&cnHost.probeDocumentLocked\)return;/.test(doc.replace(/\s/g,'')), 'Open lock must precede all mutation');
      assert.match(doc,/cnHost.penDown \|\| cnHost.probeDocumentLocked/);
      assert.match(doc,/onCnProbeSubmitted: function\(stroke\)/);
      assert.match(scene,/controller.addDrawingLine\(stroke\); root.cnProbeSubmitted\(stroke\);/);
      assert.match(scene,/enabled: false\s*&&\s*gesturesEnabled/);
      assert.match(scene,/if \(cnProbeDocumentLocked\) return; endItemSelection/);
      assert.match(scene,/if \(cnProbeDocumentLocked\) return; const pageIndex/);
      assert.match(main,/acceptedButtons: Qt.AllButtons/);
      if (profile === 'retirement') {
        assert.match(doc,/cnProbeReceive: function\(stroke, targetController, inputHandler\)/);
        assert.match(scene,/if \(!root.cnProbeReceive \|\| !root.cnProbeReceive\(stroke,controller,strokeHandler\)\) return; completedStroke\(\);/);
        assert(scene.indexOf('root.cnProbeReceive(stroke,controller,strokeHandler)')<scene.indexOf('controller.addDrawingLine(stroke); root.cnProbeSubmitted(stroke);'));
        assert.match(scene,/property\s+ScenePenInputHandler strokeHandler: null/);
        assert.match(scene,/id: cnStrokeHandlerComponent/);
        assert.match(scene,/root\.cnHandlerDetached\?null:strokeHandler/);
        assert.match(scene,/if \(root.cnPaired\) return 0/);
        assert.match(scene,/root\.strokeHandler = null;?\s*prior.destroy\(\)/);
        assert.match(scene,/if \(!strokeHandler \|\| strokeHandler.timeSincePenUp/);
        assert.doesNotMatch(scene,/readonly property alias strokeHandler/);
      }
    } else {
      assert.match(doc,/readonly property\s+bool cnInkAllowed: false/);
      assert.match(doc,/cnLayoutBusy: true/);
      assert.match(main,/enabled: false/);
    }
    assert.match(doc,/shortcutsEnabled: false && visible/);
    assert.match(doc,/readonly property\s+var cnProbeViewport: sceneView.viewport/);
    if (profile === 'render') {
      assert.match(doc,/function cnProbeCaptureViewport/);
      assert.match(doc,/readonly property\s+var cnProbeCaptureItem: sceneView.sceneView/);
      assert.match(doc,/cnProbeCaptureItem.grabToImage\(callback\)/);
      assert.doesNotMatch(doc,/cnProbeViewport.grabToImage/);
    } else {
      assert.match(doc,/readonly property\s+var cnProbeScene: sceneView.sceneView/);
      assert.match(main,/primary.cnProbeScene/);
      assert.match(main,/String\(first.document.id\) === probeIds\[0\]/);
      assert.match(main,/primary.sceneController !== host.secondary.sceneController/);
      for (const source of [doc,main,fs.readFileSync(candidate,'utf8'),fs.readFileSync(payload+'/NativeHost.qml','utf8')])
        assert.doesNotMatch(source,/grabToImage|grabWindow|probeCapture|saveToFile|ShaderEffect|layer\s*\./);
    }
    assert.match(main,/id: cnProbeNotice/);
    assert.match(main,/Temporary test — writing and scrolling paused/);
    assert.doesNotMatch(main,/root\.content\.grabToImage/);
  } else {
    assert.doesNotMatch(main,/cnProbeNotice/);
  }
  if (profile === 'load' || profile === 'geometry' || profile === 'ink' || profile === 'retirement') {
    assert.match(scene,/limitScrollingToPaper: !root.cnPaired/);
    assert.match(scene,/cnPaired: root.cnPaired/);
    assert.match(scene,/root.height - root.cnInputHeight/);
    assert.match(scene,/function cnUpdateInputGeometry/);
    assert.match(scene,/inputSurface.updateTransform\(\)/);
    assert.match(scene,/manager.updateRegions\(\)/);
    assert.match(scene,/visible: !root.cnGeometryHidden/);
    if (profile === 'load') assert.match(doc,/!cnHost.inputGeometryPending/);
    const nav=read('qml/device/view/documentview/Navigation.qml');
    assert.match(nav,/function cnConstrainToPane/);
    assert.match(nav,/if \(cnJump\(-1\)\) return/);
    assert.match(nav,/cnConstrainToPane\(\); updateScrollbars\(\)/);
  }
  counts[name]=files(out).length;
}
execFileSync(tool,['apply-diffs','--clean','--hashtab',path.join(fw,'hashtab'),'--version','3.28.0.169',input,'build/wrong-firmware',candidate],{stdio:'pipe'});
assert.equal(files('build/wrong-firmware').length,0);
assert.doesNotMatch(fs.readFileSync('native/NativeHost.qml','utf8'),/\bCanvas\b|addDrawingLine|\.rm\b|\.content\b/);
assert.match(fs.readFileSync('native/NativeHost.qml','utf8'),/property bool inkQualified: false/);
const payloadSha256=Object.fromEntries(['NativeHost.qml','PairStore.js'].map(p=>[p,sha(payload+'/'+p)]));
execFileSync('qmlformat',['--ignore-settings',payload+'/NativeHost.qml'],{stdio:['ignore','ignore','pipe']});
fs.writeFileSync(payload+'/composition.json',JSON.stringify({status:'offline-companion-against-accepted-r1-base',profile:process.env.CN_PROBE||'load',firmware:'3.29.0.148',penEnabled:profile==='ink'||profile==='retirement',ordinaryDocumentInk:false,baseQmds:11,embedded:1,baseManifestSha256:sha(manifest),counts,candidateSha256:sha(candidate),payloadSha256},null,2)+'\n');
console.log(JSON.stringify(counts));
