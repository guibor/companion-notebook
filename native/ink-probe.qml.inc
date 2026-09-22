// Bounded, fixed-layout diagnostic. Only two newly created disposable notebooks
// can receive native ink. No document/layout changes after arming, even on failure.
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
property int probeSettledTicks: 0
function probeFail(reason) {
    probeWriting = false
    if (probeFailure) return
    probeFailure = String(reason)
    inkProbeTimer.stop()
    console.warn("Companion ink: gate closed")
    console.warn("Companion probe: FAILED ink " + probeFailure)
    // Watchdog ends this UI process. Never rebind a live handler to the original
    // personal document or tear down one of these views from this callback.
}
function probeStable() {
    return probeDocuments.length === 2 && bridge.probeSeparate(host)
        && bridge.primary === probeViews[0] && secondary === probeViews[1]
        && bridge.primary.cnProbeScene === probeScenes[0] && secondary.cnProbeScene === probeScenes[1]
        && bridge.primary.sceneController === probeControllers[0] && secondary.sceneController === probeControllers[1]
        && width === 1620 && height === 2160 && revealHeight === 1080
        && !dragging && !restoring && !secondarySelected
        && (bridge.probeReadinessReason === "ready" || bridge.probeReadinessReason === "document-loading")
}
function probeAllows(view) {
    return probeWriting && !inputGeometryPending && !probeFailure && probeStable()
        && (view === probeViews[0] || view === probeViews[1])
}
function probeSubmitted(view, stroke) {
    if (!probeWriting || !probeStable()) { probeFail("stroke outside fixed disposable state"); return }
    var i = view === probeViews[0] ? 0 : view === probeViews[1] ? 1 : -1
    if (i < 0 || probeCounts[i] !== 0 || !stroke || stroke.pointCount < 2 || stroke.pointCount > 500) {
        probeFail("unexpected stroke owner/count"); return
    }
    var expected = view.cnProbeExpectedBounds(i), actual = stroke.boundingRect
    function finite(n) { return typeof n === "number" && isFinite(n) }
    for (var k of ["x", "y", "width", "height"]) {
        if (!actual || !expected || !finite(actual[k]) || !finite(expected[k])
            || Math.abs(actual[k] - expected[k]) > 30) {
            probeFail("native stroke mapping mismatch pane=" + i); return
        }
    }
    var counts = probeCounts.slice(); counts[i]++; probeCounts = counts
    console.log("Companion ink: submitted pane=" + i + "; points=" + stroke.pointCount
        + "; bounds=" + [actual.x,actual.y,actual.width,actual.height].join(","))
}
Timer {
    id: inkProbeTimer; interval: 100; repeat: true; running: true
    onTriggered: {
        try {
            if (++host.probeTicks > 1100) throw new Error("fixed ink probe timed out")
            if (host.error) throw new Error("native host error")
            if (host.probeDocumentLocked && !host.probeStable()) throw new Error("fixed disposable state changed")
            if (host.probePhase < 4 && host.penDown) throw new Error("physical pen active before arming")
            switch (host.probePhase) {
            case 0:
                if (!bridge.probeMayStart) return
                host.probeDocuments = bridge.probeCreate(); host.probePhase = 1
                break
            case 1:
                if (!bridge.primary || !bridge.primary.document || String(bridge.primary.document.id) !== host.probeDocuments[0]
                    || !bridge.viewReady(bridge.primary)) return
                host.synchronizePrimary()
                if (!host.pick(host.probeDocuments[1])) throw new Error("second disposable did not open")
                host.probePhase = 2
                break
            case 2:
                if (host.restoring || !bridge.probeSeparate(host)) return
                host.revealHeight = 1080
                host.probeViews = [bridge.primary, host.secondary]
                host.probeScenes = [bridge.primary.cnProbeScene, host.secondary.cnProbeScene]
                host.probeControllers = [bridge.primary.sceneController, host.secondary.sceneController]
                host.probePhase = 3
                break
            case 3:
                if (!bridge.viewReady(bridge.primary) || !bridge.viewReady(host.secondary) || host.inputGeometryPending) return
                if (bridge.probeReadinessReason !== "ready") return
                if (!host.probeStable()) throw new Error("unexpected Pro geometry")
                if (!bridge.primary.cnProbePreparePen() || !host.secondary.cnProbePreparePen()) throw new Error("native writing tool unavailable")
                host.probeDocumentLocked = true
                host.probePhase = 4
                host.probeWriting = true
                console.log("Companion ink: gate open; size=1620x2160; docs=" + host.probeDocuments.join(","))
                break
            case 4:
                if (host.probeCounts[0] !== 1 || host.probeCounts[1] !== 1 || host.penDown) return
                // Both strokes reached the native controller in the correct pane.
                // Close only future eligibility; do not move/rebind/destroy views.
                host.probeWriting = false
                console.log("Companion ink: gate closed")
                host.probePhase = 5
                break
            case 5:
                // Allow ordinary native autosave; this delay is NOT a persistence
                // acknowledgement. Saved files must be checked after base recovery.
                if (++host.probeSettledTicks < 100) return
                console.log("Companion probe: fixed ink submissions completed; panes=2; durable=unverified")
                stop(); host.probePhase = 6
                break
            }
        } catch (e) { host.probeFail(String(e)) }
    }
}
