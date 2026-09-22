// Two disposable notes. Native startup capture + an in-flight-stroke seal,
// worker park, one discrete preset change, then two more native submissions.
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
property bool probeStartupReady: false
Admission.AdmissionGate {
    id: admissionGate
    Component.onCompleted: {
        if (!initialize()) host.probeFail("cold worker initialization refused: " + error)
    }
    onReady: {
        host.probeStartupReady = true
        console.log("Companion admission: cold native worker roundtrip passed")
    }
    onParked: function(generation) {
        try {
            if (!host.probeStable() || host.penDown || !host.probeStartupReady)
                throw new Error("native handoff state changed")
            if (generation === 1 && host.probePhase === 5) {
                if (host.probeCounts[0] !== 1 || host.probeCounts[1] !== 1
                    || host.probePending[0] || host.probePending[1])
                    throw new Error("earlier strokes did not reach controllers before park")
                console.log("Companion admission: drained during stroke; submissions=2; generation=1")
                host.probeWriting = false
                host.inputGeometryPending = true
                for (var view of host.probeViews)
                    if (!view.cnAdmissionInputsDetached()) throw new Error("old native surface still attached")
                bridge.penInput.surfaceManager.updateRegions()
                host.probeHeight = 1440
                host.revealHeight = 1440
                host.probePhase = 6
            } else if (generation === 2 && host.probePhase === 11) {
                if (host.probeCounts[0] !== 2 || host.probeCounts[1] !== 2)
                    throw new Error("final submissions missing")
                host.probeWriting = false
                host.inputGeometryPending = true
                bridge.penInput.surfaceManager.updateRegions()
                console.log("Companion ink: gate closed")
                host.probePhase = 12
                // Remain sealed/parked through autosave and external recovery.
                // No unsafe resume or personal document reopen on teardown.
            } else throw new Error("unexpected parked generation")
        } catch (e) { host.probeFail(String(e)) }
    }
}
Connections {
    target: bridge.penInput
    function onPenDownChanged(down) {
        if (!down || host.probePhase !== 4 || host.probeCounts[0] !== 1
            || host.probeCounts[1] !== 0) return
        // Intent only. Keep old clips, handlers, controllers and writing gates
        // unchanged until the REAL worker acknowledgement arrives.
        host.probePhase = 5
        if (!admissionGate.pause(bridge.penInput.surfaceManager, 1))
            host.probeFail("during-stroke seal refused: " + admissionGate.error)
        else console.log("Companion admission: transition requested during second stroke")
    }
}
function probeFail(reason) {
    if (probeFailure) return
    probeFailure = String(reason)
    admissionProbeTimer.stop()
    console.warn("Companion probe: FAILED admission " + probeFailure)
    // External recovery stops the candidate. Never release a partial transition.
}
function probeStable() {
    return probeDocuments.length === 2 && bridge.probeSeparate(host)
        && bridge.primary === probeViews[0] && secondary === probeViews[1]
        && bridge.primary.cnProbeScene === probeScenes[0] && secondary.cnProbeScene === probeScenes[1]
        && bridge.primary.sceneController === probeControllers[0] && secondary.sceneController === probeControllers[1]
        && width === 1620 && height === 2160 && revealHeight === probeHeight
        && !dragging && !restoring && !secondarySelected
        && (bridge.probeReadinessReason === "ready" || bridge.probeReadinessReason === "document-loading")
}
function probeAllows(view) {
    return probeWriting && !inputGeometryPending && probeStable()
        && (view === probeViews[0] || view === probeViews[1])
}
// RECEIPT_FUNCTIONS
function probePanesReady() {
    return bridge.viewReady(bridge.primary) && bridge.viewReady(secondary)
        && bridge.probeReadinessReason === "ready"
}
Timer {
    id: admissionProbeTimer; interval: 100; repeat: true; running: true
    onTriggered: {
        try {
            if (++host.probeTicks > 1200) throw new Error("admission probe timed out")
            if (host.error) throw new Error("native host error")
            if (host.probeDocumentLocked && !host.probeStable()) throw new Error("disposable state changed")
            if (host.probePhase < 4 && host.penDown) throw new Error("physical pen active before arming")
            switch (host.probePhase) {
            case 0:
                if (!host.probeStartupReady || !bridge.probeMayStart) return
                host.probeDocuments = bridge.probeCreate(); host.probePhase = 1; break
            case 1:
                if (!bridge.primary || !bridge.primary.document
                    || String(bridge.primary.document.id) !== host.probeDocuments[0]
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
                if (!bridge.primary.cnProbePreparePen() || !host.secondary.cnProbePreparePen())
                    throw new Error("native writing tool unavailable")
                host.probeDocumentLocked = true; host.probePhase = 4
                host.probeWriting = true
                console.log("Companion ink: gate open; size=1620x2160; docs=" + host.probeDocuments.join(","))
                break
            case 4:
                if (host.probeCounts[1] !== 0) throw new Error("missed during-stroke transition intent")
                break
            case 5: break // Only native worker acknowledgement advances this.
            case 6:
                if (!host.probePanesReady()) return
                for (var view of host.probeViews) {
                    if (!view.cnAdmissionInputsDetached() || !view.cnAdmissionConstrainToPane())
                        throw new Error("detached pane constraint refused")
                }
                host.probePhase = 7; break
            case 7:
                // A clamp can request native tiles. Wait for a later ready tick
                // while still sealed and parked, then refresh final transforms.
                if (!host.probePanesReady()) return
                for (view of host.probeViews) {
                    if (!view.cnAdmissionInputsDetached() || !view.cnUpdateInputGeometry()
                        || !view.cnAdmissionInputsDetached()) throw new Error("detached geometry refresh refused")
                }
                bridge.penInput.surfaceManager.updateRegions()
                if (!admissionGate.permitPublication(1)) throw new Error("publication refused: " + admissionGate.error)
                host.probeRound = 2; host.probePhase = 10
                host.inputGeometryPending = false; host.probeWriting = true
                if (!admissionGate.finish(1)) throw new Error("fresh native candidates missing: " + admissionGate.error)
                bridge.endAnimation()
                console.log("Companion admission: round=2; height=1440; fresh-candidates=true")
                console.log("Companion ink: gate open; size=1620x2160; docs=" + host.probeDocuments.join(","))
                break
            case 10:
                if (host.probeCounts[0] !== 2 || host.probeCounts[1] !== 2 || host.penDown) return
                host.probePhase = 11
                if (!admissionGate.pause(bridge.penInput.surfaceManager, 2))
                    throw new Error("final seal refused: " + admissionGate.error)
                break
            case 11: break
            case 12:
                if (++host.probeSettledTicks < 100) return
                console.log("Companion probe: admission ink submissions completed; panes=2; strokes=4; durable=unverified")
                stop(); host.probePhase = 13; break
            }
        } catch (e) { host.probeFail(String(e)) }
    }
}
