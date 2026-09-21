readonly property bool probeMayStart: probeReadiness() === "ready"
readonly property string probeReadinessReason: probeReadiness()
property var probeOriginal: null
property var probeIds: []
property bool probeCaptureDone: false
property bool probeCaptureSaved: false
property int probeGeneration: 0
function probeReadiness() {
    if (!root.visible) return "hidden"
    if (root.passcodeHandler.userLocked) return "locked"
    if (BatteryManager.displaySleeping) return "asleep"
    if (!Library.isReady) return "library-busy"
    if (!portrait) return "landscape"
    if (sharingActive) return "sharing"
    // The library can retain an empty DocumentView whose SceneView is inactive.
    if (primary && primary.document && primary.isLoading) return "document-loading"
    return "ready"
}
function probeInvalidate() { probeGeneration++ }
function probeCreate() {
    if (!probeMayStart || Values.cnProbeStarted) throw new Error("Probe is unavailable or already claimed")
    Values.cnProbeStarted = true
    probeInvalidate()
    probeOriginal = primary && primary.document ? {id:String(primary.document.id), page:primary.currentPage} : null
    var folder = root.explorer.rootId().toString()
    if (!folder) throw new Error("Native root folder unavailable")
    var tag = new Date().toISOString().replace(/[:.]/g, "-")
    var ids = []
    for (var i = 0; i < 2; ++i) {
        var id = String(LibraryController.createDocument(folder, "Companion test " + (i === 0 ? "Reference " : "Notes ") + tag))
        if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Native test notebook creation failed")
        ids.push(id); probeIds = ids.slice()
        var entry = Library.entryForId(id)
        if (!entry) throw new Error("Native test notebook missing")
        LibraryController.setOrientation(entry.id, Qt.Vertical)
        DocumentController.setTemplateForPage(entry.id, entry.lastOpenedPage,
            i === 0 ? "P Grid large" : "P Lines medium", DeviceScreenInfo.paperSize)
    }
    if (ids[0] === ids[1]) throw new Error("Native test IDs are not distinct")
    console.log("Companion probe: created disposable IDs " + ids.join(" "))
    var main = Library.entryForId(ids[0])
    root.openDocument_helper(main, function() { documentView.item.openDocumentOnPage(main, 0) })
    return ids
}
function probeSeparate(host) {
    if (probeIds.length !== 2 || !primary || !primary.document || !host.secondary || !host.secondary.document) return false
    var first = primary.cnProbeCaptureItem, second = host.secondary.cnProbeCaptureItem
    if (!first || !first.document || !second || !second.document) return false
    return String(primary.document.id) === probeIds[0] && String(host.secondary.document.id) === probeIds[1]
        && String(first.document.id) === probeIds[0] && String(second.document.id) === probeIds[1]
        && primary.sceneController !== host.secondary.sceneController
        && primary.documentLoaded && host.secondary.documentLoaded
}
function probeCapture(host) {
    if (!probeMayStart || !probeSeparate(host)) throw new Error("Refusing capture outside disposable documents")
    probeCaptureDone = false; probeCaptureSaved = false
    var generation = probeGeneration
    var first = primary, second = host.secondary, count = 0, failed = false
    var firstViewport = first.cnProbeViewport, secondViewport = second.cnProbeViewport
    var firstCapture = first.cnProbeCaptureItem, secondCapture = second.cnProbeCaptureItem
    if (!firstViewport || !secondViewport || !firstCapture || !secondCapture) throw new Error("Native viewport unavailable")
    function receive(result, name) {
        // Recheck after the asynchronous render. Never save a stale or foreign view.
        if (failed || generation !== probeGeneration || !probeMayStart || primary !== first
            || host.secondary !== second || !probeSeparate(host)
            || !first.cnProbeViewport || first.cnProbeViewport !== firstViewport
            || !second.cnProbeViewport || second.cnProbeViewport !== secondViewport
            || !first.cnProbeCaptureItem || first.cnProbeCaptureItem !== firstCapture
            || !second.cnProbeCaptureItem || second.cnProbeCaptureItem !== secondCapture) {
            failed = true; probeCaptureSaved = false; probeCaptureDone = true; return
        }
        if (!result.saveToFile("/home/root/.local/share/companion-notebook/" + name)) {
            failed = true; probeCaptureSaved = false; probeCaptureDone = true; return
        }
        count++
        if (count === 2) { probeCaptureSaved = true; probeCaptureDone = true }
    }
    if (!first.cnProbeCaptureViewport(function(result) { receive(result, "render-primary.png") })
        || !second.cnProbeCaptureViewport(function(result) { receive(result, "render-secondary.png") })) {
        failed = true; probeCaptureDone = true; throw new Error("Native viewport capture rejected")
    }
}
function probeRestore(host) {
    probeInvalidate()
    if (!Values.cnProbeStarted) return
    host.closeSecondary(false)
    if (!primary) return
    if (!probeOriginal) { primary.close(); return }
    if (primary.document && String(primary.document.id) === probeOriginal.id && primary.currentPage === probeOriginal.page) return
    var entry = Library.entryForId(probeOriginal.id)
    if (!entry || entry.archived || entry.lockedByPassword || entry.loadError) throw new Error("Original view unavailable")
    root.openDocument_helper(entry, function() { documentView.item.openDocumentOnPage(entry, probeOriginal.page) })
}
function probeRestored() {
    return probeOriginal ? !!primary && !!primary.document && String(primary.document.id) === probeOriginal.id
        && primary.currentPage === probeOriginal.page && viewReady(primary) : !primary || !primary.document
}
