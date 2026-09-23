property real pendingLayout: -1
property string pendingLayoutSource: ""
property real pickerLayout: -1
function layoutChoice(ratio) {
    if (!mayShow || [0, 0.25, 0.375, 0.5, 1].indexOf(ratio) < 0) return false
    pendingLayoutSource = primaryId
    pendingLayout = Number(ratio)
    return true
}
function applyLayoutChoice(ratio) {
    if (!idle || !mayShow) return false
    if (ratio === 0) return tuck()
    if (!companionId) {
        pickerLayout = ratio
        savedRatio = ratio === 1 ? 0.375 : ratio
        choose()
        return true
    }
    if (ratio === 1) {
        if (!companionId) return false
        var target = {source:primaryId, notes:companionId,
            sourcePage:String(bridge.primary.currentPageId || ""),
            page:secondary ? String(secondary.currentPageId || "") : String(pairs.pairs[primaryId]?.pageId || ""),
            ratio:savedRatio}
        return requestTransition("document", function() {
            closeSecondaryParked(false)
            // An explicit swap establishes the reverse pair, even if this
            // notebook previously had a different default companion.
            pairs = Store.set(pairs, target.notes, target.source, target.ratio, target.sourcePage)
            if (!persist()) throw new Error("Could not retain reverse pairing")
            bridge.openPrimary(target.notes, target.page)
        })
    }
    if (secondary) return chooseSize(ratio)
    savedRatio = ratio
    return openSecondary()
}
function rememberReversePair() {
    if (!storeReady || !primaryId || !companionId || pairs.pairs[companionId]) return
    pairs = Store.set(pairs, companionId, primaryId, savedRatio, String(bridge.primary.currentPageId || ""))
    persist()
}
Timer {
    interval: 80; repeat: true; running: host.pendingLayout >= 0
    onTriggered: {
        if (host.primaryId !== host.pendingLayoutSource || !host.mayShow) { host.pendingLayout = -1; return }
        if (!host.idle) return
        var ratio = host.pendingLayout
        host.pendingLayout = -1
        host.applyLayoutChoice(ratio)
    }
}
Timer {
    interval: 100; repeat: true; running: host.pickerLayout >= 0
    onTriggered: {
        if (!host.idle) return
        var ratio = host.pickerLayout
        host.pickerLayout = -1
        if (host.secondary && ratio === 1) host.layoutChoice(1)
    }
}
