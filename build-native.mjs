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
const admissionProbe = process.env.CN_PROBE === 'admission';
const visualProbe = process.env.CN_PROBE === 'visual';
const lifecycleProbe = process.env.CN_PROBE === 'lifecycle';
const ordinaryProbe = process.env.CN_ORDINARY_PROBE === '1' || lifecycleProbe;
const inkProbe = process.env.CN_PROBE === 'ink' || retirementProbe || admissionProbe;
const noCaptureProbe = structuralProbe || geometryProbe || inkProbe || visualProbe;
const diagnostic = renderProbe || noCaptureProbe;
// Preserve the previously reviewed diagnostic bytes. This new navigation
// candidate is local-only until it receives a separately scoped native trial.
const paneNavigation = !diagnostic || geometryProbe || inkProbe;
assert(!process.env.CN_PROBE || diagnostic || lifecycleProbe, 'Unknown probe profile');
assert(!ordinaryProbe || !diagnostic, 'Ordinary lifecycle probe is separate from historical profiles');
const output = lifecycleProbe ? 'build/lifecycle-native' : ordinaryProbe ? 'build/ordinary-native' : diagnostic ? `build/${process.env.CN_PROBE}-native` : 'build/native';
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
q += affect('qml/common/Values.qml','Item',insert('signal cnChooseRequested()' + (diagnostic || ordinaryProbe ? '\nproperty bool cnProbeStarted: false' : '')));
let probeBridge = diagnostic || ordinaryProbe ? inc('probe-bridge') : '';
if (noCaptureProbe || ordinaryProbe) {
    const start = probeBridge.indexOf('function probeCapture(host) {');
    const end = probeBridge.indexOf('function probeRestore(host) {');
    assert(start > 0 && end > start, 'Capture removal anchors drifted');
    probeBridge = (probeBridge.slice(0, start) + probeBridge.slice(end))
        .replace('property bool probeCaptureDone: false\n', '')
        .replace('property bool probeCaptureSaved: false\n', '')
        .replaceAll('cnProbeCaptureItem', 'cnProbeScene');
    assert(!/probeCapture|grabToImage|saveToFile/.test(probeBridge));
}
if (ordinaryProbe) probeBridge = probeBridge.slice(0, probeBridge.indexOf('function probeRestore(host) {'))
    .replace('property var probeOriginal: null\n', '')
    .replace('    probeOriginal = primary && primary.document ? {id:String(primary.document.id), page:primary.currentPage} : null\n', '');
if (visualProbe) {
    const start=probeBridge.indexOf('function probeCreate() {');
    const end=probeBridge.indexOf('function probeSeparate(host) {');
    assert(start>0 && end>start);
    probeBridge=probeBridge.slice(0,start)+inc('visual-open')+probeBridge.slice(end);
    assert(!probeBridge.includes('createDocument('));
}
let main = inc('main').replace('// PROBE_BRIDGE', probeBridge);
if (!diagnostic) {
    const portrait = 'readonly property bool portrait: root.orientation.isPortraitOrientation';
    assert.equal(main.split(portrait).length, 2, 'Input visibility anchor drift');
    // Effective Item visibility includes the deep-sleep ancestor. Stock input
    // can resume in landscape; historical diagnostic bytes stay unchanged.
    main = main.replace(portrait, portrait + '\n    readonly property bool inputAvailable: available && !!primary && primary.visible');
}
if (!diagnostic) main = main.replace('cnHost.closeSecondary(false); cnHost.error = "The companion could not load."',
    'cnHost.transitionFail("native document failed to load")');
