// User explicitly requested hands-on feedback instead of further automated trials.
property bool pilotStopping: false
property int pilotStopTicks: 0
function pilotStop() {
    if (pilotStopping || !idle) return
    if (requestTransition("pilot-stop", function() {
        choosing = false
        closeSecondaryParked(false)
        return "choosing" // Keep input parked while native autosave settles.
    })) { pilotStopping = true; pilotStopTimer.start() }
}
Timer {
    id: pilotStopTimer; interval: 1000; repeat: true
    onTriggered: {
        if (host.transitionPhase !== "choosing" || !host.transitionOwnsPark()) return
        if (++host.pilotStopTicks < 5) return
        stop()
        console.log("Companion pilot: stop requested")
    }
}
Timer {
    interval: 5000; repeat: true; running: true
    onTriggered: console.log("Companion pilot: heartbeat; epoch-ms=" + Date.now())
}
Rectangle {
    visible: host.pilotStopping
    anchors.centerIn: parent
    width: 700 * host.unit; height: 130 * host.unit
    color: "white"; border.color: "black"; z: 10000
    Text { anchors.centerIn: parent; text: "Saving and turning off Companion…"; font.pixelSize: 30 * host.unit }
}
