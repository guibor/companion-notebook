// Keep the actual viewport full-sized. Only navigation's visible bounds change.
property bool cnPaired: false
property bool cnLayoutBusy: false
property bool cnConstraining: false

function cnConstrainToPane() {
    if (!cnPaired || cnLayoutBusy || cnConstraining || !tileManager || !sceneView) return
    var scale = tileManager.scale
    var bounds = exteriorBoundary
    if (!(scale > 0) || !isFinite(scale) || !(width > 0) || !(height > 0)
        || !bounds || !(bounds.width > 0) || !(bounds.height > 0)) return
    var topLeft = tileManager.viewToScene(Qt.point(0, 0))
    var visibleWidth = width / scale, visibleHeight = height / scale
    // Center narrow pages horizontally, but align short pages with the pane top.
    var minX = bounds.x - Math.max(0, visibleWidth - bounds.width) / 2
    var maxX = Math.max(minX, bounds.x + bounds.width - visibleWidth)
    var minY = bounds.y
    var maxY = Math.max(minY, bounds.y + bounds.height - visibleHeight)
    var x = Math.max(minX, Math.min(maxX, topLeft.x))
    var y = Math.max(minY, Math.min(maxY, topLeft.y))
    if (!isFinite(x) || !isFinite(y) || !isFinite(topLeft.x) || !isFinite(topLeft.y)) return
    var dx = (topLeft.x - x) * scale, dy = (topLeft.y - y) * scale
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return
    cnConstraining = true
    try { tileManager.moveViewBy(Qt.point(dx, dy)) }
    finally { cnConstraining = false }
}

function cnJump(direction) {
    if (!cnPaired || cnLayoutBusy || !tileManager) return false
    tileManager.moveViewBy(Qt.point(0, direction * height * 0.8))
    cnConstrainToPane()
    updateScrollbars()
    return true
}

// Scrollbar, search and text-autoscroll paths can move the native tile manager
// without going through updateDragAndZoom. Defer the clamp to avoid recursion.
Connections {
    target: root.cnPaired ? root.tileManager : null
    function onTransformChanged() { Qt.callLater(root.cnConstrainToPane) }
}
onCnLayoutBusyChanged: { if (!cnLayoutBusy) Qt.callLater(cnConstrainToPane) }
