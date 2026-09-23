// Tool setters and undo/redo are one pane-scoped edit, not page navigation.
// Callers capture scalar signal arguments, then put the ENTIRE native setter
// group in operation. Do not schedule one transaction per property assignment.
function editOperation(view, operation) {
    if (typeof operation !== "function") return false
    var token = pageCapture(view)
    if (!token) return false
    if (!pageMayMutate(view)) token.generation++
    return pageOperation(view, function() {
        if (!pageTokenCurrent(token) || !pageMayMutate(view)) {
            pageOperationFailed("edit owner changed before mutation")
            throw new Error("edit owner changed before mutation")
        }
        try {
            operation()
            // Edits may change content/tool state but must never swap the
            // native document, page, controller, handler, or host ownership.
            if (!pageTokenCurrent(token) || !pageMayMutate(view))
                throw new Error("edit changed its native page or owner")
            if (transitionPhase === "failed") throw new Error("native edit failed")
        } catch (e) {
            // Retain failure even when a native signal dispatcher catches the
            // thrown JS error. No attempted content rollback or input release.
            pageOperationFailed("edit refused: " + String(e))
            throw e
        }
    })
}

// Native pen models schedule ensureSelection via Qt.callLater. Such a callback
// can arrive while a tool transaction is loading and is correctly refused then.
// Normalize the currently selected tool as one group, for every ready pane,
// while still parked and before publication. This is not a queue of stale
// callbacks: the current view/pen is validated again at this point.
function editOperationsReady(views) {
    if (!transitionOwnsPark() || !inputGeometryPending || transitionApplying
            || (transitionPhase !== "loading" && transitionPhase !== "settling"))
        return pageOperationFailed("normalization outside a ready native park")
    // The availability path has already removed the companion while parked.
    // Do not start tool mutations on a sleeping/hidden primary as it is handed
    // back to stock; its next visible paired opening normalizes afresh.
    if (!mayShow && !secondary && !pagePendingAdd) return true
    transitionApplying = true
    try {
        for (var view of views) {
            if (typeof view.cnNormalizeTools !== "function") continue
            if (!editOperation(view, function() { view.cnNormalizeTools() }))
                throw new Error("tool normalization refused")
        }
        return transitionPhase !== "failed"
    } catch (e) {
        return pageOperationFailed("normalization failed: " + String(e))
    } finally {
        transitionApplying = false
    }
}
