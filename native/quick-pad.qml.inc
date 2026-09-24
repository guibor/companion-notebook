// Quick Pad is one device-local notebook, independent of per-document pairs.
property bool quickPadActive: false
property bool quickPadChoosing: false
property bool quickPadFitPending: false
property var quickPadReturn: null
property string quickPadId: ""
property string quickPadCorner: "right"
property bool quickPadStoreReady: false
readonly property real quickPadScale: 0.5
readonly property real quickPadInset: 144 * unit
readonly property real quickPadX: quickPadCorner === "left" ? quickPadInset : width * 0.5 - quickPadInset
function loadQuickPad() {
    try {
        if (settings.quickPadJson.length > 1024) throw new Error("Quick Pad settings too large")
        var p = JSON.parse(settings.quickPadJson)
        if (!p || p.version !== 1 || (p.document !== "" && !Store.isId(p.document))
                || ["left", "right"].indexOf(p.corner) < 0) throw new Error("Invalid Quick Pad settings")
        quickPadId = p.document; quickPadCorner = p.corner; quickPadStoreReady = true
    } catch (e) {
        quickPadStoreReady = false
        error = "Quick Pad settings could not be read. They have not been overwritten."
    }
}
function saveQuickPad(id, corner) {
    if (!quickPadStoreReady || (id !== "" && !Store.isId(id)) || ["left", "right"].indexOf(corner) < 0) return false
    settings.quickPadJson = JSON.stringify({version:1, document:id, corner:corner})
    settings.sync()
    quickPadId = id; quickPadCorner = corner
    return true
}
function quickPadDocuments() {
    var entries = pickerTab === 0 ? bridge.documents : bridge.favorites
    return entries.filter(function(e) { return !e.isPdf && bridge.canOpenPad(e.id) })
}
function configureQuickPad() {
    if (!idle || !mayShow || !primaryId || !storeReady || !quickPadStoreReady) return false
    return requestTransition("quick-pad-settings", function() {
        bridge.primary.cnCloseFoldout()
        bridge.refreshDocuments()
        quickPadChoosing = true; choosing = true
        return "choosing"
    })
}
function setQuickPadCorner(corner) {
    if (transitionPhase !== "choosing" || !quickPadChoosing || !transitionOwnsPark()) return false
    // Configuration selection is separate from live geometry: apply on reopen.
    if (["left", "right"].indexOf(corner) < 0) return false
    quickPadDraftCorner = corner
    return true
}
property string quickPadDraftCorner: "right"
function pickQuickPad(id) {
    if (transitionPhase !== "choosing" || !quickPadChoosing || !Store.isId(id)
            || id === primaryId || !bridge.canOpenPad(id)) return false
    if (bridge.sharingActive) { error = "Stop screen sharing before opening Quick Pad."; return false }
    return requestTransition("quick-pad-pick", function() {
        var retained = quickPadActive ? quickPadReturn : null
        if (quickPadActive) closeSecondaryParked(false)
        if (!saveQuickPad(id, quickPadDraftCorner)) throw new Error("Quick Pad settings refused")
        quickPadChoosing = false; choosing = false
        openQuickPadParked()
        if (retained) quickPadReturn = retained
    })
}
function toggleQuickPad() {
    if (!idle || !mayShow || !primaryId || !quickPadStoreReady) return false
    if (quickPadActive) return closeQuickPad()
    if (quickPadId === primaryId) {
        error = "This is already your Quick Pad notebook. Write here, or open Quick Pad from another document."
        return false
    }
    if (!quickPadId || !bridge.canOpenPad(quickPadId)) return configureQuickPad()
    if (bridge.sharingActive) { error = "Stop screen sharing before opening Quick Pad."; return false }
    return requestTransition("quick-pad-open", function() { openQuickPadParked() })
}
function openQuickPadParked() {
    if (!transitionApplying || !transitionOwnsPark()) throw new Error("Quick Pad open outside park")
    if (!bridge.canOpenPad(quickPadId) || quickPadId === primaryId) throw new Error("Quick Pad unavailable")
    var previous = {id:companionId, ratio:savedRatio, open:paired}
    closeSecondaryParked(false)
    quickPadReturn = previous
    quickPadActive = true; companionId = quickPadId
    openGeneration++
    secondary = bridge.createView(nativeContainer, host)
    if (!secondary) throw new Error("Quick Pad view creation failed")
    bridge.openPadView(secondary, quickPadId)
    secondarySelected = true
    restoring = true; quickPadFitPending = true
    revealHeight = height
}
function restoreAfterQuickPad() {
    if (!quickPadActive) return
    quickPadActive = false; quickPadFitPending = false
    if (quickPadReturn) { companionId = quickPadReturn.id; savedRatio = quickPadReturn.ratio }
    quickPadReturn = null
}
function closeQuickPad() {
    if (!idle || !quickPadActive) return false
    var reopen = quickPadReturn && quickPadReturn.open
    return requestTransition("quick-pad-close", function() {
        closeSecondaryParked(false)
        if (reopen && companionId && bridge.canOpen(companionId)) openSecondaryParked()
    })
}
function fitQuickPadIfNeeded() {
    if (!quickPadActive || !quickPadFitPending) return true
    if (!transitionOwnsPark() || !inputGeometryPending || !secondary) throw new Error("Quick Pad fit outside park")
    if (!secondary.cnFitQuickPad()) throw new Error("Quick Pad page fit refused")
    quickPadFitPending = false
    return false // Fit may request native tiles; wait for the next ready turn.
}
