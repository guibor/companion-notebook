// One real display sleep/wake, entered only AFTER the old native input is parked.
// No power-policy mutation, fabricated wake reason, RTC alarm or sleep retry.
property bool probeSleepBusy: false
property bool probeSleepDone: false
property int probeSleepStep: 0
property double probeSleepStarted: 0
property var probeSleepPages: []

function probeSleepSolePrimary(view) {
    return probeSleepBusy && !secondary && view === bridge.primary && view === probeViews[0]
        && view.document && String(view.document.id) === probeDocuments[0]
        && view.cnProbeScene === probeScenes[0] && view.sceneController === probeControllers[0]
}
function probeSleepBegin() {
    if (!idle || !probeStable() || penDown || !inputVisibilityHeld || probeSleepBusy || probeSleepDone)
        throw new Error("sleep test not ready")
    probeSleepBusy = true
    probeSleepStarted = Date.now()
    probeSleepPages = [String(bridge.primary.currentPageId), String(secondary.currentPageId)]
    if (!requestTransition("probe-sleep", function() {
        // Verify both old candidates were detached before requesting real sleep.
        if (!bridge.primary.cnAdmissionInputsDetached() || !secondary.cnAdmissionInputsDetached()
                || inputVisibilityHeld) throw new Error("sleep retained old input")
        bridge.probeSleepOwned(host)
    })) throw new Error("sleep transaction refused")
}
function probeSleepTick() {
    if (!probeSleepBusy || Date.now() - probeSleepStarted > 20000)
        throw new Error("sleep/wake deadline exceeded")
    if (bridge.probeSleeping && Date.now() - probeSleepStarted > 5000)
        throw new Error("display wake deadline missed")
    var first = bridge.primary
    if (!first || first !== probeViews[0] || !first.document || String(first.document.id) !== probeDocuments[0]
            || first.cnProbeScene !== probeScenes[0] || first.sceneController !== probeControllers[0]
            || String(first.currentPageId) !== probeSleepPages[0]) throw new Error("sleep primary owner changed")
    if (probeSleepStep === 0) {
        if (transitionPhase !== "suspended") return false
        if (!transitionOwnsPark() || !inputGeometryPending || secondary || inputVisibilityHeld
                || bridge.probeDisplayState !== 2 || !bridge.probeSleeping || bridge.inputAvailable
                || !first.cnAdmissionInputsDetached()) throw new Error("native sleeping park invalid")
        probeSleepStep = 1
        console.log("Companion sleep: asleep; parked=true; detached=true; epoch-ms=" + Date.now())
        return false
    }
    if (probeSleepStep === 1) {
        if (bridge.probeSleeping) return false
        if (bridge.probeDisplayState !== 0 || !bridge.inputAvailable) throw new Error("wake did not restore normal display")
        if (!idle) return false
        if (inputGeometryPending || transitionOwnsPark() || secondary) throw new Error("wake did not publish primary input")
        console.log("Companion sleep: awake; normal=true; primary-fresh=true")
        if (!openSecondary()) throw new Error("wake companion reopen refused")
        probeSleepStep = 2
        return false
    }
    if (probeSleepStep !== 2) throw new Error("unknown sleep test step")
    if (!idle) return false
    if (!secondary || !bridge.viewReady(secondary) || String(secondary.document.id) !== probeDocuments[1]
            || String(secondary.currentPageId) !== probeSleepPages[1] || !inputVisibilityHeld)
        throw new Error("wake companion did not restore its original page")
    probeViews = [first, secondary]
    probeScenes = [first.cnProbeScene, secondary.cnProbeScene]
    probeControllers = [first.sceneController, secondary.sceneController]
    if (!probeStable() || inputGeometryPending) throw new Error("wake pair not ready")
    probeSleepDone = true; probeSleepBusy = false
    console.log("Companion sleep: roundtrip passed; normal=true; pairing=true; original-pages=true; fresh-candidates=true")
    return true
}
