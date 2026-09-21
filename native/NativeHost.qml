import QtQuick
import QtCore as Core
import "PairStore.js" as Store

Item {
    id: host
    required property var bridge
    // Deployment must keep this false until native input/occlusion qualification.
    property bool inkQualified: false
    property url settingsLocation: "file:///home/root/.local/share/companion-notebook/pairs.ini"
    property var pairs: Store.empty()
    property bool storeReady: false
    property string error: ""
    property string primaryId: ""
    property string companionId: ""
    property var secondary: null
    property bool secondarySelected: false
    property bool choosing: false
    property bool dragging: false
    property bool pullingFromTucked: false
    property bool closing: false
    property real revealHeight: 0
    property real savedRatio: 0.35
    property bool penDown: false
    property bool restoring: false
    property string restorePage: ""
    property int openGeneration: 0
    readonly property real unit: width / 1620
    readonly property real barHeight: 112 * unit
    readonly property real minimumHeight: 360 * unit
    readonly property real maximumHeight: height * 0.85
    readonly property bool paired: secondary !== null && revealHeight > 0
    readonly property bool mayShow: bridge.available && bridge.portrait
    readonly property bool idle: !penDown && !dragging && !restoring
        && !(bridge.primary && bridge.primary.cnGestureBusy)
        && !(secondary && secondary.cnGestureBusy)
    readonly property real mainInputHeight: paired ? height - revealHeight : height
    readonly property real secondaryInputHeight: Math.max(0, revealHeight - barHeight)
    readonly property var activeView: secondarySelected && paired ? secondary : bridge.primary
    readonly property bool modalOpen: choosing || !!error
    visible: mayShow
    clip: true

    Core.Settings { id: settings; location: host.settingsLocation; category: "companion"; property string pairsJson: '{"version":1,"pairs":{}}' }
    function loadStore() {
        try { pairs = Store.parse(settings.pairsJson); storeReady = true }
        catch (e) { storeReady = false; error = "Saved notebook pairings could not be read. They have not been overwritten." }
    }
    function persist() {
        if (!storeReady) return false
        try {
            var encoded = JSON.stringify(Store.parse(JSON.stringify(pairs)))
            if (settings.pairsJson !== encoded) { settings.pairsJson = encoded; settings.sync() }
            return true
        }
        catch (e) { error = "Could not save this pairing. Your documents are unchanged."; return false }
    }
    function checkpoint() {
        if (!secondary || !primaryId || !companionId || !storeReady) return
        pairs = Store.set(pairs, primaryId, companionId, savedRatio, String(secondary.currentPageId || ""))
        persist()
    }
    function synchronizePrimary() {
        var id = bridge.primary && bridge.primary.document ? String(bridge.primary.document.id) : ""
        if (id === primaryId) return
        closeSecondary(false)
        primaryId = id
        var p = pairs.pairs[id]
        companionId = p ? p.companion : ""
        savedRatio = p ? p.ratio : 0.35
        revealHeight = 0; secondarySelected = false; choosing = false
    }
    function choose() {
        if (!idle || !mayShow || !primaryId || !storeReady) return
        bridge.primary.cnCloseFoldout()
        bridge.refreshDocuments()
        choosing = true
    }
    function pick(id) {
        if (!idle || !Store.isId(id) || id === primaryId || !bridge.canOpen(id)) return false
        if (bridge.sharingActive) { error = "Stop screen sharing before revealing another notebook."; return false }
        closeSecondary(false)
        companionId = id; choosing = false
        return openSecondary()
    }
    function openSecondary() {
        if (!idle || !mayShow || !companionId || companionId === primaryId || !bridge.canOpen(companionId)) {
            error = "This companion is unavailable. Choose a different local notebook."; return false
        }
        if (bridge.sharingActive) { error = "Stop screen sharing before revealing another notebook."; return false }
        if (secondary) { revealHeight = Math.min(maximumHeight, Math.max(minimumHeight, height * savedRatio)); return true }
        try {
            openGeneration++
            secondary = bridge.createView(nativeContainer, host)
            if (!secondary) throw new Error("Native view creation failed")
            var p = pairs.pairs[primaryId]
            restorePage = p && p.companion === companionId ? p.pageId : ""
            bridge.openView(secondary, companionId, restorePage)
            restoring = true
            revealHeight = Math.min(maximumHeight, Math.max(minimumHeight, height * savedRatio))
            nativeReady.restart(); openTimeout.restart()
            return true
        } catch (e) {
            closeSecondary(false); error = "The native companion could not open. The main document is unchanged."
            console.warn("Companion: native open failed"); return false
        }
    }
    function selectPane(secondaryPane) {
        if (!idle || choosing || (secondaryPane && !paired)) return false
        if (activeView) activeView.cnCloseFoldout()
        secondarySelected = secondaryPane
        if (activeView) activeView.forceActiveFocus()
        return true
    }
    function tuck() {
        if (!idle) return false
        checkpoint(); secondarySelected = false; revealHeight = 0
        return true
    }
    function closeSecondary(detach) {
        if (closing) return
        closing = true
        checkpoint(); nativeReady.stop(); openTimeout.stop(); restoring = false
        openGeneration++
        secondarySelected = false; revealHeight = 0
        var view = secondary
        secondary = null
        if (view) { view.cnNativeClose(); view.destroy() }
        if (detach && primaryId && storeReady) {
            pairs = Store.remove(pairs, primaryId); persist(); companionId = ""
        }
        closing = false
    }
    function detach() { if (idle) closeSecondary(true) }
    function action(name) {
        if (!idle || !secondary || !secondarySelected || !inkQualified) return
        secondary.cnAction(name)
    }
    function beginDrag(y) {
        if (!idle || !mayShow || !secondary) return false
        dragStartY = y; dragStartHeight = revealHeight; dragging = true
        bridge.beginAnimation(); return true
    }
    property real dragStartY: 0
    property real dragStartHeight: 0
    function moveDrag(y) {
        if (dragging) revealHeight = Math.max(0, Math.min(maximumHeight, dragStartHeight + dragStartY - y))
    }
    function finishDrag(cancel) {
        if (!dragging) return
        if (cancel) revealHeight = dragStartHeight
        dragging = false; bridge.endAnimation()
        if (revealHeight < minimumHeight) tuck()
        else { savedRatio = revealHeight / height; checkpoint() }
    }
    function beginPull(y) {
        if (!idle || !mayShow) return false
        // A cold native view must finish opening before accepting a drag.
        if (!secondary) { openSecondary(); return false }
        pullingFromTucked = beginDrag(y)
        return pullingFromTucked
    }
    function finishPull(cancel) {
        var tapped = !cancel && dragging && Math.abs(revealHeight - dragStartHeight) < 8 * unit
        finishDrag(cancel)
        pullingFromTucked = false
        if (tapped) openSecondary()
    }
    function hideWhenUnavailable() {
        if (!mayShow && !penDown) {
            if (dragging) finishDrag(true)
            pullingFromTucked = false; choosing = false; revealHeight = 0; secondarySelected = false
        }
    }
    onMayShowChanged: hideWhenUnavailable()
    onPenDownChanged: { if (!penDown) hideWhenUnavailable() }
    Component.onCompleted: {
        loadStore(); synchronizePrimary()
        console.log("Companion: host ready; ink=" + inkQualified + "; settings=" + storeReady)
    }
    Component.onDestruction: { if (secondary) closeSecondary(false) }
    Connections {
        target: bridge.primary
        function onDocumentChanged() { host.synchronizePrimary() }
    }
    Connections {
        target: bridge.penInput
        function onPenDownChanged(down) { host.penDown = down }
    }
    Timer {
        id: nativeReady; interval: 100; repeat: true
        onTriggered: {
            if (!host.secondary || !bridge.viewReady(host.secondary)) return
            host.restoring = false; stop(); openTimeout.stop(); host.checkpoint()
            console.log("Companion: native rendering ready; ink=" + host.inkQualified)
        }
    }
    Timer {
        id: openTimeout; interval: 12000
        onTriggered: { host.closeSecondary(false); host.error = "The companion took too long to open. Try another local notebook." }
    }
    Timer {
        interval: 2000; repeat: true; running: host.paired && host.idle
        onTriggered: host.checkpoint()
    }
    TapHandler {
        enabled: host.paired && host.secondarySelected && host.idle
        onTapped: function(p) { if (p.position.y < host.height - host.revealHeight) host.selectPane(false) }
    }
    Item {
        id: sheet
        y: host.height - host.revealHeight; width: host.width; height: host.height
        visible: host.paired; clip: true
        Rectangle { anchors.fill: parent; color: "white" }
        Item { id: nativeContainer; y: host.barHeight; width: parent.width; height: host.height - host.barHeight; clip: true }
        // This passive tap is checked against the sheet's visible native area.
        TapHandler {
            enabled: host.idle
            onTapped: function(p) { if (p.position.y > host.barHeight && p.position.y < host.revealHeight) host.selectPane(true) }
        }
        Rectangle {
            id: grip; width: parent.width; height: host.barHeight; color: "#f1f1ed"; border.color: "#888"
            Rectangle { width: 110 * host.unit; height: 8 * host.unit; radius: height / 2; anchors.horizontalCenter: parent.horizontalCenter; y: 12 * host.unit; color: "#666" }
            Text {
                x: 32 * host.unit; y: 50 * host.unit; width: parent.width * 0.45; elide: Text.ElideRight
                text: (host.secondarySelected ? "● " : "") + (host.secondary && host.secondary.document ? host.secondary.document.visibleName : "Companion")
                font.pixelSize: 30 * host.unit; color: "#222"
            }
            MouseArea {
                anchors.fill: parent; preventStealing: true
                onPressed: function(m) { m.accepted = host.beginDrag(mapToItem(host,m.x,m.y).y) }
                onPositionChanged: function(m) { if (pressed) host.moveDrag(mapToItem(host,m.x,m.y).y) }
                onReleased: host.finishDrag(false)
                onCanceled: host.finishDrag(true)
            }
            Row {
                anchors.right: parent.right; anchors.rightMargin: 20 * host.unit; anchors.bottom: parent.bottom
                Repeater {
                    model: ["Pen", "Erase", "Undo", "Next", "＋", "⌄"]
                    Rectangle {
                        required property string modelData
                        width: 104 * host.unit; height: 76 * host.unit; color: "transparent"
                        Text { anchors.centerIn: parent; text: modelData; font.pixelSize: 27 * host.unit; color: "#333" }
                        MouseArea { anchors.fill: parent; onClicked: { if (modelData === "⌄") host.tuck(); else { host.selectPane(true); host.action(modelData) } } }
                    }
                }
            }
        }
        Text {
            visible: !host.inkQualified || host.restoring; y: host.barHeight + 16 * host.unit; anchors.horizontalCenter: parent.horizontalCenter
            text: host.restoring ? "Opening companion…" : "Rendering probe — writing disabled"
            font.pixelSize: 28 * host.unit; color: "#666"
        }
    }
    Rectangle {
        visible: !!host.companionId && (!host.paired || host.pullingFromTucked)
        width: 420 * host.unit; height: 94 * host.unit
        anchors.bottom: parent.bottom; anchors.horizontalCenter: parent.horizontalCenter
        color: "#efefea"; radius: 25 * host.unit; border.color: "#888"
        Text { anchors.centerIn: parent; text: "⌃  Pull out companion"; font.pixelSize: 30 * host.unit }
        MouseArea {
            anchors.fill: parent; preventStealing: true
            onPressed: function(m) { m.accepted = host.beginPull(mapToItem(host,m.x,m.y).y) }
            onPositionChanged: function(m) { if (pressed) host.moveDrag(mapToItem(host,m.x,m.y).y) }
            onReleased: host.finishPull(false)
            onCanceled: host.finishPull(true)
        }
    }
    Rectangle {
        visible: host.choosing || !!host.error; anchors.fill: parent; color: "white"
        MouseArea { anchors.fill: parent }
        Column {
            x: 90 * host.unit; y: 100 * host.unit; width: parent.width - 180 * host.unit; spacing: 30 * host.unit
            Text { text: host.error ? "Companion unavailable" : "Choose a companion notebook"; font.pixelSize: 48 * host.unit; font.bold: true }
            Text { width: parent.width; wrapMode: Text.Wrap; text: host.error || "Choose a local notebook. Your source remains open behind it."; font.pixelSize: 32 * host.unit }
            Repeater {
                model: host.error ? [] : bridge.documents
                Rectangle {
                    required property var modelData
                    width: parent.width; height: 100 * host.unit; color: "#f4f4f0"
                    Text { x: 20 * host.unit; anchors.verticalCenter: parent.verticalCenter; width: parent.width - 40 * host.unit; elide: Text.ElideRight; text: modelData.title; font.pixelSize: 34 * host.unit }
                    MouseArea { anchors.fill: parent; onClicked: host.pick(modelData.id) }
                }
            }
            Row {
                spacing: 40 * host.unit
                Repeater {
                    model: host.error ? ["Close"] : ["Cancel", "Remove pairing"]
                    Rectangle {
                        required property string modelData
                        width: 360 * host.unit; height: 100 * host.unit; color: "#e9e9e4"; radius: 14 * host.unit
                        Text { anchors.centerIn: parent; text: modelData; font.pixelSize: 32 * host.unit }
                        MouseArea { anchors.fill: parent; onClicked: { if (modelData === "Remove pairing") host.detach(); host.choosing = false; host.error = "" } }
                    }
                }
            }
        }
    }
}