q += affect('qml/device/view/main/MainView.qml','Background#root',insert((diagnostic && !inkProbe ? 'enabled: false\n' : '') + main) + `
 TRAVERSE FocusScope#rootItem > FocusScope#viewRoot
 LOCATE AFTER Loader#documentView
 INSERT {
   ${diagnostic || ordinaryProbe ? `Rectangle {
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
`, ' IMPORT xofm.libs.epaper 1.0 CnEpaper' + (diagnostic || ordinaryProbe ? '\n IMPORT xofm.libs.devicescreen 1.0' : ''));
if (inkProbe || ordinaryProbe) q += affect('qml/device/view/main/MainView.qml','Background#root',`
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
if (!diagnostic) {
    const undoAction = 'case "Undo": sceneController.undo(); break';
    assert.equal(document.split(undoAction).length, 2, 'Native bar Undo anchor drift');
    document = document.replace('if (!cnHost || !cnHost.idle || !cnHost.inkQualified || !cnSelected || !document) return',
        'if (!cnHost || !cnHost.transitionApplying || !cnHost.transitionOwnsPark() || !cnHost.inkQualified || !cnSelected || !document) return')
        .replace(undoAction, undoAction + '\n    case "Redo": sceneController.redo(); break');
    document = document.replace(/readonly property bool cnInkAllowed:[^\n]+/,
        'readonly property bool cnInkAllowed: (!cnHost || !cnHost.inputGeometryPending) && ((!cnPaired && !cnSecondary) || (!!cnHost && cnHost.inkQualified && cnPaired))');
    const start = document.indexOf('function cnNativeClose() {');
    const end = document.indexOf('function cnRefresh() {');
    assert(start > 0 && end > start);
    document = document.slice(0,start) + `function cnNativeClose() {
    if (!cnHost || !cnHost.transitionApplying || !cnHost.transitionOwnsPark()) throw new Error("close outside native park")
    cnStockClose()
}
function close() {
    if (cnSecondary && cnHost) return cnHost.closeSecondary(false)
    if (cnHost) return cnHost.nativeOperation(root, function() { root.cnStockClose() })
    cnStockClose()
}
` + document.slice(end);
    document += `
function cnAdmissionInputsDetached() { return sceneView.cnAdmissionInputsDetached() }
function cnAdmissionConstrainToPane() { return sceneView.cnAdmissionConstrainToPane() }
function cnPageGuarded() { return !!cnHost && (!!cnHost.secondary || (cnHost.transitionBusy && cnHost.transitionPhase !== "cold")) }
function cnEditGuarded() { return cnPageGuarded() && !cnHost.pageMayMutate(root) }
function cnEdit(operation) {
    if (cnEditGuarded()) return cnHost.editOperation(root, operation)
    operation()
    return true
}
function cnNormalizeTools() {
    if (!cnHost || !cnHost.pageMayMutate(root)) throw new Error("tool normalization outside native park")
    const pen = toolbar.selectedPen
    if (pen && typeof pen.ensureSelection === "function") pen.ensureSelection()
}
`;
}
if (ordinaryProbe) {
    document = document.replace('readonly property bool cnInkAllowed: ', 'readonly property bool cnInkAllowed: !!cnHost && cnHost.probeAllows(root) && ');
    document += `
readonly property var cnProbeScene: sceneView.sceneView
readonly property var cnProbeViewport: sceneView.viewport
function cnProbePreparePen() {
    if (!cnHost || !cnHost.ordinaryProbe || cnHost.probeDocumentLocked || !cnHost.bridge.probeSeparate(cnHost)) return false
    toolbar.selectPen("primary")
    return documentViewTools.isWritingTool(documentViewTools.activePen.tool)
}
function cnProbeExpectedBounds(i) {
    var a = i === 0 ? Qt.point(550,450) : Qt.point(700,1500)
    var b = i === 0 ? Qt.point(850,500) : Qt.point(1000,1570)
    if (cnHost.probeRound === 2) { a = Qt.point(a.x,a.y+200); b = Qt.point(b.x,b.y+200) }
    a = sceneView.tileManager.viewToScene(sceneView.mapFromItem(null,a.x,a.y))
    b = sceneView.tileManager.viewToScene(sceneView.mapFromItem(null,b.x,b.y))
    return Qt.rect(a.x,a.y,b.x-a.x,b.y-a.y)
}
`;
}
if (lifecycleProbe) document += `
function cnProbeState() {
    return {page: String(root.currentPageId), index: root.currentPage,
        pages: root.document.pageCount, undo: !!sceneController.undoAvailable,
        redo: !!sceneController.redoAvailable, tool: String(documentViewTools.activeTool),
        writing: documentViewTools.isWritingTool(documentViewTools.activePen.tool)}
}
function cnProbeHistory(action) {
    if (action === "undo") toolbar.undoSelected()
    else if (action === "redo") toolbar.redoSelected()
    else throw new Error("unknown history test action")
}
function cnProbePage(index) { root.openPage(index) }
function cnProbeAdd() { root.addPage(root.document) }
function cnProbeClose() { root.close() }
`;
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
    if (admissionProbe) {
        document = document.replace('a = sceneView.tileManager.viewToScene(',
            'if (cnHost.probeRound === 2) { a = Qt.point(a.x,a.y+200); b = Qt.point(b.x,b.y+200) }\n    a = sceneView.tileManager.viewToScene(');
        document += '\nfunction cnAdmissionInputsDetached() { return sceneView.cnAdmissionInputsDetached() }\n';
        document += '\nfunction cnAdmissionConstrainToPane() { return sceneView.cnAdmissionConstrainToPane() }\n';
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
 ${insert('cnPaired: root.cnPaired; cnSelected: root.cnSelected; cnInkAllowed: root.cnInkAllowed; cnInputHeight: root.cnInputHeight; cnLayoutBusy: ' + (inkProbe ? '!!root.cnHost && (!root.cnHost.probeWriting || root.cnHost.inputGeometryPending)' : diagnostic ? 'true' : '!!root.cnHost && root.cnHost.inputGeometryPending') + (!diagnostic ? '; cnAdmissionLocked: !!root.cnHost && root.cnHost.transitionBusy' : ''))}
 END TRAVERSE
 TRAVERSE DocumentToolSettings#documentViewTools
 ${replace('onDocumentAboutToChange','Settings.setLastWritingTool(toolSettings());','if (root.cnOwnsGlobals) Settings.setLastWritingTool(toolSettings());')}
 END TRAVERSE
 TRAVERSE Item#_uiContainer > Toolbar#toolbar
 ${replace('visible','!inSuspend','!root.cnSecondary && root.cnSelected && !inSuspend')}
 END TRAVERSE
`);
if (!diagnostic) {
q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 REBUILD _open_helper
 LOCATE BEFORE ALL
 INSERT {
    // First statement: preserve BetterTOC's stock anchors in every load order.
    if (cnHost && !cnHost.transitionApplying && (cnHost.secondary || (cnHost.transitionBusy && cnHost.transitionPhase !== "cold"))) {
        cnHost.nativeOperation(root, function() { root._open_helper(documentToOpen, pageToOpen, highlightDetails); });
        return;
    }
 }
 END REBUILD
`);
for (const [name,args] of [['openPage','page, position'],['addPage','document, pageIndex']]) {
    q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 REBUILD ${name}
 LOCATE BEFORE ALL
 INSERT {
    if (root.cnPageGuarded() && !cnHost.pageMayMutate(root))
        return cnHost.pageOperation(root, function() { root.${name}(${args}); });
 }
 END REBUILD
`);
}
q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 ${replace('addPage','root.addingPage = true;', `
const cnAddGuarded = root.cnPageGuarded();
const cnAddHost = cnAddGuarded ? root.cnHost : null;
if (cnAddGuarded && document !== root.document) { cnAddHost.transitionFail("foreign page addition"); return; }
const cnAddToken = cnAddGuarded ? cnAddHost.pageAddBegin(root, newPage) : null;
if (cnAddGuarded && !cnAddToken) return;
root.addingPage = true;`)}
 ${replace('addPage','root.addingPage = false;\n            root.openPage(newPage);', `
if (cnAddGuarded) {
    if (cnAddHost) cnAddHost.pageAddComplete(cnAddToken, function(index, pageId) {
        root.addingPage = false;
        root.openPage(index);
    });
    return;
}
root.addingPage = false;
root.openPage(newPage);`)}
 TRAVERSE DeviceSceneView#sceneView
 ${insert('cnDocumentViewOwner: root')}
 END TRAVERSE
`);
q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert('property var cnDocumentViewOwner: null') + `
 REBUILD goToPageId
 LOCATE BEFORE ALL
 INSERT {
    if (cnDocumentViewOwner && cnDocumentViewOwner.cnPageGuarded()
            && !cnDocumentViewOwner.cnHost.pageMayMutate(cnDocumentViewOwner))
        return cnDocumentViewOwner.cnHost.pageOperation(cnDocumentViewOwner, function() { root.goToPageId(pageId); });
 }
 END REBUILD
`);
q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 TRAVERSE DocumentViewShortcuts
 REMOVE onUndoRequested
 REMOVE onRedoRequested
 ${insert('onUndoRequested: root.cnEdit(function() { root.sceneController.undo(); }); onRedoRequested: root.cnEdit(function() { root.sceneController.redo(); })')}
 END TRAVERSE
 TRAVERSE Item#_uiContainer > Toolbar#toolbar
 ${insert('cnDocumentViewOwner: root')}
 ${replace('onSelectedPenChanged','documentViewTools.activeTool = selectedPen.penToolType;\n                root.exitTextMode(false);', `
const cnSelectedPen = selectedPen;
root.cnEdit(function() {
    if (toolbar.selectedPen !== cnSelectedPen) throw new Error("selected native pen changed before edit");
    documentViewTools.activeTool = cnSelectedPen.penToolType;
    root.exitTextMode(false);
});`)}
 END TRAVERSE
`);
for (const [signal,args,anchor] of [
        ['penToolSelected','tool','if (!documentViewTools.isWritingTool(documentViewTools.activePen.tool))'],
        ['penColorSelected','rgb, paletteEnum','if (!documentViewTools.isWritingTool(documentViewTools.activePen.tool))'],
        ['penThicknessSelected','thickness','if (!documentViewTools.isWritingTool(documentViewTools.activePen.tool))'],
        ['highlighterSnapToTextSelected','snap','if (!documentViewTools.isWritingTool(documentViewTools.activePen.tool))'],
        ['eraserToolSelected','tool','documentViewTools.eraserPen.tool = tool;'],
        ['eraserThicknessSelected','t','documentViewTools.eraserPen.thickness = t;'],
        ['eraseAllSelected','','closeFoldout();'],
        ['selectionToolModeSelected','mode','root.selectionToolMode = mode;'],
        ['undoSelected','','sceneController.undo();'],['redoSelected','','sceneController.redo();']]) {
    const handler='on'+signal[0].toUpperCase()+signal.slice(1);
    q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 TRAVERSE Item#_uiContainer > Toolbar#toolbar
 ${replace(handler,anchor,`if (root.cnEditGuarded()) return root.cnHost.editOperation(root, function() { toolbar.${signal}(${args}); });\n`+anchor)}
 END TRAVERSE
`);
}
q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 TRAVERSE DeviceSceneView#sceneView
 ${replace('onToolPicked','if (tool === Line.SelectionTool)', 'if (root.cnEditGuarded()) return root.cnHost.editOperation(root, function() { sceneView.toolPicked(tool, color, colorCode, width); });\nif (tool === Line.SelectionTool)')}
 END TRAVERSE
