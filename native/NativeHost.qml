import QtQuick
import QtCore as Core
import "PairStore.js" as Store

Item {
    id: host
    required property var bridge
    // Deployment must keep this false until native input/occlusion qualification.
    property bool inkQualified: false
    property bool renderProbeOnly: false
    property url settingsLocation: "file:///home/root/.local/share/companion-notebook/pairs.ini"
    property var pairs: Store.empty()
    property bool storeReady: false
    property string error: ""
    property string primaryId: ""
    property string companionId: ""
    property var secondary: null
    property bool secondarySelected: false
    property bool choosing: false
    readonly property bool dragging: false // Shared bridge compatibility; no live dragging.
    property bool closing: false
    property real revealHeight: 0
    property real savedRatio: 1 / 3
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
    readonly property bool idle: !transitionBusy && !penDown && !dragging && !restoring
        && !(bridge.primary && bridge.primary.cnGestureBusy)
        && !(secondary && secondary.cnGestureBusy)
    readonly property real mainInputHeight: paired ? height - revealHeight : height
    readonly property real secondaryInputHeight: Math.max(0, revealHeight - barHeight)
    readonly property var activeView: secondarySelected && paired ? secondary : bridge.primary
    readonly property bool modalOpen: choosing || !!error
    // Availability changes request a transaction; never hide an owned native
    // surface merely because a binding changed before its worker drained.
    visible: true
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
        if ((transitionBusy && !transitionApplying) || !secondary || !primaryId || !companionId || !storeReady) return
        pairs = Store.set(pairs, primaryId, companionId, savedRatio, String(secondary.currentPageId || ""))
        persist()
    }
    function synchronizePrimary() {
        var id = bridge.primary && bridge.primary.document ? String(bridge.primary.document.id) : ""
        if (id === primaryId) return
        if (secondary && !transitionApplying) { transitionFail("primary changed outside parked lifecycle"); return }
        if (secondary) closeSecondaryParked(false)
        primaryId = id
        var p = pairs.pairs[id]
        companionId = p ? p.companion : ""
        savedRatio = nearestSize(p ? p.ratio : 1 / 3)
        revealHeight = 0; secondarySelected = false; choosing = false
    }
    function choose() {
        if (renderProbeOnly || !idle || !mayShow || !primaryId || !storeReady) return
        requestTransition("choose", function() {
            bridge.primary.cnCloseFoldout()
            bridge.refreshDocuments()
            choosing = true
            return "choosing"
        })
    }
    function pick(id) {
        if (transitionPhase !== "choosing" || !Store.isId(id) || id === primaryId || !bridge.canOpen(id)) return false
        if (bridge.sharingActive) { error = "Stop screen sharing before revealing another notebook."; return false }
        return requestTransition("pair", function() {
            closeSecondaryParked(false)
            companionId = id; choosing = false
            openSecondaryParked()
        })
    }
    function openSecondary() {
        if (!idle || !mayShow || !companionId || companionId === primaryId || !bridge.canOpen(companionId)) {
            error = "This companion is unavailable. Choose a different local notebook."; return false
        }
        if (bridge.sharingActive) { error = "Stop screen sharing before revealing another notebook."; return false }
        return requestTransition("reveal", function() { openSecondaryParked() })
    }
    function openSecondaryParked() {
        if (!transitionApplying || !transitionOwnsPark()) throw new Error("open outside park")
        if (secondary) { revealHeight = Math.min(maximumHeight, Math.max(minimumHeight, height * savedRatio)); return }
        openGeneration++
        secondary = bridge.createView(nativeContainer, host)
        if (!secondary) throw new Error("Native view creation failed")
        var p = pairs.pairs[primaryId]
        restorePage = p && p.companion === companionId ? p.pageId : ""
        bridge.openView(secondary, companionId, restorePage)
        restoring = true
        revealHeight = Math.min(maximumHeight, Math.max(minimumHeight, height * savedRatio))
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
        return requestTransition("tuck", function() {
            checkpoint(); secondarySelected = false; revealHeight = 0
        })
    }
    function closeSecondary(detach) {
        if (transitionApplying) return closeSecondaryParked(detach)
        return requestTransition("close", function() { closeSecondaryParked(detach) })
    }
    function closeSecondaryParked(detach) {
        if (!transitionApplying || !transitionOwnsPark()) throw new Error("close outside park")
        if (closing) return
        closing = true
        checkpoint(); restoring = false
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
    function detach() { if (idle || transitionPhase === "choosing") closeSecondary(true) }
    function dismissChooser() {
        if (transitionPhase === "choosing") requestTransition("cancel", function() { choosing = false; error = "" })
        else if (!transitionBusy) error = ""
    }
    function nativeOperation(view, operation) {
        if (transitionApplying || (!secondary && (transitionPhase === "cold" || transitionPhase === "idle"))) { operation(); return true }
        return requestTransition("document", function() {
            if (view === bridge.primary) closeSecondaryParked(false)
            operation()
            synchronizePrimary()
        })
    }
    function action(name) {
        if (!idle || !secondary || !secondarySelected || !inkQualified) return
        secondary.cnAction(name)
    }
    function nearestSize(ratio) {
        var sizes = [1 / 3, 1 / 2, 2 / 3], best = sizes[0]
        for (var i = 1; i < sizes.length; ++i)
            if (Math.abs(ratio - sizes[i]) < Math.abs(ratio - best)) best = sizes[i]
        return best
    }
    function chooseSize(ratio) {
        if (!idle || !mayShow || !secondary || typeof ratio !== "number" || !isFinite(ratio)
                || Math.abs(nearestSize(ratio) - ratio) > 0.000001) return false
        return requestTransition("resize", function() {
            savedRatio = nearestSize(ratio)
            if (paired) revealHeight = Math.min(maximumHeight, Math.max(minimumHeight, height * savedRatio))
        })
    }
    function hideWhenUnavailable() {
        if (mayShow) return
        if (secondary || transitionBusy || choosing) transitionAvailabilityLost = true
        if ((secondary || choosing) && (transitionPhase === "idle" || transitionPhase === "choosing"))
            requestTransition("unavailable", function() { choosing = false; closeSecondaryParked(false) })
    }
    onMayShowChanged: hideWhenUnavailable()
    onPenDownChanged: { if (!penDown) hideWhenUnavailable() }
    Component.onCompleted: {
        loadStore(); synchronizePrimary()
        console.log("Companion: host ready; ink=" + inkQualified + "; settings=" + storeReady)
    }
    Component.onDestruction: {
        // A destructor is not an input completion barrier. Candidate recovery
        // owns unexpected host loss; never mutate or resume native work here.
        if (secondary) console.warn("Companion transition: host destroyed with a retained view")
    }
    Connections {
        target: bridge.primary
        function onDocumentChanged() { host.synchronizePrimary() }
    }
    Connections {
        target: bridge.penInput
        function onPenDownChanged(down) { host.penDown = down }
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
            Text {
                x: 32 * host.unit; anchors.verticalCenter: parent.verticalCenter; width: parent.width * 0.28; elide: Text.ElideRight
                text: (host.secondarySelected ? "● " : "") + (host.secondary && host.secondary.document ? host.secondary.document.visibleName : "Companion")
                font.pixelSize: 30 * host.unit; color: "#222"
            }
            MouseArea {
                anchors.fill: parent; preventStealing: true // Chrome never starts an underlying scroll.
            }
            SizeRuler {
                objectName: "nativeSizeRuler"
                x: 510 * host.unit; anchors.verticalCenter: parent.verticalCenter
                width: 390 * host.unit; height: 104 * host.unit
                unit: host.unit; ratio: host.savedRatio
                enabled: host.idle
                onChosen: function(ratio) { host.chooseSize(ratio) }
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
        objectName: "reopenCompanion"
        visible: host.mayShow && !!host.companionId && !host.paired
        width: 420 * host.unit; height: 94 * host.unit
        anchors.bottom: parent.bottom; anchors.horizontalCenter: parent.horizontalCenter
        color: "#efefea"; radius: 25 * host.unit; border.color: "#888"
        Text { anchors.centerIn: parent; text: "⌃  Open companion"; font.pixelSize: 30 * host.unit }
        TapHandler { onTapped: host.openSecondary() }
    }
    Rectangle {
        visible: host.choosing; anchors.fill: parent; color: "white"
        MouseArea { anchors.fill: parent }
        Column {
            x: 90 * host.unit; y: 100 * host.unit; width: parent.width - 180 * host.unit; spacing: 30 * host.unit
            Text { text: host.error ? "Companion unavailable" : "Choose a companion notebook"; font.pixelSize: 48 * host.unit; font.bold: true }
            Text { width: parent.width; wrapMode: Text.Wrap; text: host.error || "Choose a local notebook. Your source remains open behind it."; font.pixelSize: 32 * host.unit }
            Repeater {
                model: host && host.choosing && !host.error ? bridge.documents : []
                Rectangle {
                    required property var modelData
                    readonly property real rowUnit: host ? host.unit : 0
                    width: parent ? parent.width : 0; height: 100 * rowUnit; color: "#f4f4f0"
                    Text { x: parent ? 20 * parent.rowUnit : 0; anchors.verticalCenter: parent.verticalCenter; width: parent ? Math.max(0, parent.width - 40 * parent.rowUnit) : 0; elide: Text.ElideRight; text: modelData.title; font.pixelSize: parent ? Math.max(1, 34 * parent.rowUnit) : 1 }
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
                        MouseArea { anchors.fill: parent; onClicked: { if (modelData === "Remove pairing") host.detach(); else host.dismissChooser() } }
                    }
                }
            }
        }
    }
}
