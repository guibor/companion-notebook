// The corner is a layout for the ordinary pair, not a second Quick Pad identity.
property string companionLayout: "split"
readonly property bool companionCornerSelected: companionLayout === "corner" && !quickPadActive && !quickPadCached
readonly property bool cornerPaneActive: quickPadActive || companionCornerSelected
readonly property bool cornerPaneGeometry: cornerPaneActive || quickPadCached
function chooseCompanionCorner() {
    if (!idle || !mayShow || quickPadActive) return false
    if (!companionId) {
        pickerLayout = 2
        choose()
        return true
    }
    if (!bridge.canOpen(companionId) || bridge.sharingActive) return false
    return requestTransition("corner-layout", function() {
        if (quickPadCached) closeSecondaryParked(false)
        companionLayout = "corner"
        openSecondaryParked()
    })
}
