// The corner is a layout for the ordinary pair, not a second Quick Pad identity.
property string companionLayout: "split"
readonly property bool companionCornerSelected: companionLayout === "corner" && !quickPadActive && !quickPadCached
readonly property bool cornerPaneActive: quickPadActive || companionCornerSelected
readonly property bool cornerPaneGeometry: cornerPaneActive || quickPadCached
property var fittedCornerView: null
property real fittedCornerWidth: 0
property real fittedCornerHeight: 0
function cornerFitIsCurrent() {
    return !!secondary && secondary === fittedCornerView
        && quickPadWidth === fittedCornerWidth && quickPadHeight === fittedCornerHeight
}
function toggleCompanion() {
    if (!idle || !mayShow || !primaryId || !storeReady) return false
    if (quickPadActive || quickPadCached) {
        return requestTransition("quick-pad-to-companion", function() {
            closeSecondaryParked(false)
            if (companionId && bridge.canOpen(companionId)) {
                openSecondaryParked()
            } else {
                pickerLayout = -1; quickPadChoosing = false
                bridge.primary.cnCloseFoldout(); bridge.refreshDocuments()
                choosing = true
                return "choosing"
            }
        })
    }
    if (paired) return tuck()
    if (companionId && bridge.canOpen(companionId)) return openSecondary()
    pickerLayout = -1
    choose()
    return true
}
function chooseCompanionCorner() {
    if (!idle || !mayShow || quickPadActive) return false
    if (!companionId) {
        pickerLayout = 2
        choose()
        return true
    }
    if (!bridge.canOpen(companionId)) return false
    return requestTransition("corner-layout", function() {
        if (quickPadCached) closeSecondaryParked(false)
        companionLayout = "corner"
        openSecondaryParked()
    })
}
