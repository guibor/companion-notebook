// A translated ancestor does not necessarily change the tile transform. Follow
// stock orientation/adjust-view handling and refresh after QML layout settles.
property bool inputGeometryPending: true
property int inputGeometryGeneration: 0
function scheduleInputGeometry() {
    inputGeometryPending = true
    var generation = ++inputGeometryGeneration
    Qt.callLater(function() {
        if (!host || generation !== host.inputGeometryGeneration) return
        // Never replace a native transform/region during an active stroke.
        if (host.penDown || host.dragging || host.restoring) return
        if (!host.secondary) { host.inputGeometryPending = false; return }
        try {
            if (bridge.primary && bridge.primary.document && !bridge.primary.cnUpdateInputGeometry())
                throw new Error("Primary input geometry is not ready")
            if (host.secondary && !host.secondary.cnUpdateInputGeometry())
                throw new Error("Companion input geometry is not ready")
            host.inputGeometryPending = false
        } catch (e) {
            // Leave pen input gated on failure; never pretend mapping succeeded.
            host.error = "Writing is paused because the pane position could not be updated. Close the companion."
            console.warn("Companion: input geometry refresh failed")
        }
    })
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
