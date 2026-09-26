// Opt-in corner UI integration; ordinary pilot UI does not gain these controls.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const inc = name => fs.readFileSync(`native/${name}.qml.inc`, 'utf8');
function once(source, before, after) {
    assert.equal(source.split(before).length, 2, `Quick Pad anchor drift: ${before}`);
    return source.replace(before, () => after);
}
export function quickPadHost(host) {
    const changes = [
        ['Core.Settings { id: settings;', 'Core.Settings { id: quickPadSettings; location: host.settingsLocation; category: "quickPad"; property string quickPadJson: \'{"version":1,"document":"","corner":"right"}\' }\n    Core.Settings { id: settings;'],
        ['loadStore(); synchronizePrimary()', 'loadStore(); loadQuickPad(); synchronizePrimary()'],
        ['primaryId = id', 'quickPadCompositing = false\n        primaryId = id'],
        ['transitionBefore = transitionSnapshot()\n    transitionIntent', 'quickPadTransition = cornerPaneActive || name === "corner-layout" || name.indexOf("quick-pad") === 0\n    transitionBefore = transitionSnapshot()\n    transitionIntent'],
        ['bridge.endAnimation()\n    console.log', 'if (!quickPadTransition) bridge.endAnimation()\n    quickPadTransition = false\n    console.log'],
        ['height: parent.height - 395 * host.unit', 'height: parent.height - (host.quickPadChoosing ? 620 : 395) * host.unit'],
        ['function checkpoint() {', 'function checkpoint() {\n        if (quickPadActive || quickPadCached) return'],
        ['function closeSecondaryParked(detach) {', 'function closeSecondaryParked(detach) {\n        if (quickPadActive || quickPadCached) detach = false'],
        ['function openSecondaryParked() {', 'function openSecondaryParked() {\n        if (quickPadCached) closeSecondaryParked(false)'],
        ['function choose() {', 'function choose() {\n        quickPadChoosing = false'],
        ['function pick(id) {', 'function pick(id) {\n        if (quickPadChoosing) return pickQuickPad(id)'],
        ['closing = false\n    }', 'restoreAfterQuickPad()\n        closing = false\n    }'],
        ['function tuck() {', 'function tuck() {\n        if (quickPadActive) return closeQuickPad()'],
        ['function chooseSize(ratio) {', 'function chooseSize(ratio) {\n        if (quickPadActive) return false'],
        ['function applyLayoutChoice(ratio) {', 'function applyLayoutChoice(ratio) {\n    if (quickPadCached) return requestTransition("quick-pad-discard", function() { closeSecondaryParked(false); layoutChoice(ratio) })\n    if (quickPadActive) return ratio === 0 ? closeQuickPad() : false'],
        ['paired ? height - revealHeight : height', 'quickPadActive ? height : paired ? height - revealHeight : height'],
        ['Math.max(0, revealHeight - barHeight)', 'Math.max(0, (quickPadActive ? quickPadHeight : revealHeight) - barHeight)'],
        ['height: host.height - host.barHeight; clip: true', 'height: parent.height - host.barHeight; clip: true'],
        ['p.position.y < host.height - host.revealHeight', '(host.quickPadActive ? (p.position.y < sheet.y || p.position.x < sheet.x || p.position.x >= sheet.x + sheet.width) : p.position.y < host.height - host.revealHeight)'],
        ['y: host.height - host.revealHeight; width: host.width; height: host.height',
         'objectName: "quickPadSheet"\n        x: host.quickPadActive ? host.quickPadX : 0\n        y: host.quickPadActive ? host.height - host.quickPadHeight : host.height - host.revealHeight\n        width: host.quickPadActive ? host.quickPadWidth : host.width\n        height: host.quickPadActive ? host.quickPadHeight : host.height'],
        ['Rectangle { id: grip; width: parent.width; height: host.barHeight; color: "#555" }',
         `Rectangle { id: grip; width: parent.width; height: host.quickPadActive ? 2 * host.unit : host.barHeight; color: "#555" }
        Rectangle { visible: host.quickPadActive; x: host.quickPadCorner === "right" ? 0 : parent.width - width; width: 2 * host.unit; height: parent.height; color: "#555" }`],
        ['visible: !host.inkQualified || host.restoring;', 'visible: !host.inkQualified || (host.restoring && !host.quickPadActive);'],
        ['text: host.error ? "Companion unavailable" : "Companion notebook"', 'text: host.error ? "Companion unavailable" : host.quickPadChoosing ? "Quick Pad" : "Companion notebook"'],
        ['text: host.error || "Choose a notebook or PDF to open alongside this one."', 'text: host.error || (host.quickPadChoosing ? "Choose a corner below, then tap a notebook. Opens its last page." : "Choose a notebook or PDF to open alongside this one.")'],
        ['(host.pickerTab === 0 ? bridge.documents : bridge.favorites) : []', '(host.quickPadChoosing ? host.quickPadDocuments() : host.pickerTab === 0 ? bridge.documents : bridge.favorites) : []'],
        ['modelData.id === host.companionId ? "✓" : "›"', 'modelData.id === (host.quickPadChoosing ? host.quickPadId : host.companionId) ? "✓" : "›"'],
        ['visible: !!host.companionId && !host.error', 'visible: !host.quickPadChoosing && !!host.companionId && !host.error'],
        ['text: host.pickerTab === 0 ? "No eligible recent documents.\\nOpen a portrait notebook, then return here." : "No eligible favorites.\\nFavorite a portrait notebook or PDF to find it here."',
         'text: host.quickPadChoosing ? "No eligible notebooks here.\\nOpen or favorite a different portrait notebook first." : host.pickerTab === 0 ? "No eligible recent documents.\\nOpen a portrait notebook, then return here." : "No eligible favorites.\\nFavorite a portrait notebook or PDF to find it here."'],
        ['if (!editOperationsReady(views)) return', 'if (!editOperationsReady(views)) return\n        if (!fitQuickPadIfNeeded()) return'],
    ];
    for (const [before, after] of changes) host = once(host, before, after);
    // A tucked pad retains geometry and tiles, but not visibility or pen input.
    host = host.replaceAll('host.quickPadActive ? host.quickPad', '(host.quickPadActive || host.quickPadCached) ? host.quickPad');
    host = host.replace('host.quickPadActive ? host.height - host.quickPadHeight', '(host.quickPadActive || host.quickPadCached) ? host.height - host.quickPadHeight');
    // Share corner geometry while keeping the two document-selection models separate.
    host = host.replaceAll('(host.quickPadActive || host.quickPadCached)', 'host.cornerPaneGeometry');
    host = host.replaceAll('host.quickPadActive ? host.quickPad', 'host.cornerPaneActive ? host.quickPad');
    host = host.replaceAll('visible: host.quickPadActive;', 'visible: host.cornerPaneActive;');
    host = once(host, 'quickPadActive ? height : paired', 'cornerPaneActive ? height : paired');
    host = once(host, 'quickPadActive ? quickPadHeight : revealHeight', 'cornerPaneActive ? quickPadHeight : revealHeight');
    host = once(host, 'host.quickPadActive ? (p.position.y', 'host.cornerPaneActive ? (p.position.y');
    host = once(host, 'host.quickPadActive ? 2 * host.unit', 'host.cornerPaneActive ? 2 * host.unit');
    host = once(host, '(host.restoring && !host.quickPadActive)', '(host.restoring && !host.cornerPaneActive)');
    host = once(host, 'String(secondary.currentPageId || ""))', 'String(secondary.currentPageId || ""), companionLayout)');
    host = once(host, 'var p = pairs.pairs[id]', 'var p = pairs.pairs[id]\n        companionLayout = p && p.layout === "corner" ? "corner" : "split"');
    host = once(host, 'companionId = id; choosing = false; rememberReversePair()', 'companionId = id; choosing = false;\n            if (pickerLayout === 2) companionLayout = "corner"\n            else if (pickerLayout >= 0 && pickerLayout < 1) companionLayout = "split"\n            rememberReversePair()');
    host = once(host, 'if (quickPadCached) closeSecondaryParked(false)\n', 'if (quickPadCached) closeSecondaryParked(false)\n        quickPadFitPending = companionLayout === "corner"\n        if (quickPadFitPending) quickPadCompositing = true\n');
    host = once(host, 'host.savedRatio = requestedRatio', 'host.companionLayout = "split"\n            host.quickPadFitPending = false\n            host.savedRatio = requestedRatio');
    host = once(host, '[0, 0.25, 0.375, 0.5, 1].indexOf(ratio)', '[0, 0.25, 0.375, 0.5, 1, 2].indexOf(ratio)');
    host = once(host, 'function applyLayoutChoice(ratio) {', 'function applyLayoutChoice(ratio) {\n    if (ratio === 2) return chooseCompanionCorner()');
    host = once(host, 'savedRatio = ratio\n    return openSecondary()', 'companionLayout = "split"\n    savedRatio = ratio\n    return openSecondary()');
    host = once(host, 'function dismissChooser() {', 'function dismissChooser() {\n        pickerLayout = -1');
    host = host.replace(/}\s*$/, `
    Column {
        parent: pickerCard
        visible: host.quickPadChoosing && !host.error
        x: 48 * host.unit; y: parent.height - 315 * host.unit; width: parent.width - 96 * host.unit; spacing: 16 * host.unit
        Row {
            width: parent.width; spacing: 12 * host.unit
            Repeater {
                model: ["compact", "wide", "roomy"]
                Rectangle {
                    required property string modelData
                    width: (pickerCard.width - 120 * host.unit) / 3; height: 80 * host.unit
                    radius: 8 * host.unit; color: host.quickPadDraftSize === modelData ? "#222" : "#eee"
                    Text { anchors.centerIn: parent; text: parent.modelData === "compact" ? "Compact" : parent.modelData === "wide" ? "Wide" : "Roomy"; color: host.quickPadDraftSize === parent.modelData ? "white" : "black"; font.pixelSize: 27 * host.unit }
                    MouseArea { anchors.fill: parent; onClicked: host.setQuickPadSize(parent.modelData) }
                }
            }
        }
        Row {
        width: parent.width; spacing: 28 * host.unit
        Repeater {
            model: ["left", "right"]
            Rectangle {
                required property string modelData
                width: (pickerCard.width - 124 * host.unit) / 2; height: 65 * host.unit
                radius: 10 * host.unit; color: host.quickPadDraftCorner === modelData ? "#222" : "#eee"
                Text { anchors.centerIn: parent; text: parent.modelData === "left" ? "Bottom left" : "Bottom right"; color: host.quickPadDraftCorner === parent.modelData ? "white" : "black"; font.pixelSize: 26 * host.unit }
                MouseArea { anchors.fill: parent; onClicked: host.setQuickPadCorner(parent.modelData) }
            }
        }
        }
        Rectangle {
            objectName: "quickPadApplySettings"
            visible: !!host.quickPadId && bridge.canOpenPad(host.quickPadId) && host.quickPadId !== host.primaryId
            width: parent.width; height: 80 * host.unit; radius: 8 * host.unit; color: "white"; border.color: "#555"; border.width: host.unit
            Text { anchors.centerIn: parent; text: "Apply to current pad"; font.pixelSize: 27 * host.unit }
            MouseArea { anchors.fill: parent; onClicked: host.pickQuickPad(host.quickPadId) }
        }
    }
${inc('quick-pad')}
${inc('corner-companion')}
}\n`);
    host = once(host, 'quickPadChoosing = true; choosing = true', 'quickPadDraftCorner = quickPadCorner; quickPadDraftSize = quickPadSize\n        quickPadChoosing = true; choosing = true');
    return host;
}
export function quickPadQmd(q, {affect, insert}) {
    q = once(q, 'sizeIndex < 5', 'sizeIndex < 6');
    q = once(q, '[0, 0.25, 0.375, 0.5, 1][sizeIndex]', '[0, 0.25, 0.375, 0.5, 2, 1][sizeIndex]');
    q = once(q, 'cnHost && cnHost.paired ? cnHost.savedRatio : 0', 'cnHost && cnHost.paired ? (cnHost.cornerPaneActive ? 2 : cnHost.savedRatio) : 0');
    q = once(q, 'model: 5', 'model: 6');
    q = once(q, '[0, 0.25, 0.375, 0.5, 1][index]', '[0, 0.25, 0.375, 0.5, 2, 1][index]');
    q = once(q, 'anchors.left: parent.left; anchors.right: parent.right', 'anchors.left: modelData === 2 ? undefined : parent.left; anchors.right: parent.right\n                    width: (parent.width - 6) * 2 / 3');
    q = once(q, '(modelData === 0 ? 1 : modelData); color:', '(modelData === 0 ? 1 : modelData === 2 ? 1 / 3 : modelData); color:');
    // Preserve the stock visibility expression, with a corner-only outer gate.
    q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',`
TRAVERSE Item > ZoomButton#zoomButton
REBUILD visible
LOCATE BEFORE ALL
INSERT { !(root.cnSecondary && root.cnHost && root.cnHost.cornerPaneActive) && ( }
LOCATE AFTER ALL
INSERT { ) }
END REBUILD
END TRAVERSE
`);
    q += affect('qt/qml/xofm/libs/toolbar/qml/Toolbar.qml','FocusScope#root',insert(`
function cnPublishToolbarCapacity() {
    if (cnDocumentViewOwner && cnDocumentViewOwner.cnSecondary) return
    Qt.callLater(function() {
        if (!root.cnDocumentViewOwner || !root.cnDocumentViewOwner.cnSecondary)
            root.toolbarProvider.updateToolbarTools(root.showableToolsCount)
    })
}
onCnDocumentViewOwnerChanged: cnPublishToolbarCapacity()
`)+`
REBUILD onShowableToolsCountChanged
LOCATE BEFORE ALL
REPLACE { Qt.callLater(() => toolbarProvider.updateToolbarTools(showableToolsCount)); } WITH { cnPublishToolbarCapacity(); }
END REBUILD
`);
    q = once(q, 'value: root.cnPaired ? null : EPFramebuffer', 'value: (root.cnPaired || root.cnQuickPadCompositing) ? null : EPFramebuffer');
    q = once(q, 'INSERT { !root.cnPaired && }', 'INSERT { !(root.cnPaired || root.cnQuickPadCompositing) && }');
    q = once(q, 'bounds.y + bounds.height - visibleHeight)', 'bounds.y + bounds.height - visibleHeight * (cnQuickPad && notePage ? 0.2 : 1))');
    q = once(q, 'if (cnHost?.secondary) cnHost.secondary.cnRefresh()', 'if (cnHost?.secondary && !cnHost.quickPadActive) cnHost.secondary.cnRefresh()');
    // Reuse Companion's native surfaces and manager occlusion. The actual
    // viewport is corner-sized; no QML scale sits above the pen transform.
    q += affect('qml/common/Values.qml','Item',insert('signal cnQuickPadRequested()\nsignal cnQuickPadSettingsRequested()\nproperty bool cnQuickPadActive: false'));
    q += affect('qml/device/view/main/MainView.qml','Background#root',insert(`
Connections {
    target: Values
    function onCnQuickPadRequested() { if (cnHost) cnHost.toggleQuickPad() }
    function onCnQuickPadSettingsRequested() { if (cnHost) cnHost.configureQuickPad() }
}
Binding { target: Values; property: "cnQuickPadActive"; value: !!cnHost && cnHost.quickPadActive }`)+`
TRAVERSE Item#cnBridge
${insert(`function canOpenPad(id) { return canOpen(id) && Library.entryForId(id).fileType === Document.Notebook }
function padViewIsCurrent(view, id) {
    var entry = Library.entryForId(id)
    return !!entry && !!view.document && String(view.document.id) === id
        && String(view.currentPageId) === String(entry.idForPage(entry.pageCount - 1))
}
function openPadView(view, id) {
    if (!canOpenPad(id)) throw new Error("Quick Pad notebook unavailable")
    var entry = Library.entryForId(id)
    view.openDocumentOnPage(entry, entry.pageCount - 1)
}`)}
END TRAVERSE
`);
    q += affect('qml/device/view/documentview/DocumentView.qml','FocusScope#root',insert(`
function cnFitQuickPad() {
    if (!cnSecondary || !cnHost || !cnHost.quickPadActive || !cnHost.transitionOwnsPark() || !cnHost.inputGeometryPending) return false
    return sceneView.cnFitQuickPad()
}`)+`
TRAVERSE DeviceSceneView#sceneView
${insert('cnQuickPad: root.cnSecondary && !!root.cnHost && root.cnHost.cornerPaneActive\ncnQuickPadCompositing: !!root.cnHost && root.cnHost.quickPadCompositing')}
END TRAVERSE
`);
    q += affect('qml/device/view/documentview/Navigation.qml','Item#root',insert('property bool cnQuickPad: false'));
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert('property bool cnQuickPad: false\nproperty bool cnQuickPadCompositing: false')+`
TRAVERSE Navigation#sceneNavigation
${insert('cnQuickPad: root.cnQuickPad')}
END TRAVERSE
`);
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(inc('quick-pad-fit')));
    q += affect('qt/qml/xofm/libs/toolbar/qml/Toolbar.qml','FocusScope#root',`
TRAVERSE Item#toolbar > GridLayout#toolLayout
LOCATE BEFORE ToolbarTool#cnCompanionButton
INSERT { ToolbarTool {
    id: cnQuickPadButton
    toolbar: root; type: ToolbarTool.Type.ToolbarButton
    property bool _isExtensionButton: true
    label: "Quick Pad"
    implicitlySelected: Values.cnQuickPadActive
    visible: shouldShow && root.expanded
    shouldShow: root.documentType === "note" || root.documentType === "pdf"
    onPressed: { Values.cnQuickPadRequested(); root.closeFoldout() }
    iconSource: "qrc:/ark/icons/formatting_checkbox"
} }
END TRAVERSE
`,' IMPORT common 1.0');
    q += affect('qt/qml/xofm/libs/toolbar/qml/SettingsMenu.qml','ToolbarTool#root',`
TRAVERSE Component#settingsComponent > ColumnLayout#content
TRAVERSE RowLayout#cnLayoutControls
${insert('enabled: !Values.cnQuickPadActive\nopacity: enabled ? 1 : 0.35')}
END TRAVERSE
${insert(`ToolbarTool {
    toolbar: root.toolbar; type: ToolbarTool.Type.FoldoutButton
    Layout.fillWidth: true; label: "Quick Pad settings"
    iconSource: "qrc:/ark/icons/notebook"
    visible: root.documentType === "note" || root.documentType === "pdf"; shouldShow: visible
    onPressed: { root.toolbar.closeFoldout(); Values.cnQuickPadSettingsRequested() }
}`)}
END TRAVERSE
`,' IMPORT common 1.0');
    return q;
}
