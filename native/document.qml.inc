property var cnHost: null
property bool cnSecondary: false
readonly property bool cnPaired: !!cnHost && cnHost.paired
readonly property bool cnSelected: cnSecondary ? (!!cnHost && cnPaired && cnHost.activeView === root) : (!cnHost || !cnPaired || cnHost.activeView === root)
readonly property bool cnOwnsGlobals: !cnSecondary && (!cnHost || !cnPaired) || (!!cnHost && cnPaired && cnHost.activeView === root)
readonly property bool cnInkAllowed: (!cnHost || (!cnHost.renderProbeOnly && !cnHost.modalOpen && !cnHost.dragging && !cnHost.restoring)) && ((!cnPaired && !cnSecondary) || (!!cnHost && cnHost.inkQualified && cnSelected && cnPaired))
readonly property bool cnGestureBusy: sceneView.gesturing || sceneView.gestureIsLocked
readonly property real cnInputHeight: !cnHost ? height : cnSecondary ? cnHost.secondaryInputHeight : cnHost.mainInputHeight
// Dates publishes a global open signal. Keep its native add-page wrapper, but
// never instantiate a second global Dates panel for the secondary document.
function cnIsolateCompanionUi() {
    if (!cnSecondary) return
    for (var i = 0; i < children.length; ++i) {
        var child = children[i]
        if ("source" in child && String(child.source) === "file:///home/root/.local/lib/notebook-date-index/DatesPanel.qml")
            child.active = false
    }
}
Component.onCompleted: Qt.callLater(cnIsolateCompanionUi)
function cnCloseFoldout() { toolbar.closeFoldout() }
function cnNativeClose() { cnStockClose() }
function close() {
    if (cnHost && cnHost.penDown) return
    if (!cnSecondary && cnHost) cnHost.closeSecondary(false)
    cnStockClose()
}
function cnRefresh() { if (sceneView.viewport) sceneView.viewport.requestRepaint() }
function cnAction(name) {
    if (!cnHost || !cnHost.idle || !cnHost.inkQualified || !cnSelected || !document) return
    switch (name) {
    case "Pen": toolbar.selectPen("primary"); break
    case "Erase": toolbar.selectEraseSection(); break
    case "Undo": sceneController.undo(); break
    case "Next": root.moveForward(); break
    case "＋": root.addPage(document); break
    }
}