`);
q += affect('qt/qml/xofm/libs/toolbar/qml/Toolbar.qml','FocusScope#root',insert('property var cnDocumentViewOwner: null') + `
 ${replace('onRequestPenSelect','if (!(penTool instanceof PenTool))', `
if (cnDocumentViewOwner && cnDocumentViewOwner.cnEditGuarded())
    return cnDocumentViewOwner.cnHost.editOperation(cnDocumentViewOwner, function() { root.requestPenSelect(penTool, mode); });
if (!(penTool instanceof PenTool))`)}
`);
// A requestPenSelect signal is not the entire native tap. Its caller keeps
// executing, so park before the outer pressed group (including selectedPen,
// subsequent tool signals and analytics), not between two of those statements.
for (const type of ['WritingTool','EraserMenu','SelectionButton']) {
    q += affect(`qt/qml/xofm/libs/toolbar/qml/${type}.qml`,'PenTool#root',`
 ${replace('onPressed', type === 'EraserMenu' ? 'if(root.toolbar.selectedPen !== root)' : 'if (root.toolbar.selectedPen !== root)', `
const cnOwner = root.toolbar.cnDocumentViewOwner;
if (cnOwner && cnOwner.cnEditGuarded())
    return cnOwner.cnHost.editOperation(cnOwner, function() { root.pressed(); });
if (root.toolbar.selectedPen !== root)`)}
`);
}
q += affect('qt/qml/xofm/libs/toolbar/qml/SelectionButton.qml','PenTool#root',`
 ${replace('onSelectionToolModeSelected','root.selectedMode = mode;', `
const cnOwner = root.toolbar.cnDocumentViewOwner;
if (cnOwner && cnOwner.cnEditGuarded())
    return cnOwner.cnHost.editOperation(cnOwner, function() { root.selectionToolModeSelected(mode); });
root.selectedMode = mode;`)}
`);
q += affect('qt/qml/xofm/libs/toolbar/qml/WritingTool.qml','PenTool#root',`
 REBUILD ensureSelection
 LOCATE BEFORE ALL
 INSERT {
    const cnOwner = root.toolbar.cnDocumentViewOwner;
    if (cnOwner && cnOwner.cnPageGuarded()) {
        // An inactive pen must not normalize the current pen through the shared
        // toolbar signals. It is normalized when selected inside the next park.
        if (root.toolbar.selectedPen !== root) return;
        if (cnOwner.cnEditGuarded())
            return cnOwner.cnHost.editOperation(cnOwner, function() { root.ensureSelection(); });
    }
 }
 END REBUILD
