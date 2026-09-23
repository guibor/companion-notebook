// Desktop QML boundary mock ONLY. Never copied into a tablet payload.
import QtQuick
Item {
    id: gate
    property string phase: "cold"
    property string error: ""
    property var manager: null
    property int generation: 0
    signal ready()
    signal parked(int generation)
    signal resumed(int generation)
    function initialize() {
        Qt.callLater(function() { gate.phase = "ready"; gate.ready() })
        return true
    }
    function pause(surfaceManager, nextGeneration) {
        if (phase !== "ready" || nextGeneration <= generation) return false
        manager = surfaceManager; generation = nextGeneration; phase = "draining"
        drain.start(); return true
    }
    function permitPublication(g) {
        if (phase !== "parked" || g !== generation) return false
        phase = "publishing"; return true
    }
    function finish(g) {
        if (phase !== "publishing" || g !== generation) return false
        phase = "ready"
        Qt.callLater(function() { gate.resumed(g) })
        return true
    }
    Timer {
        id: drain; interval: 10; repeat: true
        onTriggered: {
            if (gate.manager && gate.manager.penDown) return
            stop(); gate.phase = "parked"; gate.parked(gate.generation)
        }
    }
}
