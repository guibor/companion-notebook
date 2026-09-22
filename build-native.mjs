import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const firmware = process.env.RM_FIRMWARE || '/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148';
const tool = process.env.QMLDIFF_BIN || '/Users/mdf/code/remarkable-beta-os/.cache/tools/qmldiff-25681c3-bin';
const renderProbe = process.env.CN_PROBE === 'render';
const structuralProbe = process.env.CN_PROBE === 'structural';
const geometryProbe = process.env.CN_PROBE === 'geometry';
const retirementProbe = process.env.CN_PROBE === 'retirement';
const visualProbe = process.env.CN_PROBE === 'visual';
const inkProbe = process.env.CN_PROBE === 'ink' || retirementProbe;
const noCaptureProbe = structuralProbe || geometryProbe || inkProbe || visualProbe;
const diagnostic = renderProbe || noCaptureProbe;
// Preserve the previously reviewed diagnostic bytes. This new navigation
// candidate is local-only until it receives a separately scoped native trial.
const paneNavigation = !diagnostic || geometryProbe || inkProbe;
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
if (noCaptureProbe) {
    const start = probeBridge.indexOf('function probeCapture(host) {');
    const end = probeBridge.indexOf('function probeRestore(host) {');
    assert(start > 0 && end > start, 'Capture removal anchors drifted');
    probeBridge = (probeBridge.slice(0, start) + probeBridge.slice(end))
        .replace('property bool probeCaptureDone: false\n', '')
        .replace('property bool probeCaptureSaved: false\n', '')
        .replaceAll('cnProbeCaptureItem', 'cnProbeScene');
    assert(!/probeCapture|grabToImage|saveToFile/.test(probeBridge));
}
if (visualProbe) {
    const start=probeBridge.indexOf('function probeCreate() {');
    const end=probeBridge.indexOf('function probeSeparate(host) {');
    assert(start>0 && end>start);
    probeBridge=probeBridge.slice(0,start)+inc('visual-open')+probeBridge.slice(end);
    assert(!probeBridge.includes('createDocument('));
}
const main = inc('main').replace('// PROBE_BRIDGE', probeBridge);
q += affect('qml/device/view/main/MainView.qml','Background#root',insert((diagnostic && !inkProbe ? 'enabled: false\n' : '') + main) + `
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
if (inkProbe) q += affect('qml/device/view/main/MainView.qml','Background#root',`
 TRAVERSE FocusScope#rootItem > FocusScope#viewRoot
 ${insert(`MouseArea {
     anchors.fill: parent; z: 9002; acceptedButtons: Qt.AllButtons
     preventStealing: true
     onWheel: function(event) { event.accepted = true }
 }`)}
 TRAVERSE Rectangle#cnProbeNotice
 ${insert('visible: !cnHost || cnHost.probePhase < 3')}
 END TRAVERSE
 END TRAVERSE
`);
let document = inc('document');
if (paneNavigation) {
    document = document.replace('!cnHost.dragging && !cnHost.restoring', '!cnHost.dragging && !cnHost.restoring && (!cnHost.secondary || !cnHost.inputGeometryPending)')
        .replace('cnHost.inkQualified && cnSelected && cnPaired', 'cnHost.inkQualified && cnPaired')
        + `
function cnUpdateInputGeometry() { return sceneView.cnUpdateInputGeometry() }
function cnInputGeometryReadiness() { return sceneView.cnInputGeometryReadiness() }
Connections {
    target: root.penHandler
    function onStrokeCompleted() { if (root.cnHost) root.cnHost.noteToolbarOwner(root) }
}
`;
}
if (diagnostic) {
    document = document.replace(/readonly property bool cnInkAllowed:[^\n]+/, inkProbe
        ? 'readonly property bool cnInkAllowed: !!cnHost && cnHost.probeAllows(root)'
        : 'readonly property bool cnInkAllowed: false')
        + '\nreadonly property var cnProbeViewport: sceneView.viewport\n';
    document += noCaptureProbe ? 'readonly property var cnProbeScene: sceneView.sceneView\n'
        : 'readonly property var cnProbeCaptureItem: sceneView.sceneView\nfunction cnProbeCaptureViewport(callback) { return !!cnProbeViewport && !!cnProbeCaptureItem && cnProbeCaptureItem.grabToImage(callback) }\n';
}
if (geometryProbe) document += '\nfunction cnProbePaneGeometry() { return sceneView.cnProbePaneGeometry() }\n';
if (inkProbe) {
    document += `
function cnProbeExpectedBounds(i) {
    var a = i === 0 ? Qt.point(550,450) : Qt.point(700,1500)
    var b = i === 0 ? Qt.point(850,500) : Qt.point(1000,1570)
    a = sceneView.tileManager.viewToScene(sceneView.mapFromItem(null,a.x,a.y))
    b = sceneView.tileManager.viewToScene(sceneView.mapFromItem(null,b.x,b.y))
    return Qt.rect(a.x,a.y,b.x-a.x,b.y-a.y)
}
function cnProbePreparePen() {
    if (!cnHost || !cnHost.renderProbeOnly || cnHost.probeDocumentLocked || !cnHost.bridge.probeSeparate(cnHost)) return false
    toolbar.selectPen("primary")
    return documentViewTools.isWritingTool(documentViewTools.activePen.tool)
}
`;
    if (retirementProbe) {
        document = document.replace('a = sceneView.tileManager.viewToScene(',
            'if (cnHost.probeRound === 2) { a = Qt.point(a.x,a.y+200); b = Qt.point(b.x,b.y+200) }\n    a = sceneView.tileManager.viewToScene(');
        document += `
function cnRetirementReadiness() { return sceneView.cnRetirementReadiness() }
function cnRetireHandler() { return sceneView.cnRetireHandler() }
function cnCreateHandler() { return sceneView.cnCreateHandler() }
`;
    }
    document = document.replace('if (cnHost && cnHost.penDown) return', 'if (cnHost && (cnHost.penDown || cnHost.probeDocumentLocked)) return')
        .replace('if (root.cnHost) root.cnHost.noteToolbarOwner(root)', 'if (root.cnHost && !root.cnHost.renderProbeOnly) root.cnHost.noteToolbarOwner(root)');
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
 ${insert('cnPaired: root.cnPaired; cnSelected: root.cnSelected; cnInkAllowed: root.cnInkAllowed; cnInputHeight: root.cnInputHeight; cnLayoutBusy: ' + (inkProbe ? '!!root.cnHost && (!root.cnHost.probeWriting || root.cnHost.inputGeometryPending)' : diagnostic ? 'true' : '!!root.cnHost && (root.cnHost.dragging || root.cnHost.modalOpen || root.cnHost.inputGeometryPending)'))}
 END TRAVERSE
 TRAVERSE DocumentToolSettings#documentViewTools
 ${replace('onDocumentAboutToChange','Settings.setLastWritingTool(toolSettings());','if (root.cnOwnsGlobals) Settings.setLastWritingTool(toolSettings());')}
 END TRAVERSE
 TRAVERSE Item#_uiContainer > Toolbar#toolbar
 ${replace('visible','!inSuspend','!root.cnSecondary && root.cnSelected && !inSuspend')}
 END TRAVERSE
`);
if (inkProbe) q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 REBUILD _open_helper
 LOCATE BEFORE ALL
 INSERT { if (cnHost && cnHost.probeDocumentLocked) return; }
 END REBUILD
 TRAVERSE DeviceSceneView#sceneView
 ${insert('cnProbeDocumentLocked: !!root.cnHost && root.cnHost.probeDocumentLocked; onCnProbeSubmitted: function(stroke) { if (root.cnHost) root.cnHost.probeSubmitted(root,stroke) }')}
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
 ${replace('enabled','gesturesEnabled',inkProbe ? 'false && gesturesEnabled' : 'gesturesEnabled && !root.cnLayoutBusy')}
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
if (inkProbe) q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(`
property bool cnProbeDocumentLocked: false
signal cnProbeSubmitted(var stroke)
`) + `
 ${replace('close','endItemSelection();','if (cnProbeDocumentLocked) return; endItemSelection();')}
 ${replace('goToPageId','const pageIndex =','if (cnProbeDocumentLocked) return; const pageIndex =')}
 TRAVERSE ScenePenInputHandler#strokeHandler
 ${replace('onStrokeCompleted','controller.addDrawingLine(stroke);','controller.addDrawingLine(stroke); root.cnProbeSubmitted(stroke);')}
 END TRAVERSE
`);
if (paneNavigation) {
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',`
 ${geometryProbe ? insert(inc('geometry-check')) : ''}
 ${insert(inc('pen-refresh'))}
 TRAVERSE PenInputSurface#inputSurface
 ${insert('visible: !root.cnGeometryHidden')}
 ${replace('handler','root.cnInkAllowed && !root.cnLayoutBusy','(root.cnGeometryAttached || (root.cnInkAllowed && !root.cnLayoutBusy))')}
 END TRAVERSE
 TRAVERSE Component#sceneViewComponent > SceneView#view
 ${replace('limitScrollingToPaper','true','!root.cnPaired')}
 END TRAVERSE
 TRAVERSE Navigation#sceneNavigation
 ${insert('cnPaired: root.cnPaired; cnLayoutBusy: root.cnLayoutBusy; anchors.bottomMargin: root.cnPaired ? Math.max(0, root.height - root.cnInputHeight) : 0')}
 END TRAVERSE
 ${replace('availableSceneRect','root.height - root.keyboardMargin','(root.cnPaired ? root.cnInputHeight : root.height) - root.keyboardMargin')}
`);
    q += affect('qml/device/view/documentview/Navigation.qml','Item#root',insert(inc('navigation')) + `
 ${replace('scrollDown','const nearestAlignment = function()','if (cnJump(-1)) return; const nearestAlignment = function()')}
 ${replace('scrollUp','const nearestAlignment = function()','if (cnJump(1)) return; const nearestAlignment = function()')}
 ${replace('updateDragAndZoom','updateScrollbars();','cnConstrainToPane(); updateScrollbars();')}
`);
}
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
if (retirementProbe) {
    assert.equal(fs.readFileSync(path.join(firmware,'resources/qml/device/view/documentview/DeviceSceneView.qml'),'utf8')
        .split('activeTool: penHandler.lineTool').length,2,'Exact ScreenDriver active-tool preimage drifted');
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(inc('handler-factory')) + `
 TRAVERSE PenInputSurface#inputSurface
 ${replace('handler','sceneView &&','!root.cnHandlerDetached && sceneView &&')}
 END TRAVERSE
 TRAVERSE ScreenDriver#screenDriver
 REBUILD activeTool
 LOCATE BEFORE ALL
 REMOVE UNTIL END
 INSERT { penHandler ? penHandler.lineTool : documentViewTools.activePen.tool }
 END REBUILD
 END TRAVERSE
 TRAVERSE ScenePenInputHandler#strokeHandler
 ${replace('gestureMode','const quickSwitch =','if (root.cnPaired) return 0; const quickSwitch =')}
 ${replace('onStrokeCompleted','completedStroke();','if (!root.cnProbeReceive || !root.cnProbeReceive(stroke,controller,strokeHandler)) return; completedStroke();')}
 END TRAVERSE
 REDEFINE ScenePenInputHandler#strokeHandler
 LOCATE BEFORE ALL
 INSERT STREAM / Component { id: cnStrokeHandlerComponent /
 LOCATE AFTER ALL
 INSERT STREAM / } /
 END REDEFINE
`);
    q += `AFFECT /qml/device/view/documentview/DeviceSceneView.qml
 REBUILD FocusScope#root
 LOCATE BEFORE ALL
 REPLACE { readonly property alias strokeHandler: strokeHandler } WITH { property ScenePenInputHandler strokeHandler: null }
 LOCATE BEFORE ALL
 REPLACE { value: strokeHandler } WITH { value: root.cnHandlerDetached ? null : strokeHandler }
 LOCATE BEFORE ALL
 REPLACE { const stillSelecting = strokeHandler.lineTool } WITH { const stillSelecting = strokeHandler && strokeHandler.lineTool }
 LOCATE BEFORE ALL
 REPLACE { strokeHandler.setSelectionActive } WITH { strokeHandler?.setSelectionActive }
 LOCATE BEFORE ALL
 REPLACE { if (strokeHandler.timeSincePenUp() < 100) } WITH { if (!strokeHandler || strokeHandler.timeSincePenUp() < 100) }
 END REBUILD
END AFFECT
`;
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert('property var cnProbeReceive: null'));
    q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 TRAVERSE DeviceSceneView#sceneView
 ${insert('cnProbeReceive: function(stroke, targetController, inputHandler) { return !!root.cnHost && root.cnHost.probeBeforeSubmit(root, stroke, targetController, inputHandler) }')}
 END TRAVERSE
`);
}
fs.mkdirSync(output,{recursive:true});
fs.mkdirSync('build/test-settings',{recursive:true});
fs.writeFileSync(output+'/companion-notebook.qmd',q);
let host=fs.readFileSync('native/NativeHost.qml','utf8');
if (retirementProbe) host = 'import Companion.Lifecycle 1.0 as Lifecycle\n'+host;
if (paneNavigation) host=host.replace(/}\s*$/, inc('input-geometry')+'\n}\n')
    .replace('if (!penDown) hideWhenUnavailable()', 'if (!penDown) { hideWhenUnavailable(); scheduleInputGeometry() }');
