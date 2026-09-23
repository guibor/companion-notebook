// Included in NativeHost, alongside transactions.qml.inc. No native mutation
// is allowed until the existing admission transaction owns the parked worker.
// One pending native add keeps that transaction in loading, with its timeout.
property var pagePendingAdd: null

function pageOwner(view) {
    if (view && view === bridge.primary) return "primary"
    if (view && view === secondary) return "secondary"
    return ""
}
function pageCapture(view) {
    var owner = pageOwner(view)
    if (!owner || !view.document || !view.sceneController || !view.currentPageId) return null
    return { view: view, owner: owner, document: view.document,
        documentId: String(view.document.id), pageId: String(view.currentPageId),
        controller: view.sceneController, handler: view.penHandler,
        generation: transitionGeneration, ownerGeneration: openGeneration }
}
function pageTokenCurrent(token) {
    return !!token && token.generation === transitionGeneration
        && token.ownerGeneration === openGeneration && pageOwner(token.view) === token.owner
        && !!token.view.document && token.view.document === token.document
        && String(token.view.document.id) === token.documentId
        && String(token.view.currentPageId) === token.pageId
        && token.view.sceneController === token.controller && token.view.penHandler === token.handler
}
function pageOperationFailed(reason) {
    if (transitionPhase !== "failed") transitionFail("page operation: " + reason)
    return false
}
function pageMayMutate(view) {
    return !!pageOwner(view) && transitionApplying && transitionOwnsPark()
        && inputGeometryPending && transitionPhase !== "failed" && mayShow && !transitionAvailabilityLost
        && (!pagePendingAdd || (pagePendingAdd.completing && pagePendingAdd.view === view))
}
function pageOperation(view, operation) {
    if (typeof operation !== "function") return false
    // Nested openPage -> goToPageId uses the same parked transaction. This also
    // permits initial page selection inside a parked native document open.
    if (pageMayMutate(view)) {
        operation()
        if (transitionPhase === "failed") throw new Error("nested page operation failed")
        return true
    }
    if (transitionApplying || transitionPhase !== "idle" || pagePendingAdd
            || !mayShow || transitionAvailabilityLost) return false
    var token = pageCapture(view)
    if (!token) return false
    token.generation++ // requestTransition increments before asking for a park.
    return requestTransition("page", function() {
        if (!pageTokenCurrent(token) || !pageMayMutate(view))
            throw new Error("page owner changed before native park")
        operation()
        // A synchronous native callback may report failure without throwing.
        // Do not let applyTransition overwrite that failure with loading.
        if (transitionPhase === "failed") throw new Error("page operation failed")
    })
}
function pageAddBegin(view, index) {
    if (!pageMayMutate(view) || pagePendingAdd) {
        pageOperationFailed("add started outside an unoccupied native park")
        return null
    }
    var token = pageCapture(view)
    var count = token ? token.document.pageCount : -1
    if (!token || !Number.isInteger(index) || !Number.isInteger(count)
            || count < 1 || index < 0 || index > count) {
        pageOperationFailed("invalid add destination")
        return null
    }
    // The native callback returns no page. Its captured insertion index is not
    // sufficient after a concurrent page-map change: require an actual new UUID.
    var known = Object.create(null)
    for (var i = 0; i < count; ++i) {
        var id = String(token.document.idForPage(i) || "")
        if (!id || known[id]) { pageOperationFailed("invalid source page map"); return null }
        known[id] = true
    }
    if (!known[token.pageId] || token.document.pageCount !== count || !pageTokenCurrent(token)) {
        pageOperationFailed("source page map changed while preparing add")
        return null
    }
    token.index = index; token.count = count; token.knownPages = known
    token.used = false; token.completing = false
    pagePendingAdd = token
    return token
}
function pageAddComplete(token, operation) {
    // A duplicate or obsolete callback is a no-op, including after successful
    // completion or after another operation has acquired a different token.
    if (!token || token !== pagePendingAdd || token.used) return false
    token.used = true
    if (typeof operation !== "function" || !pageTokenCurrent(token)
            || !transitionOwnsPark() || !inputGeometryPending || !mayShow
            || transitionAvailabilityLost || transitionPhase === "failed"
            || (!transitionApplying && transitionPhase !== "loading"))
        return pageOperationFailed("stale add callback")
    var targetId = String(token.document.idForPage(token.index) || "")
    if (token.document.pageCount !== token.count + 1 || !targetId || token.knownPages[targetId])
        return pageOperationFailed("add callback has no unique new target page")
    // Existing pages must still exist exactly once; do not accept a concurrent
    // removal/replacement that happens to preserve the expected total count.
    var seen = Object.create(null)
    for (var i = 0; i < token.document.pageCount; ++i) {
        var id = String(token.document.idForPage(i) || "")
        if (!id || seen[id] || (!token.knownPages[id] && id !== targetId))
            return pageOperationFailed("page map changed during add")
        seen[id] = true
    }
    for (var oldId in token.knownPages)
        if (!seen[oldId]) return pageOperationFailed("source page disappeared during add")
    var wasApplying = transitionApplying
    token.completing = true
    transitionApplying = true
    try {
        // All validation precedes even root.addingPage = false in the caller.
        operation(token.index, targetId)
        if (pageOwner(token.view) !== token.owner || token.view.document !== token.document
                || String(token.view.document.id) !== token.documentId
                || String(token.view.currentPageId) !== targetId
                || token.generation !== transitionGeneration || token.ownerGeneration !== openGeneration
                || !transitionOwnsPark() || !inputGeometryPending || transitionPhase === "failed")
            throw new Error("new page was not selected by its original owner")
        pagePendingAdd = null
        // Synchronous completion returns to applyTransition, which takes its
        // own post-operation snapshot. Async completion must replace the old one.
        if (!wasApplying) {
            transitionAfter = transitionSnapshot()
            transitionPhase = "loading"
            transitionTicks = 0
            transitionTimer.restart()
        }
        return true
    } catch (e) {
        return pageOperationFailed(String(e))
    } finally {
        token.completing = false
        transitionApplying = wasApplying
    }
}
function pageOperationsReady() {
    if (!pagePendingAdd) return true
    if (pagePendingAdd.used || !pageTokenCurrent(pagePendingAdd) || !transitionOwnsPark()
            || !inputGeometryPending || !mayShow || transitionAvailabilityLost)
        return pageOperationFailed("pending add lost its original owner or park")
    return false // Still loading; never publish the old page while native add runs.
}