`);
q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',`
 TRAVERSE Item > SceneViewGestures#sceneViewGestures
 ${insert('cnDocumentViewOwner: root.cnDocumentViewOwner')}
 END TRAVERSE
`);
q += affect('qml/device/view/documentview/SceneViewGestures.qml','TouchArea#touchArea',insert(`
property var cnDocumentViewOwner: null
function cnHistory(action) {
    const target = controller;
    if (cnDocumentViewOwner && cnDocumentViewOwner.cnPageGuarded())
        return cnDocumentViewOwner.cnHost.editOperation(cnDocumentViewOwner, function() {
            if (cnDocumentViewOwner.sceneController !== target) throw new Error("gesture history owner changed");
            target[action]();
        });
    target[action]();
}
`) + `
 TRAVERSE TouchAreaClickFilter#twoFingerTapFilter
 REMOVE onClick
 ${insert('onClick: touchArea.cnHistory("undo")')}
 END TRAVERSE
 TRAVERSE TouchAreaClickFilter#threeFingerTapFilter
 REMOVE onClick
 ${insert('onClick: touchArea.cnHistory("redo")')}
 END TRAVERSE
`);
}
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
 ${insert('cnPaired: root.cnPaired; cnLayoutBusy: root.cnLayoutBusy; anchors.bottomMargin: root.cnPaired ? Math.max(0, root.height - root.cnInputHeight) : 0' + (admissionProbe ? '; cnAdmissionLocked: root.cnProbeDocumentLocked' : !diagnostic ? '; cnAdmissionLocked: root.cnAdmissionLocked' : ''))}
 END TRAVERSE
 ${replace('availableSceneRect','root.height - root.keyboardMargin','(root.cnPaired ? root.cnInputHeight : root.height) - root.keyboardMargin')}
`);
    let navigation=inc('navigation');
    if (admissionProbe || !diagnostic) navigation='property bool cnAdmissionLocked: false\n'+navigation
        .replace('function cnConstrainToPane() {','function cnConstrainToPane(whileParked) {\n    if (cnAdmissionLocked && whileParked !== true) return')
        .replace('!cnPaired || cnLayoutBusy ||', '!cnPaired || (cnLayoutBusy && whileParked !== true) ||');
    q += affect('qml/device/view/documentview/Navigation.qml','Item#root',insert(navigation) + `
 ${replace('scrollDown','const nearestAlignment = function()','if (cnJump(-1)) return; const nearestAlignment = function()')}
 ${replace('scrollUp','const nearestAlignment = function()','if (cnJump(1)) return; const nearestAlignment = function()')}
 ${replace('updateDragAndZoom','updateScrollbars();','cnConstrainToPane(); updateScrollbars();')}
`);
}
if (!diagnostic) {
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(`
property bool cnAdmissionLocked: false
function cnAdmissionInputsDetached() { return inputSurface.handler === null }
function cnAdmissionConstrainToPane() {
    if (root.cnInkAllowed || !root.cnLayoutBusy || !root.cnAdmissionLocked) return false
    sceneNavigation.cnConstrainToPane(true)
    return true
}
`) + `
 TRAVERSE ScenePenInputHandler#strokeHandler
 ${replace('gestureMode','const quickSwitch =','if (root.cnPaired) return 0; const quickSwitch =')}
 END TRAVERSE
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
if (ordinaryProbe) {
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(`
property var cnProbeReceive: null
signal cnProbeSubmitted(var stroke)
`) + `
 TRAVERSE ScenePenInputHandler#strokeHandler
 ${replace('onStrokeCompleted','completedStroke();','if (!root.cnProbeReceive || !root.cnProbeReceive(stroke,controller,strokeHandler)) return; completedStroke();')}
 ${replace('onStrokeCompleted','controller.addDrawingLine(stroke);','controller.addDrawingLine(stroke); root.cnProbeSubmitted(stroke);')}
 END TRAVERSE
`);
    q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 TRAVERSE DeviceSceneView#sceneView
 ${insert('cnProbeReceive: function(stroke, targetController, inputHandler) { return !!root.cnHost && root.cnHost.probeBeforeSubmit(root, stroke, targetController, inputHandler) }; onCnProbeSubmitted: function(stroke) { if (root.cnHost) root.cnHost.probeSubmitted(root,stroke) }')}
 END TRAVERSE
`);
}
if (admissionProbe) {
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(`
property var cnProbeReceive: null
function cnAdmissionInputsDetached() { return inputSurface.handler === null }
function cnAdmissionConstrainToPane() {
    if (root.cnInkAllowed || !root.cnLayoutBusy || !root.cnProbeDocumentLocked) return false
    sceneNavigation.cnConstrainToPane(true)
    return true
}
`) + `
 TRAVERSE ScenePenInputHandler#strokeHandler
 ${replace('gestureMode','const quickSwitch =','if (root.cnPaired) return 0; const quickSwitch =')}
 ${replace('onStrokeCompleted','completedStroke();','if (!root.cnProbeReceive || !root.cnProbeReceive(stroke,controller,strokeHandler)) return; completedStroke();')}
 END TRAVERSE
`);
    q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
 TRAVERSE DeviceSceneView#sceneView
 ${insert('cnProbeReceive: function(stroke, targetController, inputHandler) { return !!root.cnHost && root.cnHost.probeBeforeSubmit(root, stroke, targetController, inputHandler) }')}
 END TRAVERSE
