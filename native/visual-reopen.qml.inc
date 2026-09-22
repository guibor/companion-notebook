// Pen-disabled native reopen; external read-only framebuffer acquisition only.
// No QML image grabs, layers, server, personal-note reopening or notebook writes.
property int probePhase: 0
property int probeTicks: 0
property int visualSettled: 0
property int visualHeld: 0
property int visualStage: 0
property string probeFailure: ""
property var probeDocuments: []
property var visualViews: []
property var visualControllers: []
function probeFail(reason) {
    if (probeFailure) return
    probeFailure = String(reason)
    visualTimer.stop()
    console.warn("Companion visual: gate closed")
    console.warn("Companion probe: FAILED visual " + probeFailure)
    // Watchdog restores base. Never return to a personal view during capture.
}
function visualStable() {
    return bridge.probeSeparate(host) && bridge.primary === visualViews[0]
        && secondary === visualViews[1] && bridge.primary.sceneController === visualControllers[0]
        && secondary.sceneController === visualControllers[1]
        && !bridge.primary.cnInkAllowed && !secondary.cnInkAllowed
        && width === 1620 && height === 2160 && !dragging && !restoring
        && revealHeight === (visualStage === 1 ? 1320 : 1680)
}
Timer {
    id: visualTimer; interval: 100; repeat: true; running: true
    onTriggered: {
        try {
            if (++host.probeTicks > 1500) throw new Error("visual reopen timed out")
            if (host.penDown || host.error) throw new Error("pen or host error")
            if (host.probePhase > 0 && bridge.probeReadinessReason !== "ready"
                && bridge.probeReadinessReason !== "document-loading") throw new Error("screen state changed")
            switch (host.probePhase) {
            case 0:
                if (!bridge.probeMayStart) return
                host.probeDocuments = bridge.probeCreate(); host.probePhase = 1; break
            case 1:
                if (!bridge.primary || !bridge.primary.document
                    || String(bridge.primary.document.id) !== host.probeDocuments[0]
                    || !bridge.viewReady(bridge.primary)) return
                host.synchronizePrimary()
                if (!host.pick(host.probeDocuments[1])) throw new Error("second saved note did not open")
                host.probePhase = 2; break
            case 2:
                if (host.restoring || !bridge.viewReady(bridge.primary) || !bridge.viewReady(host.secondary)) return
                if (!bridge.probeSeparate(host)) throw new Error("saved note identities changed")
                host.visualViews = [bridge.primary, host.secondary]
                host.visualControllers = [bridge.primary.sceneController, host.secondary.sceneController]
                host.visualStage = 1; host.revealHeight = 1320; host.probePhase = 3
                bridge.primary.cnRefresh(); host.secondary.cnRefresh(); break
            case 3:
                if (!host.visualStable()) throw new Error("visual pane structure changed")
                if (!bridge.viewReady(bridge.primary) || !bridge.viewReady(host.secondary)) { host.visualSettled = 0; return }
                if (++host.visualSettled < 20) return
                // Fresh heartbeat permits an external read-only copy of the
                // already-loaded framebuffer-spy's exact RGB32 buffer.
                console.log("Companion visual: ready; stage=" + host.visualStage + "; height=" + host.revealHeight
                    + "; docs=" + host.probeDocuments.join(",") + "; pen=false; epoch=" + Date.now())
                if (host.visualStage === 1 && ++host.visualHeld >= 200) {
                    console.log("Companion visual: gate closed")
                    host.visualStage = 2; host.revealHeight = 1680; host.visualSettled = 0
                    bridge.primary.cnRefresh(); host.secondary.cnRefresh()
                }
                break
            }
        } catch(e) { host.probeFail(String(e)) }
    }
}
