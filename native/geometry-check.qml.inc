// Disposable-document diagnostic only. No pen samples, capture, or content edits.
function cnProbePaneGeometry() {
    if (!root.cnPaired || root.cnInkAllowed || !root.tileManager || !root.sceneView) return false
    var tm = root.tileManager, nav = sceneNavigation
    var initialScale = tm.scale, initialSize = tm.viewportSize
    var initialCenter = tm.center
    if (!(nav.height > 0) || Math.abs(nav.height - root.cnInputHeight) > 0.1) return false
    if (root.sceneView.limitScrollingToPaper) return false
    // Diagnostic locks physical gestures. Permit only these synchronous native
    // navigation calls, restoring that lock even if the native API rejects one.
    var oldBusy = nav.cnLayoutBusy
    try {
        nav.cnLayoutBusy = false
        for (var i = 0; i < 40; ++i) nav.cnJump(-1)
        var bounds = root.exteriorBoundary
        var bottom = tm.viewToScene(Qt.point(0, nav.height)).y
        if (bottom < bounds.y + bounds.height - 1) throw new Error("Page bottom unreachable in exposed pane")
        for (i = 0; i < 40; ++i) nav.cnJump(1)
        var top = tm.viewToScene(Qt.point(0, 0)).y
        if (Math.abs(top - bounds.y) > 1) throw new Error("Page top unreachable in exposed pane")
        if (Math.abs(tm.scale - initialScale) > 0.00001
            || tm.viewportSize.width !== initialSize.width || tm.viewportSize.height !== initialSize.height)
            throw new Error("Scrolling changed scale or native viewport size")
        console.log("Companion probe: exposed-pane scroll passed; height=" + nav.height + "; scale=" + initialScale)
    } finally {
        nav.cnLayoutBusy = oldBusy
        tm.setFocalPoint(initialCenter, initialScale)
    }
    return cnUpdateInputGeometry()
}
