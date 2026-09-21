// No capture, no ink. Machine structure is NOT visual or physical acceptance.
property int probePhase: 0
property bool probeSucceeded: false
property string probeFailure: ""
property int probeTicks: 0
property var probeDocuments: []
property var probeView: null
property var probePrimary: null
property var probeGeometry: []
property int probeDragStep: 0
property int probeObservationTicks: 0
property string probeLastReadiness: ""
function probeFail(message) {
    probeFailure = message
    probeTimer.stop()
    bridge.probeInvalidate()
    if (dragging) finishDrag(true)
    try { bridge.probeRestore(host) } catch (e) { console.warn("Companion probe: original restore failed") }
    console.warn("Companion probe: FAILED " + message)
}
function probeAssertStructure() {
    if (!bridge.probeSeparate(host) || bridge.primary !== probePrimary || secondary !== probeView)
        throw new Error("Disposable native identity changed")
    var items = [bridge.primary, secondary, bridge.primary.cnProbeViewport, secondary.cnProbeViewport,
        bridge.primary.cnProbeScene, secondary.cnProbeScene]
    for (var i = 0; i < items.length; ++i) {
        var saved = probeGeometry[i]
        if (!items[i] || items[i] !== saved.item || items[i].width !== saved.width || items[i].height !== saved.height)
            throw new Error("Native view identity or dimensions changed")
    }
    if (bridge.primary.cnInkAllowed || secondary.cnInkAllowed) throw new Error("Probe unexpectedly permitted ink")
}
Timer {
    id: probeTimer
    interval: host.probePhase === 4 ? 80 : 500
    repeat: true
    running: true
    onTriggered: {
        host.probeTicks++
        try {
            if (host.probeTicks > 160) throw new Error("Bounded native probe timed out")
            if (host.penDown) throw new Error("Pen activity interrupted automated probe")
            if (host.error) throw new Error("Native host reported an error")
            if (host.probePhase > 0 && bridge.probeReadinessReason !== "ready" && bridge.probeReadinessReason !== "document-loading")
                throw new Error("Unsafe state during structural probe")
            if (host.probePhase >= 3 && host.probePhase <= 6) host.probeAssertStructure()
            switch (host.probePhase) {
            case 0:
                if (host.probeLastReadiness !== bridge.probeReadinessReason) {
                    host.probeLastReadiness = bridge.probeReadinessReason
                    console.log("Companion probe: readiness=" + host.probeLastReadiness)
                }
                if (!bridge.probeMayStart) return
                host.probeDocuments = bridge.probeCreate()
                host.probePhase = 1
                break
            case 1:
                if (!bridge.primary || !bridge.primary.document || String(bridge.primary.document.id) !== host.probeDocuments[0]
                    || !bridge.viewReady(bridge.primary)) return
                host.synchronizePrimary()
                if (!host.pick(host.probeDocuments[1])) throw new Error("Second native view did not open")
                host.probePhase = 2
                break
            case 2:
                if (host.restoring) return
                if (!bridge.probeSeparate(host)) throw new Error("Native document/controller isolation failed")
                host.probePrimary = bridge.primary
                host.probeView = host.secondary
                var items = [bridge.primary, host.secondary, bridge.primary.cnProbeViewport, host.secondary.cnProbeViewport,
                    bridge.primary.cnProbeScene, host.secondary.cnProbeScene]
                var geometry = []
                for (var i = 0; i < items.length; ++i) {
                    if (!items[i] || !(items[i].width > 0) || !(items[i].height > 0)) throw new Error("Native viewport unavailable")
                    geometry.push({item:items[i], width:items[i].width, height:items[i].height})
                }
                host.probeGeometry = geometry
                host.probePhase = 3
                break
            case 3:
                if (!host.idle) return
                if (!host.beginDrag(host.height * 0.65)) throw new Error("Native drag refused")
                host.probePhase = 4
                break
            case 4:
                host.probeDragStep++
                host.moveDrag(host.height * (0.65 - host.probeDragStep * 0.015))
                host.probeAssertStructure()
                if (host.probeDragStep === 10) { host.finishDrag(false); host.probePhase = 5 }
                break
            case 5:
                if (!host.selectPane(true) || !host.secondary.cnSelected || bridge.primary.cnSelected)
                    throw new Error("Pane selection ownership failed")
                console.log("Companion probe: observation window; capture=not-attempted; visual=unverified; ink=false")
                host.probePhase = 6
                break
            case 6:
                // A bounded 20-second visual observation window, not a visual pass.
                if (++host.probeObservationTicks < 40) return
                if (!host.tuck() || !host.openSecondary() || host.secondary !== host.probeView)
                    throw new Error("Tuck did not preserve native view")
                host.probePhase = 7
                break
            case 7:
                bridge.probeRestore(host)
                host.probePhase = 8
                break
            case 8:
                if (!bridge.probeRestored()) return
                stop()
                host.probeSucceeded = true
                console.log("Companion probe: structural sequence and return completed; ink=false; capture=not-attempted; visual=unverified")
                break
            }
        } catch (e) { host.probeFail("phase=" + host.probePhase + " " + String(e)) }
    }
}
