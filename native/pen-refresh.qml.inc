property bool cnGeometryHidden: false
property bool cnGeometryAttached: false
function cnUpdateInputGeometry() {
    if (!root.tileManager || !root.sceneView || root.isLoading || root.adjustViewActive
        || root.cnInkAllowed || !root.cnLayoutBusy) return false
    var manager = root.penInput.surfaceManager
    if (!manager) return false
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
