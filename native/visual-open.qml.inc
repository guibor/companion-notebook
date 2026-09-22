// One reviewed diagnostic's already-created disposable notes only.
function probeCreate() {
    if (!probeMayStart || Values.cnProbeStarted) throw new Error("Visual reopen unavailable")
    var ids = ["9baaab38-b382-4f8c-9871-2932c2afe4ca", "3ded6fc6-4f79-401e-99ec-dae6a934ae4a"]
    var pages = ["eefe9ee2-0396-4688-b7f7-8328e186007d", "59506a8a-b6fe-4d3c-8d91-acc427d5fac4"]
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
