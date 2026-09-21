property bool cnGeometryHidden: false
property bool cnGeometryAttached: false
function cnInputGeometryReadiness() {
    if (!root.tileManager || !root.sceneView) return "missing-native-view"
    if (root.cnInkAllowed || !root.cnLayoutBusy) return "pen-gate-open"
    if (root.adjustViewActive) return "adjust-view-active"
    if (!root.penInput.surfaceManager) return "missing-surface-manager"
    if (root.isLoading) return "loading"
    return "ready"
}
function cnUpdateInputGeometry() {
    var reason = cnInputGeometryReadiness()
    if (reason !== "ready") return false
    var manager = root.penInput.surfaceManager
    // Keep manager assigned: native setTransform needs it to include item->screen.
    // Remove the surface from native hit regions before attaching any handler.
    root.cnGeometryHidden = true
    try {
        manager.updateRegions()
        root.cnGeometryAttached = true
        if (inputSurface.handler !== strokeHandler) throw new Error("Native pen handler not attached")
        inputSurface.updateTransform()
    } finally {
        root.cnGeometryAttached = false
        manager.updateRegions()
        root.cnGeometryHidden = false
        manager.updateRegions()
    }
    return true
}
