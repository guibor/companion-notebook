// Build-only diagnostic: never included in the normal/native release candidate.
property int probePhase: 0
property bool probeSucceeded: false
property string probeFailure: ""
property int probeTicks: 0
property var probeDocuments: []
property var probeView: null
property real probeMainWidth: 0
property real probeMainHeight: 0
property real probeSecondHeight: 0
property int probeDragStep: 0
property string probeLastReadiness: ""
function probeFail(message) {
    probeFailure = message
    probeTimer.stop()
    bridge.probeInvalidate()
    if (dragging) finishDrag(true)
    try { bridge.probeRestore(host) } catch (e) { console.warn("Companion probe: original restore failed") }
    console.warn("Companion probe: FAILED " + message)
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
                host.probeView = host.secondary
                host.probeMainWidth = bridge.primary.width
                host.probeMainHeight = bridge.primary.height
                host.probeSecondHeight = host.secondary.height
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
                if (bridge.primary.width !== host.probeMainWidth || bridge.primary.height !== host.probeMainHeight
                    || host.secondary.height !== host.probeSecondHeight) throw new Error("Drag resized a native viewport")
                if (host.probeDragStep === 10) { host.finishDrag(false); host.probePhase = 5 }
                break
            case 5:
                if (!host.selectPane(true) || !host.secondary.cnSelected || bridge.primary.cnSelected)
                    throw new Error("Pane selection ownership failed")
                if (host.secondary.cnInkAllowed || bridge.primary.cnInkAllowed) throw new Error("Probe unexpectedly permitted ink")
                bridge.probeCapture(host)
                host.probePhase = 6
                break
            case 6:
                if (!bridge.probeCaptureDone) return
                if (!bridge.probeCaptureSaved) throw new Error("Native scene capture could not save")
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
                console.log("Companion probe: two native views and return completed; ink=false; capture=true")
                break
            }
        } catch (e) { host.probeFail(String(e)) }
    }
}