`);
}
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
// Keep consumed diagnostic receipts reproducible while the product UI evolves.
if (diagnostic) exact('native/DiagnosticHost.qml','7b76db63188dfc4065cf88301fb0591e0b2213e4483285061c9b08e9f10621e7');
let host=fs.readFileSync(diagnostic ? 'native/DiagnosticHost.qml' : 'native/NativeHost.qml','utf8');
if (retirementProbe) host = 'import Companion.Lifecycle 1.0 as Lifecycle\n'+host;
if (admissionProbe || !diagnostic) host = 'import Companion.Admission 1.0 as Admission\n'+host;
if (!diagnostic) host = host.replace(/}\s*$/, inc('transactions')+'\n'+inc('page-operations')+'\n'+inc('edit-operations')+'\n}\n');
if (ordinaryProbe) {
    const prior = inc('retirement-probe');
    const start=prior.indexOf('function probeBeforeSubmit('), end=prior.indexOf('function probePanesReady(');
    assert(start>0 && end>start);
    const receipts=prior.slice(start,end).replace('Companion retirement: received','Companion ordinary: received');
    let driver=inc('ordinary-probe').replace('// RECEIPT_FUNCTIONS',receipts);
    if (lifecycleProbe) {
        const replaceDriver=(before,after)=>{
            assert.equal(driver.split(before).length,2,'Lifecycle driver anchor drift: '+before);
            driver=driver.replace(before,()=>after);
        };
        replaceDriver('host.probeDocumentLocked && !host.probeIdentities()',
            'host.probeDocumentLocked && !host.probeLifecycleBusy && !host.probeIdentities()');
        replaceDriver('probeDocuments.length === 2 && bridge.probeSeparate(host)\n        && ((view',
            'probeDocuments.length === 2 && (bridge.probeSeparate(host) || probeSolePrimary(view))\n        && ((view');
        replaceDriver('if (!host.tuck()) throw new Error("ordinary tuck refused")',
            'if (!host.probeLifecycleDone && !host.probeLifecycleTick()) return\n                if (!host.tuck()) throw new Error("ordinary tuck refused")');
        replaceDriver('ordinary ink submissions completed; panes=2; strokes=4; durable=unverified',
            'lifecycle ink submissions completed; panes=2; strokes=4; durable=unverified');
        driver=inc('lifecycle-probe')+'\n'+driver;
    }
    host=host.replace('property bool inkQualified: false','property bool inkQualified: true')
        .replace(/}\s*$/,driver+'\n}\n');
}
if (paneNavigation && diagnostic) host=host.replace(/}\s*$/, inc('input-geometry')+'\n}\n')
    .replace('if (!penDown) hideWhenUnavailable()', 'if (!penDown) { hideWhenUnavailable(); scheduleInputGeometry() }');
if (diagnostic) {
    let driver=inc(admissionProbe ? 'admission-probe' : visualProbe ? 'visual-reopen' : retirementProbe ? 'retirement-probe' : inkProbe ? 'ink-probe' : noCaptureProbe ? 'structural-probe' : 'render-probe');
    if (admissionProbe) {
        const prior=inc('retirement-probe');
        const start=prior.indexOf('function probeBeforeSubmit('),end=prior.indexOf('function probePanesReady(');
        assert(start>0 && end>start);
        const receipts=prior.slice(start,end)
            .replace('(probePhase !== 4 && probePhase !== 10)', '(probePhase !== 4 && probePhase !== 5 && probePhase !== 10)')
            .replace('Companion retirement: received', 'Companion admission: received');
        driver=driver.replace('// RECEIPT_FUNCTIONS',receipts);
    }
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
if (noCaptureProbe || ordinaryProbe) {
    for (const content of [q, host])
        assert(!/grabToImage|grabWindow|probeCapture|saveToFile|ShaderEffect|layer\s*\./.test(content), 'Forbidden offscreen capture in structural profile');
}
fs.writeFileSync(output+'/NativeHost.qml',host);
fs.copyFileSync('src/PairStore.js',output+'/PairStore.js');
if (!diagnostic) {
    // The tablet's QtQuick build omits the Accessible attached type. Keep the
    // desktop accessibility metadata, but never deploy unsupported bindings.
    const ruler=fs.readFileSync('ui/SizeRuler.qml','utf8');
    assert.equal((ruler.match(/^\s*Accessible\.[^\n]*$/gm)||[]).length,4);
    fs.writeFileSync(output+'/SizeRuler.qml',ruler.replace(/^\s*Accessible\.[^\n]*\n/gm,''));
}
execFileSync(tool,['hash-diffs',path.join(firmware,'hashtab'),output+'/companion-notebook.qmd'],{stdio:'inherit'});
const result = execFileSync(tool,['check-compatibility',path.join(firmware,'hashtab'),output+'/companion-notebook.qmd'],{encoding:'utf8'});
assert.match(result,/No compatibility errors found\./);
process.stdout.write(result);
fs.writeFileSync(output+'/SHA256SUMS', ['NativeHost.qml','PairStore.js','companion-notebook.qmd',...(!diagnostic ? ['SizeRuler.qml'] : [])].map(p=>hash(output+'/'+p)+'  '+p+'\n').join(''));
console.log(inkProbe || ordinaryProbe ? 'Disposable-only native diagnostic built. Not deployed; ordinary document ink remains disabled.'
    : 'Native rendering candidate built, pen disabled. Not deployed.');
