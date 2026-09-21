import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const firmware = process.env.RM_FIRMWARE || '/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148';
const tool = process.env.QMLDIFF_BIN || '/Users/mdf/code/remarkable-beta-os/.cache/tools/qmldiff-25681c3-bin';
const renderProbe = process.env.CN_PROBE === 'render';
const structuralProbe = process.env.CN_PROBE === 'structural';
const diagnostic = renderProbe || structuralProbe;
assert(!process.env.CN_PROBE || diagnostic, 'Unknown probe profile');
const output = diagnostic ? `build/${process.env.CN_PROBE}-native` : 'build/native';
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exact = (p, h) => assert.equal(hash(p),h,p);
exact(path.join(firmware,'xochitl'),'4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4');
exact(path.join(firmware,'hashtab'),'1f2a0f7177dac3cdfc030ff32b4643170dd2ef6e2f6c6369b4c4168513ce01f0');
exact(tool,'5d48704b2b55702bf553f65e0fac46bc2eacd72d3d995ac52b379df7e0ce973d');
const inc = p => fs.readFileSync('native/'+p+'.qml.inc','utf8');
const affect = (file, root, body, imports='') => `AFFECT /${file}\n${imports}\n TRAVERSE ${root}\n${body}\n END TRAVERSE\nEND AFFECT\n`;
const insert = text => ` LOCATE BEFORE ALL\n INSERT {\n${text}\n }\n`;
const replace = (field, before, after) => ` REBUILD ${field}\n LOCATE BEFORE ALL\n REPLACE { ${before} } WITH { ${after} }\n END REBUILD\n`;
let q = 'VERSION 3.29.0.148\n';
q += affect('qml/common/Values.qml','Item',insert('signal cnChooseRequested()' + (diagnostic ? '\nproperty bool cnProbeStarted: false' : '')));
let probeBridge = diagnostic ? inc('probe-bridge') : '';
if (structuralProbe) {
    const start = probeBridge.indexOf('function probeCapture(host) {');
    const end = probeBridge.indexOf('function probeRestore(host) {');
    assert(start > 0 && end > start, 'Capture removal anchors drifted');
    probeBridge = (probeBridge.slice(0, start) + probeBridge.slice(end))
        .replace('property bool probeCaptureDone: false\n', '')
        .replace('property bool probeCaptureSaved: false\n', '')
        .replaceAll('cnProbeCaptureItem', 'cnProbeScene');
    assert(!/probeCapture|grabToImage|saveToFile/.test(probeBridge));
}
const main = inc('main').replace('// PROBE_BRIDGE', probeBridge);
q += affect('qml/device/view/main/MainView.qml','Background#root',insert((diagnostic ? 'enabled: false\n' : '') + main) + `
 TRAVERSE FocusScope#rootItem > FocusScope#viewRoot
 LOCATE AFTER Loader#documentView
 INSERT {
   ${diagnostic ? `Rectangle {
     id: cnProbeNotice
     z: 9001
     anchors.left: parent.left
     anchors.right: parent.right
     anchors.bottom: parent.bottom
     height: 140 * parent.width / 1620
     color: "white"
     border.color: "black"
     Text {
       anchors.centerIn: parent
       text: "Temporary test — writing and scrolling paused\\nNormal setup restores automatically after this test"
       horizontalAlignment: Text.AlignHCenter
       font.pixelSize: 28 * parent.width / 1620
       color: "black"
     }
   }` : ''}
   Loader {
     id: cnHostLoader
     anchors.fill: documentView
     z: 8000
     Component.onCompleted: setSource("file:///home/root/.local/lib/companion-notebook/NativeHost.qml", {bridge: cnBridge})
     onStatusChanged: { if (status === Loader.Error) console.warn("Companion: host load failed") }
   }
   CnEpaper.ScreenModeItem {
     anchors.fill: documentView
     visible: !!cnHost && cnHost.dragging
     mode: CnEpaper.ScreenModeItem.Animation
   }
   Connections {
     target: Values
     function onCnChooseRequested() { if (cnHost && cnBridge.available) cnHost.choose() }
   }
 }
 END TRAVERSE
 TRAVERSE FocusScope#rootItem > FocusScope#viewRoot > Component#documentViewComponent > DocumentView#documentViewItem
 ${insert('cnHost: root.cnHost')}
 END TRAVERSE
`, ' IMPORT xofm.libs.epaper 1.0 CnEpaper' + (diagnostic ? '\n IMPORT xofm.libs.devicescreen 1.0' : ''));
let document = inc('document');
if (diagnostic) {
    document = document.replace(/readonly property bool cnInkAllowed:[^\n]+/, 'readonly property bool cnInkAllowed: false')
        + '\nreadonly property var cnProbeViewport: sceneView.viewport\n';
    document += structuralProbe ? 'readonly property var cnProbeScene: sceneView.sceneView\n'
        : 'readonly property var cnProbeCaptureItem: sceneView.sceneView\nfunction cnProbeCaptureViewport(callback) { return !!cnProbeViewport && !!cnProbeCaptureItem && cnProbeCaptureItem.grabToImage(callback) }\n';
}
q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 RENAME close TO cnStockClose
 ${insert(document)}
 ${replace('cnStockClose','Settings.lastOpen = "";','if (!cnSecondary) Settings.lastOpen = "";')}
 ${replace('_open_helper','Settings.lastOpen = "";','if (!cnSecondary) Settings.lastOpen = "";')}
 ${replace('_open_helper','Settings.lastOpen = document.id;','if (!cnSecondary) Settings.lastOpen = document.id;')}
 ${replace('shortcutsEnabled','visible &&',diagnostic ? 'false && visible &&' : 'cnSelected && visible &&')}
 TRAVERSE Binding
 ${insert('when: root.cnOwnsGlobals; restoreMode: Binding.RestoreNone')}
 END TRAVERSE
 TRAVERSE DeviceSceneView#sceneView
 ${insert('cnPaired: root.cnPaired; cnSelected: root.cnSelected; cnInkAllowed: root.cnInkAllowed; cnInputHeight: root.cnInputHeight; cnLayoutBusy: ' + (diagnostic ? 'true' : '!!root.cnHost && (root.cnHost.dragging || root.cnHost.modalOpen)'))}
 END TRAVERSE
 TRAVERSE DocumentToolSettings#documentViewTools
 ${replace('onDocumentAboutToChange','Settings.setLastWritingTool(toolSettings());','if (root.cnOwnsGlobals) Settings.setLastWritingTool(toolSettings());')}
 END TRAVERSE
 TRAVERSE Item#_uiContainer > Toolbar#toolbar
 ${replace('visible','!inSuspend','!root.cnSecondary && root.cnSelected && !inSuspend')}
 END TRAVERSE