if (diagnostic) {
    let driver=inc(visualProbe ? 'visual-reopen' : retirementProbe ? 'retirement-probe' : inkProbe ? 'ink-probe' : noCaptureProbe ? 'structural-probe' : 'render-probe');
    if (geometryProbe) driver=driver
        .replace('property int probePhase: 0', 'property int probePhase: 0\nproperty bool probeInputRefreshed: false')
        .replace('case 5:', 'case 5:\n                if (!bridge.viewReady(bridge.primary) || !bridge.viewReady(host.secondary)) return')
        .replace('console.log("Companion probe: observation window;', `if (!bridge.primary.cnProbePaneGeometry() || !host.secondary.cnProbePaneGeometry())
                    throw new Error("Native exposed-pane geometry failed")
                console.log("Companion probe: observation window;`)
        .replace('case 6:', `case 6:
                if (!host.probeInputRefreshed) {
                    if (!bridge.viewReady(bridge.primary) || !bridge.viewReady(host.secondary) || host.inputGeometryPending) return
                    var views = [bridge.primary, host.secondary]
                    for (var k = 0; k < views.length; ++k) {
                        var reason = views[k].cnInputGeometryReadiness()
                        if (reason === "loading") return
                        if (reason !== "ready" || !views[k].cnUpdateInputGeometry())
                            throw new Error("Input refresh refused pane=" + k + "; reason=" + reason)
                    }
                    host.probeInputRefreshed = true
                    console.log("Companion probe: both native input transforms refreshed after loading")
                }`)
        .replace('structural sequence and return completed', 'geometry sequence and return completed');
    host=host.replace('property bool renderProbeOnly: false','property bool renderProbeOnly: true')
        .replace(/}\s*$/, driver+'\n}\n');
}
if (inkProbe) {
    host = host.replace('function synchronizePrimary() {','function synchronizePrimary() {\n        if (probeDocumentLocked) { probeFail("primary changed after lock"); return }')
        .replace('function hideWhenUnavailable() {','function hideWhenUnavailable() {\n        if (probeDocumentLocked) { if (!mayShow) probeFail("screen unavailable"); return }')
        .replace('if (!penDown) { hideWhenUnavailable(); scheduleInputGeometry() }','if (!penDown && !probeDocumentLocked) { hideWhenUnavailable(); scheduleInputGeometry() }')
        .replace('function scheduleInputGeometry() {','function scheduleInputGeometry() {\n    if (probeDocumentLocked) return')
        .replace('visible: !host.inkQualified || host.restoring','visible: host.restoring');
    for (const signature of ['selectPane(secondaryPane)', 'tuck()', 'openSecondary()', 'pick(id)', 'beginDrag(y)'])
        host = host.replace('function '+signature+' {', 'function '+signature+' {\n        if (probeDocumentLocked) return false');
    host = host.replace('function closeSecondary(detach) {', 'function closeSecondary(detach) {\n        if (probeDocumentLocked) return');
}
if (noCaptureProbe) {
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
console.log(inkProbe ? 'Disposable-only fixed-layout ink diagnostic built. Not deployed; ordinary document ink remains disabled.'
    : 'Native rendering candidate built, pen disabled. Not deployed.');
