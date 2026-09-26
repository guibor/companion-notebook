// Quick Pad is one device-local notebook, independent of per-document pairs.
property bool quickPadActive: false
property bool quickPadCached: false
property bool quickPadChoosing: false
property bool quickPadFitPending: false
property var quickPadReturn: null
property string quickPadId: ""
property string quickPadCorner: "right"
property string quickPadSize: "wide"
property bool quickPadCompositing: false
property bool quickPadTransition: false
property bool quickPadStoreReady: false
readonly property real quickPadWidth: width * (quickPadSize === "compact" ? 0.5 : 2 / 3)
readonly property real quickPadHeight: height * (quickPadSize === "roomy" ? 0.5 : 1 / 3)
readonly property real quickPadX: quickPadCorner === "left" ? 0 : width - quickPadWidth
function loadQuickPad() {
    try {
        if (quickPadSettings.quickPadJson.length > 1024) throw new Error("Quick Pad settings too large")
        var p = JSON.parse(quickPadSettings.quickPadJson)
        if (!p || p.version !== 1 || (p.document !== "" && !Store.isId(p.document))
                || ["left", "right"].indexOf(p.corner) < 0
                || (p.size !== undefined && ["compact", "wide", "roomy"].indexOf(p.size) < 0)) throw new Error("Invalid Quick Pad settings")
        quickPadId = p.document; quickPadCorner = p.corner; quickPadSize = p.size || "wide"; quickPadStoreReady = true
    } catch (e) {
        quickPadStoreReady = false
        error = "Quick Pad settings could not be read. They have not been overwritten."
    }
}
function saveQuickPad(id, corner, size) {
    if (size === undefined) size = quickPadSize
    if (!quickPadStoreReady || (id !== "" && !Store.isId(id)) || ["left", "right"].indexOf(corner) < 0) return false
    if (["compact", "wide", "roomy"].indexOf(size) < 0) return false
    quickPadSettings.quickPadJson = JSON.stringify({version:1, document:id, corner:corner, size:size})
    quickPadSettings.sync()
    quickPadId = id; quickPadCorner = corner; quickPadSize = size
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
property string quickPadDraftSize: "wide"
function setQuickPadSize(size) {
    if (transitionPhase !== "choosing" || !quickPadChoosing || !transitionOwnsPark()) return false
    if (["compact", "wide", "roomy"].indexOf(size) < 0) return false
    quickPadDraftSize = size
    return true
}
function pickQuickPad(id) {
    if (transitionPhase !== "choosing" || !quickPadChoosing || !Store.isId(id)
            || id === primaryId || !bridge.canOpenPad(id)) return false
    if (bridge.sharingActive) { error = "Stop screen sharing before opening Quick Pad."; return false }
    return requestTransition("quick-pad-pick", function() {
        var retained = (quickPadActive || quickPadCached) ? quickPadReturn : null
        if (quickPadActive || quickPadCached) closeSecondaryParked(false)
        if (!saveQuickPad(id, quickPadDraftCorner, quickPadDraftSize)) throw new Error("Quick Pad settings refused")
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
    if (quickPadCached && secondary && bridge.padViewIsCurrent(secondary, quickPadId)) {
        quickPadCached = false; quickPadActive = true; companionId = quickPadId
        secondarySelected = true; revealHeight = height
        restoring = true; quickPadFitPending = true
        return
    }
    if (quickPadCached) closeSecondaryParked(false)
    var previous = {id:companionId, ratio:savedRatio, open:paired}
    closeSecondaryParked(false)
    quickPadReturn = previous
    quickPadCompositing = true
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
    if (!quickPadActive && !quickPadCached) return
    quickPadActive = false; quickPadCached = false; quickPadFitPending = false
    if (quickPadReturn) { companionId = quickPadReturn.id; savedRatio = quickPadReturn.ratio }
    quickPadReturn = null
}
function closeQuickPad() {
    if (!idle || !quickPadActive) return false
    var reopen = quickPadReturn && quickPadReturn.open
    return requestTransition("quick-pad-close", function() {
        if (!reopen && secondary) {
            // Native autosave remains alive, just like ordinary Companion tuck.
            // The hidden surface has no published pen region while unpaired.
            quickPadCached = true; quickPadActive = false
            secondarySelected = false; revealHeight = 0
            if (quickPadReturn) { companionId = quickPadReturn.id; savedRatio = quickPadReturn.ratio }
            return
        }
        closeSecondaryParked(false)
        if (reopen && companionId && bridge.canOpen(companionId)) openSecondaryParked()
    })
}
function fitQuickPadIfNeeded() {
    if (!cornerPaneActive || !quickPadFitPending) return true
    if (!transitionOwnsPark() || !inputGeometryPending || !secondary) throw new Error("Quick Pad fit outside park")
    if (!secondary.cnFitQuickPad()) throw new Error("Quick Pad page fit refused")
    quickPadFitPending = false
    return false // Fit may request native tiles; wait for the next ready turn.
}