`);
q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(`
 property bool cnPaired: false
 property bool cnSelected: true
 property bool cnInkAllowed: true
 property bool cnLayoutBusy: false
 property real cnInputHeight: height
 PenInputBlocker {
   anchors.top: parent.top
   anchors.left: parent.left
   width: parent.width
   height: Math.max(0, root.cnInputHeight)
   visible: !root.cnInkAllowed || root.cnLayoutBusy
   manager: root.penInput.surfaceManager
 }
`) + `
 TRAVERSE PenInputSurface#inputSurface
 REMOVE anchors.fill
 ${insert('anchors.top: parent.top; anchors.left: parent.left; width: parent.width; height: Math.max(0, root.cnInputHeight)')}
 ${replace('handler','sceneView && !root.adjustViewActive','sceneView && root.cnInkAllowed && !root.cnLayoutBusy && !root.adjustViewActive')}
 END TRAVERSE
 TRAVERSE Binding[.value~minimalUpdates]
 REBUILD value
 LOCATE BEFORE ALL
 INSERT { !root.cnPaired && }
 END REBUILD
 END TRAVERSE
 TRAVERSE Binding[.value~pixelsPerCm]
 REBUILD when
 LOCATE BEFORE ALL
 INSERT { root.cnSelected && }
 END REBUILD
 END TRAVERSE
 TRAVERSE Item > SceneViewGestures#sceneViewGestures
 ${insert('anchors.bottomMargin: Math.max(0, parent.height - root.cnInputHeight)')}
 ${replace('enabled','gesturesEnabled','gesturesEnabled && !root.cnLayoutBusy')}
 END TRAVERSE
`);
// String-valued Binding selectors in this QMLDiff revision can match too broadly.
// Use unique adjacent tokens in the root object's rebuild stream instead.
q += `AFFECT /qml/device/view/documentview/DeviceSceneView.qml
 REBUILD FocusScope#root
 LOCATE BEFORE ALL
 REPLACE { value: EPFramebuffer } WITH { value: root.cnPaired ? null : EPFramebuffer }
 END REBUILD
END AFFECT
`;
q += affect('qt/qml/xofm/libs/toolbar/qml/SettingsMenu.qml','ToolbarTool#root',`
 TRAVERSE Component#settingsComponent > ColumnLayout#content
 ${insert(`ToolbarTool {
 toolbar: root.toolbar
 type: ToolbarTool.Type.FoldoutButton
 Layout.fillWidth: true
 label: "Companion notebook"
 visible: root.documentType === "note" || root.documentType === "pdf"
 shouldShow: visible
 iconSource: "qrc:/ark/icons/notebook"
 onPressed: { root.toolbar.closeFoldout(); Values.cnChooseRequested() }
 }`)}
 END TRAVERSE
`, ' IMPORT common 1.0');
fs.mkdirSync(output,{recursive:true});
fs.mkdirSync('build/test-settings',{recursive:true});
fs.writeFileSync(output+'/companion-notebook.qmd',q);
let host=fs.readFileSync('native/NativeHost.qml','utf8');
if (diagnostic) host=host.replace('property bool renderProbeOnly: false','property bool renderProbeOnly: true')
    .replace(/}\s*$/, inc(structuralProbe ? 'structural-probe' : 'render-probe')+'\n}\n');
if (structuralProbe) {
    for (const content of [q, host])
        assert(!/grabToImage|grabWindow|probeCapture|saveToFile|ShaderEffect|layer\s*\./.test(content), 'Forbidden offscreen capture in structural profile');
}
fs.writeFileSync(output+'/NativeHost.qml',host);
fs.copyFileSync('src/PairStore.js',output+'/PairStore.js');
execFileSync(tool,['hash-diffs',path.join(firmware,'hashtab'),output+'/companion-notebook.qmd'],{stdio:'inherit'});
const result = execFileSync(tool,['check-compatibility',path.join(firmware,'hashtab'),output+'/companion-notebook.qmd'],{encoding:'utf8'});
assert.match(result,/No compatibility errors found\./);
process.stdout.write(result);
fs.writeFileSync(output+'/SHA256SUMS', ['NativeHost.qml','PairStore.js','companion-notebook.qmd'].map(p=>hash(output+'/'+p)+'  '+p+'\n').join(''));
console.log('Native rendering candidate built, pen disabled. Not deployed.');
