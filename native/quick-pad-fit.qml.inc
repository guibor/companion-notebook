property bool cnQuickPadReadOnly: false
function cnFitQuickPad() {
    if (!cnLayoutBusy || !cnAdmissionInputsDetached() || !tileManager || isLoading) return false
    var b = exteriorBoundary
    if (!b || !isFinite(b.x) || !isFinite(b.y) || !isFinite(b.width) || !isFinite(b.height)
            || !(b.width > 0) || !(b.height > 0) || !(width > 0) || !(cnInputHeight > 0)) return false
    var fitted = Math.min(width / b.width, cnInputHeight / b.height) * 0.96
    if (!(fitted > 0) || !isFinite(fitted)) return false
    tileManager.setFocalPoint(Qt.point(b.x + b.width / 2, b.y + b.height / 2), fitted)
    return true
}
