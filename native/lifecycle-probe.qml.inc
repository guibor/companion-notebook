// Native history, tools, async page creation/navigation and close/reopen.
// Only the diagnostic's two fresh IDs are eligible; no extra injected strokes.
property int probeLifecycleStep: 0
property bool probeLifecycleBusy: false
property bool probeLifecycleDone: false
property var probeOriginalPages: []
property var probeAddedPages: []
property var probeClosedView: null

function probeSolePrimary(view) {
    // Only the normal close/reopen interval may publish an unpaired candidate.
    // Retain the exact created primary view, document, scene and controller.
    return probeLifecycleBusy && (probeLifecycleStep === 11 || probeLifecycleStep === 12) && !secondary
        && view === bridge.primary && view === probeViews[0]
        && view.document && String(view.document.id) === probeDocuments[0]
        && view.cnProbeScene === probeScenes[0]
        && view.sceneController === probeControllers[0]
}
function probeLifecycleRequest(view, kind, value) {
    if (!view || !view.document || (!transitionOwnsPark() && transitionPhase !== "idle"))
        throw new Error("lifecycle operation is not ready")
    if (kind === "history") view.cnProbeHistory(value)
    else if (kind === "add") view.cnProbeAdd()
    else if (kind === "page") view.cnProbePage(value)
    else if (kind === "close") view.cnProbeClose()
    else throw new Error("unknown lifecycle operation")
    if (transitionPhase !== "draining" && transitionPhase !== "loading")
        throw new Error("native lifecycle operation did not enter its transaction")
}
function probeLifecycleTick() {
    if (!idle) return false
    if (!bridge.primary || !bridge.primary.document || String(bridge.primary.document.id) !== probeDocuments[0]
            || (secondary && secondary.document && String(secondary.document.id) !== probeDocuments[1]))
        throw new Error("lifecycle disposable document changed")
    var first = bridge.primary
    var second = secondary
    var state
    switch (probeLifecycleStep) {
    case 0:
        probeLifecycleBusy = true
        probeOriginalPages = [String(first.currentPageId),String(second.currentPageId)]
        if (!first.cnProbeState().undo || !second.cnProbeState().undo)
            throw new Error("native strokes have no history")
        probeLifecycleRequest(second,"history","undo"); break
    case 1:
        if (!second.cnProbeState().redo) throw new Error("secondary undo did not expose redo")
        if (!selectPane(true) || !action("Redo")) throw new Error("native bar redo refused")
        break
    case 2:
        if (second.cnProbeState().redo) throw new Error("secondary redo not completed")
        probeLifecycleRequest(first,"history","undo"); break
    case 3:
        if (!first.cnProbeState().redo) throw new Error("primary undo did not expose redo")
        probeLifecycleRequest(first,"history","redo"); break
    case 4:
        if (first.cnProbeState().redo) throw new Error("primary redo not completed")
        console.log("Companion lifecycle: history passed; panes=2; undo=true; redo=true")
        if (!selectPane(true) || !action("Erase")) throw new Error("native eraser selection refused")
        break
    case 5:
        state = second.cnProbeState()
        if (state.tool !== "eraser" || state.writing) throw new Error("native eraser was not selected")
        if (!action("Pen")) throw new Error("native pen selection refused")
        break
    case 6:
        state = second.cnProbeState()
        if (state.tool !== "primary" || !state.writing) throw new Error("native pen was not restored")
        console.log("Companion lifecycle: tools passed; eraser=true; pen=true")
        if (!action("＋")) throw new Error("secondary native add refused")
        break
    case 7:
        state = second.cnProbeState()
        if (state.pages !== 2 || !state.page || state.page === probeOriginalPages[1] || state.index !== 1)
            throw new Error("secondary new page was not selected")
        probeAddedPages = ["",state.page]
        probeLifecycleRequest(second,"page",0); break
    case 8:
        if (String(second.currentPageId) !== probeOriginalPages[1]) throw new Error("secondary original page not restored")
        probeLifecycleRequest(first,"add"); break
    case 9:
        state = first.cnProbeState()
        if (state.pages !== 2 || !state.page || state.page === probeOriginalPages[0] || state.index !== 1)
            throw new Error("primary new page was not selected")
        probeAddedPages = [state.page,probeAddedPages[1]]
        probeLifecycleRequest(first,"page",0); break
    case 10:
        if (String(first.currentPageId) !== probeOriginalPages[0]) throw new Error("primary original page not restored")
        console.log("Companion lifecycle: pages passed; original=" + probeOriginalPages.join(",") + "; added=" + probeAddedPages.join(","))
        probeViews = [first,second]
        probeScenes = [first.cnProbeScene,second.cnProbeScene]
        probeControllers = [first.sceneController,second.sceneController]
        probeClosedView = second
        probeLifecycleRequest(second,"close"); break
    case 11:
        if (secondary || paired || revealHeight !== 0 || companionId !== probeDocuments[1])
            throw new Error("native close retained an occupied pane or lost pairing")
        if (!openSecondary()) throw new Error("native companion reopen refused")
        break
    case 12:
        if (!second || second === probeClosedView || !bridge.viewReady(second)
                || String(second.currentPageId) !== probeOriginalPages[1])
            throw new Error("native companion reopen did not restore its original page")
        probeViews = [first,second]
        probeScenes = [first.cnProbeScene,second.cnProbeScene]
        probeControllers = [first.sceneController,second.sceneController]
        if (!probeIdentities() || !probeStable()) throw new Error("reopened native owners not stable")
        probeClosedView = null
        probeLifecycleDone = true; probeLifecycleBusy = false
        console.log("Companion lifecycle: native close/reopen passed; pairing=true; original-page=true")
        return true
    default: throw new Error("unknown lifecycle test phase")
    }
    probeLifecycleStep++
    return false
}
