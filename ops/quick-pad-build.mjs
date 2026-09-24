// Opt-in, local-only integration. The deployed pilot build stays byte-identical.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const inc = name => fs.readFileSync(`native/${name}.qml.inc`, 'utf8');
function once(source, before, after) {
    assert.equal(source.split(before).length, 2, `Quick Pad anchor drift: ${before}`);
    return source.replace(before, () => after);
}
export function quickPadHost(host) {
    const changes = [
        ['property string pairsJson:', 'property string quickPadJson: \'{"version":1,"document":"","corner":"right"}\'; property string pairsJson:'],
        ['loadStore(); synchronizePrimary()', 'loadStore(); loadQuickPad(); synchronizePrimary()'],
        ['function checkpoint() {', 'function checkpoint() {\n        if (quickPadActive) return'],
        ['function closeSecondaryParked(detach) {', 'function closeSecondaryParked(detach) {\n        if (quickPadActive) detach = false'],
        ['function choose() {', 'function choose() {\n        quickPadChoosing = false'],
        ['function pick(id) {', 'function pick(id) {\n        if (quickPadChoosing) return pickQuickPad(id)'],
        ['closing = false\n    }', 'restoreAfterQuickPad()\n        closing = false\n    }'],
        ['function tuck() {', 'function tuck() {\n        if (quickPadActive) return closeQuickPad()'],
        ['function chooseSize(ratio) {', 'function chooseSize(ratio) {\n        if (quickPadActive) return false'],
        ['function applyLayoutChoice(ratio) {', 'function applyLayoutChoice(ratio) {\n    if (quickPadActive) return ratio === 0 ? closeQuickPad() : false'],
        ['function selectPane(secondaryPane) {', 'function selectPane(secondaryPane) {\n        if (quickPadActive && !secondaryPane) return false'],
        ['paired ? height - revealHeight : height', 'quickPadActive ? height : paired ? height - revealHeight : height'],
        ['readonly property real barHeight: 2 * unit', 'readonly property real barHeight: (quickPadActive ? 92 : 2) * unit'],
        ['y: host.height - host.revealHeight; width: host.width; height: host.height',
         'objectName: "quickPadSheet"\n        x: host.quickPadActive ? host.quickPadX : 0\n        y: host.quickPadActive ? host.height * 0.5 - 36 * host.unit : host.height - host.revealHeight\n        scale: host.quickPadActive ? host.quickPadScale : 1\n        transformOrigin: Item.TopLeft\n        width: host.width; height: host.height'],
        ['Rectangle { id: grip; width: parent.width; height: host.barHeight; color: "#555" }',
         `Rectangle { id: grip; width: parent.width; height: host.quickPadActive ? 2 * host.unit : host.barHeight; color: "#555" }
        Rectangle { visible: host.quickPadActive; anchors.fill: parent; color: "transparent"; border.color: "#555"; border.width: 2 * host.unit }
        Row {
            visible: host.quickPadActive; height: host.barHeight; width: parent.width
            Text { width: parent.width - 260 * host.unit; height: parent.height; leftPadding: 26 * host.unit; verticalAlignment: Text.AlignVCenter; text: "Quick Pad · pen here"; font.pixelSize: 32 * host.unit }
            Item { objectName: "quickPadSettings"; width: 130 * host.unit; height: parent.height
                Text { anchors.centerIn: parent; text: "⋯"; font.pixelSize: 52 * host.unit }
                MouseArea { anchors.fill: parent; onClicked: host.configureQuickPad() }
            }
            Item { objectName: "quickPadClose"; width: 130 * host.unit; height: parent.height
                Text { anchors.centerIn: parent; text: "×"; font.pixelSize: 52 * host.unit }
                MouseArea { anchors.fill: parent; onClicked: host.closeQuickPad() }
            }
        }`],
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
    host = host.replace(/}\s*$/, `
    Row {
        parent: pickerCard
        visible: host.quickPadChoosing && !host.error
        x: 48 * host.unit; y: parent.height - 95 * host.unit; spacing: 28 * host.unit
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
${inc('quick-pad')}
}\n`);
    host = once(host, 'quickPadChoosing = true; choosing = true', 'quickPadDraftCorner = quickPadCorner\n        quickPadChoosing = true; choosing = true');
    return host;
}
export function quickPadQmd(q, {affect, insert}) {
    q = once(q, 'readonly property bool cnInkAllowed: (!cnHost', 'readonly property bool cnInkAllowed: (!cnHost || !cnHost.quickPadActive || cnSecondary) && (!cnHost');
    // Pen regions and blockers are empty on the source, but navigation keeps
    // the full source viewport. Never rely on overlapping native hit regions.
    q = q.replaceAll('height: Math.max(0, root.cnInputHeight)', 'height: root.cnQuickPadReadOnly ? 0 : Math.max(0, root.cnInputHeight)');
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
${insert('cnQuickPadReadOnly: !root.cnSecondary && !!root.cnHost && root.cnHost.quickPadActive')}
END TRAVERSE
`);
    q += affect('qml/device/view/documentview/DeviceSceneView.qml','FocusScope#root',insert(inc('quick-pad-fit')));
    const icon = `Rectangle {
        anchors.centerIn: parent; width: parent.width * 0.45; height: width * 1.15
        color: Values.cnQuickPadActive ? "#ddd" : "white"; border.color: "black"; border.width: 2; radius: 2
        Repeater { model: 2
            Row { required property int index; x: 5; y: 7 + index * 9; spacing: 4
                Rectangle { width: 4; height: 4; color: "transparent"; border.color: "black" }
                Rectangle { width: 10; height: 1; color: "black"; anchors.verticalCenter: parent.verticalCenter }
            }
        }
        Rectangle { anchors.right: parent.right; anchors.bottom: parent.bottom; width: parent.width * .43; height: parent.height * .43; color: "white"; border.color: "black"; border.width: 2 }
    }`;
    q += affect('qt/qml/xofm/libs/toolbar/qml/Toolbar.qml','FocusScope#root',`
TRAVERSE Item#toolbar > GridLayout#toolLayout
LOCATE BEFORE ToolbarTool#cnCompanionButton
INSERT { ToolbarTool {
    id: cnQuickPadButton
    toolbar: root; type: ToolbarTool.Type.ToolbarButton
    property bool _isExtensionButton: true
    label: "Quick Pad"
    visible: shouldShow && root.expanded
    shouldShow: root.documentType === "note" || root.documentType === "pdf"
    onPressed: { Values.cnQuickPadRequested(); root.closeFoldout() }
    ${icon}
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
