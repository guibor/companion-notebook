// Two fresh native notes only. Ordinary user ink remains unqualified/disabled.
property int probePhase: 0
property int probeTicks: 0
property bool probeDocumentLocked: false
property bool probeWriting: false
property string probeFailure: ""
property var probeDocuments: []
property var probeViews: []
property var probeScenes: []
property var probeControllers: []
property var probeCounts: [0, 0]
property var probePending: [null, null]
property int probeSettledTicks: 0
property int probeRound: 1
property real probeHeight: 1080
property bool probeRetired: false
property int probeMoveStep: 0
property double probeMoveStarted: 0
Lifecycle.RetirementObserver {
    id: retirementObserver
    onRetired: function(generation) {
        if (generation !== 1 || host.probePhase !== 6 || !host.probeStable()
            || host.probeWriting || bridge.primary.penHandler || host.secondary.penHandler) {
            host.probeFail("unexpected native retirement acknowledgement"); return
        }
        host.probeRetired = true
        console.log("Companion retirement: both native handlers retired; generation=1")
    }
}
function probeFail(reason) {
    probeWriting = false
    retirementObserver.cancel()
    if (probeFailure) return
    probeFailure = String(reason)
    retirementProbeTimer.stop(); retirementMoveTimer.stop()
    console.warn("Companion ink: gate closed")
    console.warn("Companion probe: FAILED retirement " + probeFailure)
    // Independent watchdog stops this process. No personal document reopening.
}
function probeStable() {
    return probeDocuments.length === 2 && bridge.probeSeparate(host)
        && bridge.primary === probeViews[0] && secondary === probeViews[1]
        && bridge.primary.cnProbeScene === probeScenes[0] && secondary.cnProbeScene === probeScenes[1]
        && bridge.primary.sceneController === probeControllers[0] && secondary.sceneController === probeControllers[1]
        && width === 1620 && height === 2160 && revealHeight === probeHeight
        && (!dragging || probePhase === 7) && !restoring && !secondarySelected
        && (bridge.probeReadinessReason === "ready" || bridge.probeReadinessReason === "document-loading")
}
function probeAllows(view) {
    return probeWriting && !inputGeometryPending && !probeFailure && probeStable()
        && (view === probeViews[0] || view === probeViews[1])
}
function probeBeforeSubmit(view, stroke, targetController, inputHandler) {
    var i = view === probeViews[0] ? 0 : view === probeViews[1] ? 1 : -1
    var actual = stroke ? stroke.boundingRect : null
    var expected = i >= 0 ? view.cnProbeExpectedBounds(i) : null
    var fields = ["x", "y", "width", "height"]
    var values = [], expectedValues = []
    for (var k of fields) {
        values.push(actual ? actual[k] : undefined)
        expectedValues.push(expected ? expected[k] : undefined)
    }
    var controllerMatches = i >= 0 && targetController === probeControllers[i] && targetController === view.sceneController
    var handlerMatches = i >= 0 && inputHandler !== null && inputHandler === view.penHandler
    // Scalar receipt precedes native submission; no live Stroke object is retained.
    console.log("Companion retirement: received pane=" + i + "; round=" + probeRound
        + "; controller=" + controllerMatches + "; handler=" + handlerMatches
        + "; points=" + (stroke ? stroke.pointCount : "missing")
        + "; actual=" + values.join(",") + "; expected=" + expectedValues.join(","))
    if (!probeWriting || !probeStable() || (probePhase !== 4 && probePhase !== 10)
        || i < 0 || !controllerMatches || !handlerMatches || probePending[i] !== null
        || probeCounts[i] !== probeRound - 1 || !stroke
        || typeof stroke.pointCount !== "number" || !isFinite(stroke.pointCount)
        || Math.floor(stroke.pointCount) !== stroke.pointCount || stroke.pointCount < 2 || stroke.pointCount > 500) {
        probeFail("unexpected pre-submit owner/count/state"); return false
    }
    for (var n = 0; n < fields.length; ++n) {
        if (typeof values[n] !== "number" || typeof expectedValues[n] !== "number"
            || !isFinite(values[n]) || !isFinite(expectedValues[n]) || Math.abs(values[n] - expectedValues[n]) > 30) {
            probeFail("native stroke mapping mismatch before submit pane=" + i); return false
        }
    }
    var pending = probePending.slice()
    pending[i] = {round: probeRound, count: stroke.pointCount, bounds: values.slice(),
        controller: targetController, handler: inputHandler}
    probePending = pending
    return true
}
function probeSubmitted(view, stroke) {
    var i = view === probeViews[0] ? 0 : view === probeViews[1] ? 1 : -1
    var receipt = i >= 0 ? probePending[i] : null
    if (!probeWriting || !probeStable() || !receipt || receipt.round !== probeRound
        || receipt.controller !== view.sceneController || receipt.handler !== view.penHandler
        || probeCounts[i] !== probeRound - 1) {
        probeFail("submission without matching pre-submit receipt"); return
    }
    var pending = probePending.slice(); pending[i] = null; probePending = pending
    var counts = probeCounts.slice(); counts[i]++; probeCounts = counts
    console.log("Companion ink: submitted pane=" + i + "; points=" + receipt.count
        + "; bounds=" + receipt.bounds.join(",") + "; round=" + probeRound)
}
function probePanesReady() {
    return bridge.viewReady(bridge.primary) && bridge.viewReady(secondary) && bridge.probeReadinessReason === "ready"
}
function probeOpenGate() {
    if (!probeStable() || penDown || !bridge.primary.penHandler || !secondary.penHandler
        || bridge.primary.penHandler === secondary.penHandler || inputGeometryPending) throw new Error("pen rearm state invalid")
    probeWriting = true
    console.log("Companion retirement: round=" + probeRound + "; height=" + revealHeight)
    console.log("Companion ink: gate open; size=1620x2160; docs=" + probeDocuments.join(","))
}
Timer {
    id: retirementMoveTimer; interval: 16; repeat: true
    onTriggered: {
        try {
            if (host.probePhase !== 7 || !host.probeRetired || host.penDown
                || bridge.primary.penHandler || host.secondary.penHandler || !host.probeStable()) throw new Error("movement without retirement")
            host.probeHeight = 1080 + 20 * ++host.probeMoveStep
            host.revealHeight = host.probeHeight
            if (host.probeMoveStep < 12) return
            stop(); host.dragging = false; bridge.endAnimation(); host.probePhase = 8
            console.log("Companion retirement: live geometry moved; steps=" + host.probeMoveStep
                + "; elapsed-ms=" + (Date.now() - host.probeMoveStarted) + "; visual=unverified")
        } catch(e) { host.probeFail(String(e)) }
    }
}
Timer {
    id: retirementProbeTimer; interval: 100; repeat: true; running: true
    onTriggered: {
        try {
            if (++host.probeTicks > 1400) throw new Error("retirement probe timed out")
            if (host.error) throw new Error("native host error")
            if (host.probeDocumentLocked && !host.probeStable()) throw new Error("disposable identity/geometry changed")
            if (host.probePhase < 4 && host.penDown) throw new Error("physical pen active before arming")
            switch (host.probePhase) {
            case 0:
                if (!bridge.probeMayStart) return
                host.probeDocuments = bridge.probeCreate(); host.probePhase = 1; break
            case 1:
                if (!bridge.primary || !bridge.primary.document || String(bridge.primary.document.id) !== host.probeDocuments[0]
                    || !bridge.viewReady(bridge.primary)) return
                host.synchronizePrimary()
                if (!host.pick(host.probeDocuments[1])) throw new Error("second disposable did not open")
                host.probePhase = 2; break
            case 2:
                if (host.restoring || !bridge.probeSeparate(host)) return
                host.revealHeight = 1080
                host.probeViews = [bridge.primary, host.secondary]
                host.probeScenes = [bridge.primary.cnProbeScene, host.secondary.cnProbeScene]
                host.probeControllers = [bridge.primary.sceneController, host.secondary.sceneController]
                host.probePhase = 3; break
            case 3:
                if (!host.probePanesReady() || host.inputGeometryPending) return
                if (!host.probeStable()) throw new Error("unexpected Pro geometry")
                if (!bridge.primary.cnProbePreparePen() || !host.secondary.cnProbePreparePen()) throw new Error("native writing tool unavailable")
                host.probeDocumentLocked = true; host.probePhase = 4; host.probeOpenGate(); break
            case 4:
                if (host.probeCounts[0] !== 1 || host.probeCounts[1] !== 1 || host.penDown) return
                host.probeWriting = false; console.log("Companion ink: gate closed")
                host.probePhase = 5; break
            case 5:
                if (!host.probePanesReady() || host.penDown) return
                for (var view of host.probeViews)
                    if (view.cnRetirementReadiness() !== "ready") throw new Error("handler not ready to retire")
                if (!retirementObserver.arm(bridge.primary.penHandler, host.secondary.penHandler, 1))
                    throw new Error("observer refused: " + retirementObserver.lastError())
                host.probePhase = 6
                for (view of host.probeViews) if (!view.cnRetireHandler()) throw new Error("consumer detach refused")
                console.log("Companion retirement: normal destruction requested; generation=1"); break
            case 6:
                if (!host.probeRetired) return
                host.probePhase = 7; host.dragging = true; bridge.beginAnimation()
                host.probeMoveStarted = Date.now(); retirementMoveTimer.start(); break
            case 7: break
            case 8:
                if (!host.probePanesReady() || host.penDown) return
                if (!bridge.primary.cnCreateHandler() || !host.secondary.cnCreateHandler()) throw new Error("native recreation refused")
                host.probePhase = 9; break
            case 9:
                if (!host.probePanesReady() || host.penDown) return
                host.inputGeometryPending = true
                for (view of host.probeViews) if (!view.cnUpdateInputGeometry()) throw new Error("fresh native transform refused")
                host.inputGeometryPending = false
                host.probeRound = 2; host.probePhase = 10; host.probeOpenGate(); break
            case 10:
                if (host.probeCounts[0] !== 2 || host.probeCounts[1] !== 2 || host.penDown) return
                host.probeWriting = false; console.log("Companion ink: gate closed")
                host.probePhase = 11; break
            case 11:
                // Native autosave grace, not a durable save acknowledgement.
                if (++host.probeSettledTicks < 100) return
                console.log("Companion probe: retirement ink submissions completed; panes=2; strokes=4; durable=unverified")
                stop(); host.probePhase = 12; break
            }
        } catch(e) { host.probeFail(String(e)) }
    }
}
