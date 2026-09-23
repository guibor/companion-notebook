property var fullReturn: null
property real returnRatio: -1
property real pendingLayout: -1
property string pendingLayoutSource: ""
property real pickerLayout: -1
readonly property bool isFullCompanion: !!fullReturn && primaryId === fullReturn.notes
function layoutChoice(ratio) {
    if (!mayShow || [0, 0.25, 0.375, 0.5, 1].indexOf(ratio) < 0) return false
    pendingLayoutSource = primaryId
    pendingLayout = Number(ratio)
    return true
}
function applyLayoutChoice(ratio) {
    if (!idle || !mayShow) return false
    if (isFullCompanion) {
        if (ratio === 1) return true
        returnRatio = ratio
        return requestTransition("document", function() { bridge.openPrimary(fullReturn.source, fullReturn.page) })
    }
    if (ratio === 0) return tuck()
    if (!companionId) {
        pickerLayout = ratio
        savedRatio = ratio === 1 ? 0.375 : ratio
        choose()
        return true
    }
    if (ratio === 1) {
        if (!companionId) return false
        rememberReversePair()
        var target = {source:primaryId, notes:companionId, page:String(bridge.primary.currentPageId)}
        return requestTransition("document", function() {
            closeSecondaryParked(false)
            fullReturn = target
            bridge.openPrimary(target.notes, "")
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
Timer {
    interval: 100; repeat: true; running: host.returnRatio >= 0 && !!host.fullReturn
    onTriggered: {
        if (!host.idle || host.primaryId !== host.fullReturn.source) return
        var ratio = host.returnRatio
        host.companionId = host.fullReturn.notes
        host.fullReturn = null; host.returnRatio = -1
        if (ratio > 0) { host.savedRatio = ratio; host.openSecondary() }
    }
}
