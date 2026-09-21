// Disposable-document diagnostic only. No pen samples, capture, or content edits.
function cnProbePaneGeometry() {
    if (!root.cnPaired || root.cnInkAllowed || !root.tileManager || !root.sceneView) return false
    var tm = root.tileManager, nav = sceneNavigation
    var initialScale = tm.scale, initialSize = tm.viewportSize
    var initialCenter = tm.center
    function finite(n) { return typeof n === "number" && isFinite(n) }
    function positive(n) { return finite(n) && n > 0 }
    function validBounds(b) { return !!b && finite(b.x) && finite(b.y) && positive(b.width) && positive(b.height) }
    if (!positive(initialScale) || !initialSize || !positive(initialSize.width) || !positive(initialSize.height)
        || !initialCenter || !finite(initialCenter.x) || !finite(initialCenter.y)
        || !positive(nav.height) || !positive(root.cnInputHeight)
        || Math.abs(nav.height - root.cnInputHeight) > 0.1 || !validBounds(root.exteriorBoundary)) return false
    if (root.sceneView.limitScrollingToPaper) return false
    // Diagnostic locks physical gestures. Permit only these synchronous native
    // navigation calls, restoring that lock even if the native API rejects one.
    var oldBusy = nav.cnLayoutBusy
    try {
        nav.cnLayoutBusy = false
        for (var i = 0; i < 40; ++i) if (!nav.cnJump(-1)) throw new Error("Native downward jump refused")
        var bounds = root.exteriorBoundary
        var bottom = tm.viewToScene(Qt.point(0, nav.height)).y
        if (!validBounds(bounds) || !finite(bottom) || bottom < bounds.y + bounds.height - 1)
            throw new Error("Page bottom unreachable in exposed pane")
        for (i = 0; i < 40; ++i) if (!nav.cnJump(1)) throw new Error("Native upward jump refused")
        var top = tm.viewToScene(Qt.point(0, 0)).y
        if (!finite(top) || Math.abs(top - bounds.y) > 1) throw new Error("Page top unreachable in exposed pane")
        if (!positive(tm.scale) || Math.abs(tm.scale - initialScale) > 0.00001
            || !tm.viewportSize || !positive(tm.viewportSize.width) || !positive(tm.viewportSize.height)
            || tm.viewportSize.width !== initialSize.width || tm.viewportSize.height !== initialSize.height)
            throw new Error("Scrolling changed scale or native viewport size")
        console.log("Companion probe: exposed-pane scroll passed; height=" + nav.height + "; scale=" + initialScale)
    } finally {
        nav.cnLayoutBusy = oldBusy
        tm.setFocalPoint(initialCenter, initialScale)
    }
    var restored = tm.center
    if (!restored || !finite(restored.x) || !finite(restored.y) || !positive(tm.scale)
        || Math.abs(restored.x - initialCenter.x) > 0.0001
        || Math.abs(restored.y - initialCenter.y) > 0.0001
        || Math.abs(tm.scale - initialScale) > 0.00001)
        throw new Error("Native focal point did not restore")
    return cnUpdateInputGeometry()
}
