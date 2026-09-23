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
    property int pickerTab: 0
    readonly property bool dragging: false // Shared bridge compatibility; no live dragging.
    property bool closing: false
    property real revealHeight: 0
    property real savedRatio: 3 / 8
    property bool penDown: false
    property bool restoring: false
    property string restorePage: ""
    property int openGeneration: 0
    readonly property real unit: width / 1620
    readonly property real barHeight: 2 * unit
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
        savedRatio = nearestSize(p ? p.ratio : 3 / 8)
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
        if (transitionPhase === "suspended" && (secondary || view !== bridge.primary)) return false
        if (transitionApplying || (!secondary && (transitionPhase === "cold" || transitionPhase === "idle"))) { operation(); return true }
        return requestTransition("document", function() {
            if (view === bridge.primary) closeSecondaryParked(false)
            operation()
            synchronizePrimary()
        })
    }
    function action(name) {
        if (!idle || !secondary || !secondarySelected || !inkQualified
                || ["Pen", "Erase", "Undo", "Redo", "Next", "＋"].indexOf(name) < 0) return false
        var view = secondary
        var invoke = function() { view.cnAction(name) }
        return name === "Next" || name === "＋" ? pageOperation(view, invoke) : editOperation(view, invoke)
    }
    function nearestSize(ratio) {
        var sizes = [1 / 4, 3 / 8, 1 / 2], best = sizes[0]
        for (var i = 1; i < sizes.length; ++i)
            if (Math.abs(ratio - sizes[i]) < Math.abs(ratio - best)) best = sizes[i]
        return best
    }
    function chooseSize(ratio) {
        if (!idle || !mayShow || !secondary || typeof ratio !== "number" || !isFinite(ratio)
                || Math.abs(nearestSize(ratio) - ratio) > 0.000001) return false
        var requestedRatio = Number(ratio)
        return requestTransition("resize", function() {
            host.savedRatio = requestedRatio
            host.revealHeight = Math.min(host.maximumHeight, Math.max(host.minimumHeight, host.height * requestedRatio))
        })
    }
    function hideWhenUnavailable() {
        if (bridge.inputAvailable) resumeAvailableInput()
        if (mayShow && bridge.inputAvailable) return
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
        Rectangle { id: grip; width: parent.width; height: host.barHeight; color: "#555" }
        Text {
            visible: !host.inkQualified || host.restoring; y: host.barHeight + 16 * host.unit; anchors.horizontalCenter: parent.horizontalCenter
            text: host.restoring ? "Opening companion…" : "Rendering probe — writing disabled"
            font.pixelSize: 28 * host.unit; color: "#666"
        }
    }
    Rectangle {
        objectName: "reopenCompanion"
        visible: false // Reopen lives in the native menu; no floating page chrome.
        width: 420 * host.unit; height: 94 * host.unit
        anchors.bottom: parent.bottom; anchors.horizontalCenter: parent.horizontalCenter
        color: "#efefea"; radius: 25 * host.unit; border.color: "#888"
        Text { anchors.centerIn: parent; text: "⌃  Open companion"; font.pixelSize: 30 * host.unit }
        TapHandler { onTapped: host.openSecondary() }
    }
    Rectangle {
        id: pickerOverlay
        visible: host.modalOpen; anchors.fill: parent; color: "#b3ffffff"
        MouseArea { anchors.fill: parent; onClicked: host.dismissChooser() }
        Rectangle {
            id: pickerCard
            anchors.centerIn: parent
            width: Math.min(parent.width - 280 * host.unit, 1120 * host.unit)
            height: Math.min(parent.height - 320 * host.unit, 1360 * host.unit)
            radius: 18 * host.unit; color: "white"; border.color: "#555"; border.width: host.unit
            MouseArea { anchors.fill: parent }
            Text {
                x: 48 * host.unit; y: 48 * host.unit
                width: parent.width - 170 * host.unit
                text: host.error ? "Companion unavailable" : "Companion notebook"
                font.pixelSize: 42 * host.unit; font.bold: true; elide: Text.ElideRight
            }
            Item {
                anchors.top: parent.top; anchors.right: parent.right
                width: 110 * host.unit; height: 130 * host.unit
                Text { anchors.centerIn: parent; text: "×"; font.pixelSize: 44 * host.unit }
                MouseArea { anchors.fill: parent; onClicked: host.dismissChooser() }
            }
            Text {
                x: 48 * host.unit; y: 112 * host.unit; width: parent.width - 96 * host.unit
                text: host.error || "Choose a notebook or PDF to open alongside this one."
                font.pixelSize: 28 * host.unit; color: "#555"; wrapMode: Text.Wrap
            }
            Row {
                visible: !host.error
                x: 48 * host.unit; y: 178 * host.unit; width: parent.width - 96 * host.unit; height: 78 * host.unit
                Repeater {
                    model: ["Recent", "Favorites"]
                    Item {
                        required property int index
                        required property string modelData
                        width: (pickerCard.width - 96 * host.unit) / 2; height: 78 * host.unit
                        Text { anchors.centerIn: parent; text: modelData; font.pixelSize: 29 * host.unit; font.bold: host.pickerTab === index }
                        Rectangle { anchors.bottom: parent.bottom; width: parent.width; height: host.pickerTab === index ? 3 * host.unit : host.unit; color: host.pickerTab === index ? "black" : "#ccc" }
                        MouseArea { anchors.fill: parent; onClicked: { host.pickerTab = index; recentList.positionViewAtBeginning() } }
                    }
                }
            }
            ListView {
                id: recentList
                x: 32 * host.unit; y: 275 * host.unit
                width: parent.width - 64 * host.unit; height: parent.height - 395 * host.unit
                clip: true; boundsBehavior: Flickable.StopAtBounds
                model: host.choosing && !host.error ? (host.pickerTab === 0 ? bridge.documents : bridge.favorites) : []
                delegate: Rectangle {
                    required property var modelData
                    width: recentList.width; height: 122 * host.unit
                    color: pickArea.pressed ? "#eee" : "white"
                    Rectangle {
                        x: 20 * host.unit; anchors.verticalCenter: parent.verticalCenter
                        width: 34 * host.unit; height: 44 * host.unit
                        color: "white"; border.color: "black"; border.width: 2 * host.unit
                        Rectangle { x: 7 * host.unit; y: 0; width: host.unit; height: parent.height; color: "black" }
                    }
                    Text {
                        x: 80 * host.unit; y: 25 * host.unit; width: parent.width - 145 * host.unit
                        elide: Text.ElideRight; text: modelData.title; font.pixelSize: 32 * host.unit
                    }
                    Text { x: 80 * host.unit; y: 72 * host.unit; text: modelData.isPdf ? "PDF" : "Notebook"; font.pixelSize: 23 * host.unit; color: "#666" }
                    Text { anchors.right: parent.right; anchors.rightMargin: 18 * host.unit; anchors.verticalCenter: parent.verticalCenter; text: modelData.id === host.companionId ? "✓" : "›"; font.pixelSize: 34 * host.unit }
                    Rectangle { x: 80 * host.unit; anchors.bottom: parent.bottom; width: parent.width - x - 16 * host.unit; height: host.unit; color: "#ddd" }
                    MouseArea { id: pickArea; anchors.fill: parent; onClicked: host.pick(modelData.id) }
                }
            }
            Text {
                visible: !host.error && recentList.count === 0
                anchors.centerIn: recentList; width: recentList.width - 80 * host.unit
                text: host.pickerTab === 0 ? "No eligible recent documents.\nOpen a portrait notebook, then return here." : "No eligible favorites.\nFavorite a portrait notebook or PDF to find it here."
                font.pixelSize: 28 * host.unit; color: "#555"; horizontalAlignment: Text.AlignHCenter; wrapMode: Text.Wrap
            }
            Rectangle {
                visible: recentList.contentHeight > recentList.height
                x: parent.width - 17 * host.unit
                y: recentList.y + recentList.visibleArea.yPosition * recentList.height
                width: 3 * host.unit; height: Math.max(30 * host.unit, recentList.visibleArea.heightRatio * recentList.height); color: "#777"
            }
            Item {
                visible: !!host.companionId && !host.error
                x: 40 * host.unit; anchors.bottom: parent.bottom; width: parent.width - 80 * host.unit; height: 100 * host.unit
                Text { anchors.left: parent.left; anchors.verticalCenter: parent.verticalCenter; text: "Unpair notebooks"; font.pixelSize: 26 * host.unit; color: "#555" }
                MouseArea { anchors.fill: parent; onClicked: host.detach() }
            }
        }
    }
}
