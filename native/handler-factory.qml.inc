// Local diagnostic only. The ordinary package keeps its stock static handler.
property bool cnHandlerDetached: false
function cnCreateHandler(initial) {
    if (root.strokeHandler || root.cnInkAllowed || (!root.cnLayoutBusy && initial !== true)) return false
    root.strokeHandler = cnStrokeHandlerComponent.createObject(root)
    if (!root.strokeHandler) return false
    cnHandlerDetached = false
    return true
}
Component.onCompleted: {
    if (!cnCreateHandler(true)) console.warn("Companion probe: FAILED native handler creation")
}
function cnRetirementReadiness() {
    if (!root.strokeHandler) return "missing-handler"
    if (root.cnInkAllowed || !root.cnLayoutBusy) return "pen-gate-open"
    if (!root.viewport || !root.controller || !root.tileManager) return "missing-native-view"
    if (root.isLoading) return "loading"
    if (root.gesturing || root.gestureIsLocked || root.penGestureHandler || toolMenuGesture.activeItem)
        return "active-gesture"
    if (root.itemSelectionMode || root.textSelectionMode || root.pdfTextSelectionMode || root.isCreatingSnippet)
        return "active-selection"
    return "ready"
}
function cnRetireHandler() {
    if (cnRetirementReadiness() !== "ready") return false
    // Observer must already be armed by the surviving host for both instances.
    // Disconnect both native consumers before requesting normal QML destruction.
    cnHandlerDetached = true
    if (inputSurface.handler !== null || root.viewport.penInputHandler !== null) return false
    root.penInput.surfaceManager.updateRegions()
    var prior = root.strokeHandler
    root.strokeHandler = null
    prior.destroy()
    return true
}
