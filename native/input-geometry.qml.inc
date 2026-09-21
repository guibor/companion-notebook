// A translated ancestor does not necessarily change the tile transform. Follow
// stock orientation/adjust-view handling and refresh after QML layout settles.
property bool inputGeometryPending: true
property int inputGeometryGeneration: 0
property int inputGeometryRetries: 0
function scheduleInputGeometry() {
    inputGeometryPending = true
    inputGeometryRetries = 0
    inputGeometryRetry.stop()
    var generation = ++inputGeometryGeneration
    Qt.callLater(function() {
        if (!host || generation !== host.inputGeometryGeneration) return
        host.tryInputGeometry()
    })
}
function tryInputGeometry() {
    // Pen-up/drag-end/restore-end schedule a fresh attempt. No timer can change
    // an owned stroke's transform or spend the retry budget while it is active.
    if (penDown || dragging || restoring) return
    if (!secondary) { inputGeometryPending = false; return }
    try {
        var views = [bridge.primary, secondary]
        for (var i = 0; i < views.length; ++i) {
            if (!views[i] || !views[i].document) throw new Error("missing-document")
            var reason = views[i].cnInputGeometryReadiness()
            if (reason === "loading" && ++inputGeometryRetries <= 120) {
                inputGeometryRetry.restart()
                return
            }
            if (reason !== "ready") throw new Error((i ? "companion:" : "primary:") + reason)
        }
        for (i = 0; i < views.length; ++i)
            if (!views[i].cnUpdateInputGeometry()) throw new Error("native-refresh-refused")
        inputGeometryPending = false
    } catch (e) {
        error = "Writing is paused because the pane position could not be updated. Close the companion."
        console.warn("Companion: input geometry refresh failed: " + String(e))
    }
}
Timer {
    id: inputGeometryRetry
    interval: 100
    onTriggered: host.tryInputGeometry()
}
onRevealHeightChanged: scheduleInputGeometry()
onSecondaryChanged: scheduleInputGeometry()
onSecondarySelectedChanged: scheduleInputGeometry()
onWidthChanged: scheduleInputGeometry()
onHeightChanged: scheduleInputGeometry()
onDraggingChanged: { if (!dragging) scheduleInputGeometry() }
onRestoringChanged: { if (!restoring) scheduleInputGeometry() }

property var pendingToolbarOwner: null
function noteToolbarOwner(view) {
    if (view !== bridge.primary && view !== secondary) return
    pendingToolbarOwner = view
    toolbarOwnerTimer.restart()
}
Timer {
    id: toolbarOwnerTimer
    interval: 30; repeat: true
    onTriggered: {
        if (!host.idle) return
        var view = host.pendingToolbarOwner
        host.pendingToolbarOwner = null
        stop()
        if (view === bridge.primary) host.selectPane(false)
        else if (view && view === host.secondary && host.paired) host.selectPane(true)
    }
}
