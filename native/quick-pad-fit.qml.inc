function cnFitQuickPad() {
    if (!cnLayoutBusy || !cnAdmissionInputsDetached() || !tileManager || isLoading) return false
    var b = exteriorBoundary
    if (!b || !isFinite(b.x) || !isFinite(b.y) || !isFinite(b.width) || !isFinite(b.height)
            || !(b.width > 0) || !(b.height > 0) || !(width > 0) || !(cnInputHeight > 0)) return false
    var fitted = width / b.width * 0.96
    if (!(fitted > 0) || !isFinite(fitted)) return false
    // Fit width without shrinking long notes. Keep the saved vertical context
    // where possible, constrained to the actual page and a small blank tail.
    var half = cnInputHeight / fitted / 2
    var center = tileManager.center
    var y = center && isFinite(center.y) ? center.y : b.y + half
    y = Math.max(b.y + half, Math.min(b.y + b.height + half * 0.6, y))
    var x = b.x + b.width / 2
    // A warm reveal is already fitted. Even an identical native setter may
    // schedule tile/render work after the pad has become visible. Ignore only
    // sub-quarter-screen-pixel drift, not a user zoom or an actual pan change.
    if (center && isFinite(center.x) && isFinite(center.y)
            && isFinite(tileManager.scale) && tileManager.scale > 0
            && Math.abs(tileManager.scale - fitted) * b.width < 0.25
            && Math.abs(center.x - x) * fitted < 0.25
            && Math.abs(center.y - y) * fitted < 0.25) return true
    tileManager.setFocalPoint(Qt.point(x, y), fitted)
    return true
}
