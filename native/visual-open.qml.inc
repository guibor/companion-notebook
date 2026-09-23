// One reviewed diagnostic's already-created disposable notes only.
function probeCreate() {
    if (!probeMayStart || Values.cnProbeStarted) throw new Error("Visual reopen unavailable")
    var ids = ["3fe4ae5a-a74e-4de3-994c-b1c40b1ccbe2", "e761bdbe-f6b0-495d-8224-cacd07fff3c8"]
    var pages = ["363535fe-0e4d-4953-b623-87875ebd58e6", "75c51ba3-c1f1-49ed-b47c-d0374af12c1c"]
    for (var i = 0; i < ids.length; ++i) {
        var entry = Library.entryForId(ids[i])
        var prefix = "Companion test " + (i === 0 ? "Reference " : "Notes ")
        if (!entry || entry.archived || entry.lockedByPassword || entry.loadError
            || entry.fileType !== Document.Notebook || entry.pageCount !== 1
            || entry.orientation !== Qt.Vertical || entry.pageForId(pages[i]) !== 0
            || String(entry.visibleName).indexOf(prefix) !== 0) throw new Error("Disposable reopen identity refused")
    }
    Values.cnProbeStarted = true
    probeInvalidate()
    probeIds = ids
    console.log("Companion visual: reopening saved disposable IDs " + ids.join(" "))
    var main = Library.entryForId(ids[0])
    root.openDocument_helper(main, function() { documentView.item.openDocumentOnPage(main, 0) })
    return ids
}
