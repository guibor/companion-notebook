// Disposable-only driver exercising the ACTUAL ordinary lifecycle functions.
// The regular source remains inkQualified:false; only this bounded profile is on.
property bool ordinaryProbe: true
property int probePhase: 0
property int probeTicks: 0
property int probeRound: 1
property int probeSettledTicks: 0
property bool probeWriting: false
property bool probeDocumentLocked: false
property string probeFailure: ""
property var probeDocuments: []
property var probeViews: []
property var probeScenes: []
property var probeControllers: []
property var probeCounts: [0, 0]
property var probePending: [null, null]
property real probeHeight: 1080
function probeFail(reason) {
    if (probeFailure) return
    probeFailure = String(reason)
    ordinaryProbeTimer.stop()
    console.warn("Companion probe: FAILED ordinary " + probeFailure)
    // Do not change native eligibility on an error before the worker is parked.
    // The independent bounded controller kills the candidate and restores base.
}
function probeIdentities() {
    return probeDocuments.length === 2 && bridge.probeSeparate(host)
        && bridge.primary === probeViews[0] && secondary === probeViews[1]
        && bridge.primary.cnProbeScene === probeScenes[0] && secondary.cnProbeScene === probeScenes[1]
        && bridge.primary.sceneController === probeControllers[0] && secondary.sceneController === probeControllers[1]
        && width === 1620 && height === 2160
}
function probeStable() {
    return probeIdentities() && revealHeight === probeHeight && !dragging && !restoring
        && (bridge.probeReadinessReason === "ready" || bridge.probeReadinessReason === "document-loading")
}
function probeAllows(view) {
    // This also permits final candidate publication during the first pair open,
    // before the driver snapshots ready controllers. Submission is stricter.
    return probeWriting && probeDocuments.length === 2 && bridge.probeSeparate(host)
        && ((view === bridge.primary && String(view.document.id) === probeDocuments[0])
            || (view === secondary && String(view.document.id) === probeDocuments[1]))
}
// RECEIPT_FUNCTIONS
Timer {
    id: ordinaryProbeTimer; interval: 100; repeat: true; running: true
    onTriggered: {
        try {
            if (++host.probeTicks > 1400) throw new Error("ordinary lifecycle timed out")
            if (host.error || host.transitionPhase === "failed") throw new Error("native host transaction failed")
            if (host.probePhase > 0 && bridge.probeReadinessReason !== "ready"
                    && bridge.probeReadinessReason !== "document-loading") throw new Error("screen state changed")
            if (host.probeDocumentLocked && !host.probeIdentities()) throw new Error("disposable owner changed")
            if (host.probePhase < 4 && host.penDown) throw new Error("physical pen active before arming")
            switch (host.probePhase) {
            case 0:
                if (host.transitionPhase !== "idle" || !bridge.probeMayStart) return
                console.log("Companion ordinary: cold native worker roundtrip passed")
                host.probeDocuments = bridge.probeCreate(); host.probePhase = 1; break
            case 1:
                if (!bridge.primary || !bridge.primary.document || String(bridge.primary.document.id) !== host.probeDocuments[0]
                        || !bridge.viewReady(bridge.primary) || host.transitionPhase !== "idle") return
                host.synchronizePrimary(); host.choose(); host.probePhase = 2; break
            case 2:
                if (host.transitionPhase !== "choosing") return
                host.probeWriting = true
                if (!host.pick(host.probeDocuments[1])) throw new Error("ordinary picker refused disposable")
                host.probePhase = 3; break
            case 3:
                if (host.transitionPhase !== "idle" || !bridge.probeSeparate(host)) return
                host.probeViews = [bridge.primary, host.secondary]
                host.probeScenes = [bridge.primary.cnProbeScene, host.secondary.cnProbeScene]
                host.probeControllers = [bridge.primary.sceneController, host.secondary.sceneController]
                // Tool selection is now asynchronous outside an owned park.
                // Prepare both panes in one transaction, then request the preset
                // only after publication; never race two tool requests and size.
                if (!host.requestTransition("probe-tools", function() {
                    if (!bridge.primary.cnProbePreparePen() || !host.secondary.cnProbePreparePen())
                        throw new Error("native writing tool unavailable")
                })) throw new Error("ordinary pen preparation refused")
                host.probePhase = 21; break
            case 21:
                if (host.transitionPhase !== "idle") return
                if (!host.probeIdentities()) throw new Error("pen preparation changed disposable ownership")
                host.probeDocumentLocked = true
                if (!host.chooseSize(1 / 2)) throw new Error("ordinary half preset refused")
                host.probePhase = 20; break
            case 20:
                if (host.transitionPhase !== "idle") return
                if (!host.probeStable() || host.inputGeometryPending) throw new Error("half preset did not publish")
                host.probePhase = 4
                console.log("Companion ink: gate open; size=1620x2160; docs=" + host.probeDocuments.join(","))
                break
            case 4:
                if (host.probeCounts[0] !== 1 || host.probeCounts[1] !== 1 || host.penDown || !host.idle) return
                if (!host.chooseSize(2 / 3)) throw new Error("ordinary two-thirds preset refused")
                host.probePhase = 5; break
            case 5:
                if (host.transitionPhase !== "idle") return
                host.probeHeight = 1440
                if (!host.probeStable() || host.inputGeometryPending) throw new Error("two-thirds preset did not publish")
                host.probeRound = 2; host.probePhase = 10
                console.log("Companion ordinary: preset completed; height=1440; fresh-candidates=true")
                console.log("Companion ink: gate open; size=1620x2160; docs=" + host.probeDocuments.join(","))
                break
            case 10:
                if (host.probeCounts[0] !== 2 || host.probeCounts[1] !== 2 || host.penDown || !host.idle) return
                if (!host.tuck()) throw new Error("ordinary tuck refused")
                host.probePhase = 11; break
            case 11:
                if (host.transitionPhase !== "idle") return
                if (host.revealHeight !== 0 || !host.secondary || host.savedRatio !== 2 / 3) throw new Error("tuck lost retained view or size")
                if (!host.openSecondary()) throw new Error("ordinary retained reveal refused")
                host.probePhase = 12; break
            case 12:
                if (host.transitionPhase !== "idle") return
                if (!host.probeStable()) throw new Error("retained reveal changed view")
                host.choose(); host.probePhase = 13; break
            case 13:
                if (host.transitionPhase !== "choosing") return
                host.dismissChooser(); host.probePhase = 14; break
            case 14:
                if (host.transitionPhase !== "idle") return
                if (!host.probeStable() || host.inputGeometryPending || host.choosing) throw new Error("picker cancel did not restore views")
                console.log("Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true")
                if (!host.requestTransition("probe-finish", function() {
                    host.probeWriting = false
                    console.log("Companion ink: gate closed")
                    return "choosing" // Park without a dialog, through autosave and external recovery.
                })) throw new Error("final ordinary seal refused")
                host.probePhase = 15; break
            case 15:
                if (host.transitionPhase !== "choosing" || !host.inputGeometryPending || !host.transitionOwnsPark()) return
                if (++host.probeSettledTicks < 100) return
                console.log("Companion probe: ordinary ink submissions completed; panes=2; strokes=4; durable=unverified")
                stop(); host.probePhase = 16; break
            }
        } catch (e) { host.probeFail(String(e)) }
    }
}
