// Ordinary fixed-preset lifecycle. Busy is UI-only until the real native
// worker acknowledges: an already-owned stroke keeps its old view and clips.
property string transitionPhase: "cold"
property int transitionGeneration: 0
property int transitionTicks: 0
property var transitionIntent: null
property var transitionBefore: []
property var transitionAfter: []
property bool transitionApplying: false
property bool inputGeometryPending: false
readonly property bool transitionBusy: transitionPhase !== "idle"
property bool transitionAvailabilityLost: false
// Read the native getter at the call boundary: phaseChanged is deliberately
// queued, whereas the native parked acknowledgement is emitted immediately.
function transitionOwnsPark() { return admissionGate.phase === "parked" }

Admission.AdmissionGate {
    id: admissionGate
    Component.onCompleted: {
        if (!initialize()) host.transitionFail("Native input initialization refused: " + error)
    }
    onReady: host.transitionPhase = "idle"
    onParked: function(generation) { host.transitionPark(generation) }
    onResumed: function(generation) { host.transitionComplete(generation) }
}

function transitionSnapshot() {
    var views = []
    if (bridge.primary && bridge.primary.document) views.push(bridge.primary)
    if (secondary && secondary.document) views.push(secondary)
    return views.map(function(view) {
        return { view: view, id: String(view.document.id), controller: view.sceneController }
    })
}
function transitionSame(records) {
    for (var record of records) {
        if (!record.view || !record.view.document || String(record.view.document.id) !== record.id
                || record.view.sceneController !== record.controller) return false
    }
    return true
}
function transitionFail(reason) {
    transitionTimer.stop()
    transitionPhase = "failed"
    error = "Companion is paused. The normal setup will be restored automatically."
    console.warn("Companion transition: FAILED " + String(reason))
    // No timeout, destructor or error handler releases a partly changed layout.
    // The bounded deployment controller restores the accepted normal runtime.
}
function requestTransition(name, apply) {
    if (typeof apply !== "function") return false
    if ((transitionPhase === "choosing" || (transitionPhase === "suspended" && name === "document" && !secondary))
            && transitionOwnsPark()) {
        transitionIntent = {name: name, apply: apply}
        applyTransition()
        return transitionPhase !== "failed"
    }
    if (transitionPhase !== "idle" || !bridge.penInput || !bridge.penInput.surfaceManager) return false
    transitionBefore = transitionSnapshot()
    transitionIntent = {name: name, apply: apply}
    transitionAvailabilityLost = !mayShow
    transitionTicks = 0
    transitionGeneration++
    transitionPhase = "draining"
    // Do NOT change modal, visibility, handler, transform or native layout flags here.
    if (!admissionGate.pause(bridge.penInput.surfaceManager, transitionGeneration)) {
        transitionFail("seal refused: " + admissionGate.error)
        return false
    }
    return true
}
function transitionPark(generation) {
    if (generation !== transitionGeneration || transitionPhase !== "draining") return
    if (!transitionSame(transitionBefore)) { transitionFail("old view changed before native acknowledgement"); return }
    inputGeometryPending = true
    for (var record of transitionBefore) {
        if (!record.view.cnAdmissionInputsDetached()) { transitionFail("old surface still attached"); return }
    }
    bridge.penInput.surfaceManager.updateRegions()
    applyTransition()
}
function applyTransition() {
    if (!transitionOwnsPark() || !inputGeometryPending || !transitionIntent) {
        transitionFail("mutation outside owned park"); return
    }
    try {
        transitionApplying = true
        var result = transitionIntent.apply()
        transitionApplying = false
        if (transitionPhase === "failed") return
        if (result === "choosing" && mayShow && !transitionAvailabilityLost) { transitionPhase = "choosing"; return }
        choosing = false
        transitionAfter = transitionSnapshot()
        transitionTicks = 0
        transitionPhase = "loading"
        transitionTimer.restart()
    } catch (e) {
        transitionApplying = false
        transitionFail(String(e))
    }
}
function transitionVisibleViews() {
    var views = []
    if (bridge.primary && bridge.primary.document) views.push(bridge.primary)
    if (paired && secondary && secondary.document) views.push(secondary)
    return views
}
function resumeAvailableInput() {
    if (transitionPhase !== "suspended" || !bridge.inputAvailable) return
    if (!transitionOwnsPark() || !inputGeometryPending || secondary) {
        transitionFail("suspended input lost its owned park"); return
    }
    transitionAvailabilityLost = false
    transitionAfter = transitionSnapshot()
    transitionTicks = 0
    transitionPhase = "loading"
    transitionTimer.restart()
}
Connections {
    target: bridge
    function onInputAvailableChanged() { host.resumeAvailableInput() }
}
function transitionAdvance() {
    if (transitionPhase !== "loading" && transitionPhase !== "settling") return
    try {
        if (++transitionTicks > 120) throw new Error("native view readiness timed out")
        if (!transitionOwnsPark() || !inputGeometryPending) throw new Error("park ownership lost")
        if (!pageOperationsReady()) return
        if (transitionAvailabilityLost || !mayShow) {
            // An availability change is retained even if it arrived mid-drain.
            // Collapse only now, while the native worker is owned and parked.
            transitionApplying = true
            choosing = false
            if (secondary || choosing) closeSecondaryParked(false)
            transitionApplying = false
            transitionAvailabilityLost = false
            transitionAfter = transitionSnapshot()
        }
        if (!bridge.inputAvailable) {
            // No visible primary can publish a fresh candidate. Retain the
            // owned park without polling through sleep/library; stock document
            // open can continue in this same park, and wake resumes validation.
            // Never pretend that updateRegions on an empty cache is a fence.
            transitionPhase = "suspended"
            transitionTimer.stop()
            return
        }
        // Controller construction may complete asynchronously; freeze identities
        // only once every expected native view is actually ready.
        var views = transitionVisibleViews()
        for (var view of views) {
            if (!bridge.viewReady(view)) return
            var reason = view.cnInputGeometryReadiness()
            if (reason === "loading") return
            if (reason !== "ready" || !view.cnAdmissionInputsDetached()) throw new Error("unsafe target geometry: " + reason)
        }
        if (!editOperationsReady(views)) return
        if (transitionPhase === "loading") {
            for (var expected of transitionAfter) {
                if (!expected.view || !expected.view.document || String(expected.view.document.id) !== expected.id)
                    throw new Error("target document changed while opening")
            }
            transitionAfter = transitionSnapshot()
            for (view of views) if (!view.cnAdmissionConstrainToPane()) throw new Error("parked clamp refused")
            transitionPhase = "settling"
            return // A clamp can request tiles. Wait for a later ready event-loop turn.
        }
        if (!transitionSame(transitionAfter)) throw new Error("target controller changed after readiness")
        for (view of views) {
            if (!view.cnUpdateInputGeometry() || !view.cnAdmissionInputsDetached()) throw new Error("final transform refused")
        }
        bridge.penInput.surfaceManager.updateRegions()
        restoring = false
        if (!admissionGate.permitPublication(transitionGeneration)) throw new Error("publication refused: " + admissionGate.error)
        transitionPhase = "publishing"
        inputGeometryPending = false
        if (!admissionGate.finish(transitionGeneration)) throw new Error("fresh candidates missing: " + admissionGate.error)
        transitionTimer.stop()
        // Keep chrome shielded through the module's queued resumed event, not
        // merely through the synchronous finish call or a producer pen-up signal.
    } catch (e) { transitionFail(String(e)) }
}
function transitionComplete(generation) {
    if (generation !== transitionGeneration || transitionPhase !== "publishing" || admissionGate.phase !== "ready") return
    transitionPhase = "idle"
    transitionIntent = null
    transitionBefore = []; transitionAfter = []
    checkpoint()
    bridge.endAnimation()
    console.log("Companion transition: completed; generation=" + generation + "; height=" + revealHeight)
    if (transitionAvailabilityLost || !mayShow) hideWhenUnavailable()
}
Timer { id: transitionTimer; interval: 100; repeat: true; onTriggered: host.transitionAdvance() }

// Keep the same shield object for the lifetime of the host. A fallback Qt
// contact retains its grab until its OWN release/cancel, even after publication.
MouseArea {
    id: transitionShield
    anchors.fill: parent; z: 10000
    enabled: (host.transitionBusy && host.transitionPhase !== "choosing" && host.transitionPhase !== "suspended") || pressed
    acceptedButtons: Qt.AllButtons
    preventStealing: true
    propagateComposedEvents: false
    onWheel: function(event) { event.accepted = true }
}

property var pendingToolbarOwner: null
function noteToolbarOwner(view) {
    if (view !== bridge.primary && view !== secondary) return
    pendingToolbarOwner = view
    toolbarOwnerTimer.restart()
}
Timer {
    id: toolbarOwnerTimer; interval: 30; repeat: true
    onTriggered: {
        if (!host.idle) return
        var view = host.pendingToolbarOwner
        host.pendingToolbarOwner = null; stop()
        if (view === bridge.primary) host.selectPane(false)
        else if (view && view === host.secondary && host.paired) host.selectPane(true)
    }
}
