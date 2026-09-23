property var cnHost: cnHostLoader.item
LibrarySearch {
    id: cnRecent
    library: Library
    filter: LibraryView.Documents
    sortOrder: LibraryView.RecentlyOpenedDate
    showRecentsIfTermEmpty: false
    maximumResults: 40
}
LibraryNavigator {
    id: cnFavorites
    library: Library
    sortOrder: LibraryView.RecentlyOpenedDate
    filter: (LibraryView.Documents | LibraryView.Pinned)
    ignoreParent: true
}
Item {
    id: cnBridge
    readonly property var primary: documentView.item
    readonly property var penInput: root.penInput
    readonly property bool available: root.visible && documentView.visible
        && !!primary && !!primary.document && !root.passcodeHandler.userLocked
        && !BatteryManager.displaySleeping
    readonly property bool portrait: root.orientation.isPortraitOrientation
    readonly property bool sharingActive: ScreenShareServer.active || Values.rmstreamPhase !== "off"
    property var documents: []
    property var favorites: []
    // PROBE_BRIDGE
    function canOpen(id) {
        var entry = Library.entryForId(id)
        return !!entry && String(entry.id) !== String(primary?.document?.id || "")
            && (entry.fileType === Document.Notebook || entry.fileType === Document.Pdf) && !entry.archived
            && !entry.lockedByPassword && !entry.loadError && entry.pageCount > 0
            && entry.orientation === Qt.Vertical
    }
    function refreshDocuments() {
        cnRecent.updateNow()
        documents = describeDocuments(cnRecent.entryIds)
        favorites = describeDocuments(cnFavorites.entryIds)
    }
    function describeDocuments(ids) {
        return ids.filter(function(id) { return canOpen(String(id)) })
            .map(function(id) { var e = Library.entryForId(id); return {id: String(id), title: e.visibleName, isPdf: e.fileType === Document.Pdf} })
    }
    function createView(parent, host) {
        return cnViewComponent.createObject(parent, {cnHost: host})
    }
    function openView(view, id, pageId) {
        var entry = Library.entryForId(id)
        if (!canOpen(id)) throw new Error("Companion document is not eligible")
        var index = pageId ? entry.pageForId(pageId) : entry.lastOpenedPage
        if (index < 0 || index >= entry.pageCount) index = 0
        view.openDocumentOnPage(entry, index)
    }
    function openPrimary(id, pageId) {
        var entry = Library.entryForId(id)
        if (!entry || entry.archived || entry.lockedByPassword || entry.loadError) throw new Error("Document unavailable")
        var index = pageId ? entry.pageForId(pageId) : entry.lastOpenedPage
        if (index < 0 || index >= entry.pageCount) index = 0
        root.openDocument_helper(entry, function() { documentView.item.openDocumentOnPage(entry, index) })
    }
    function viewReady(view) { return view.documentLoaded && !view.isLoading && !!view.sceneController }
    function beginAnimation() { }
    function endAnimation() { if (primary) primary.cnRefresh(); if (cnHost?.secondary) cnHost.secondary.cnRefresh() }
}
Component {
    id: cnViewComponent
    DocumentView {
        id: cnView
        anchors.fill: parent
        cnSecondary: true
        clip: true
        penInput: root.penInput
        toolbarConfiguration: root.toolbarConfiguration
        toolbarProvider: root.toolbarProvider
        penClose: PenClosenessMonitor.penWasClose
        textColumn: root.textColumn
        windowNavigator: root.windowNavigator
        movePageSelection: PageSelection { library: Library }
        retailSettings: RetailDemo.settings
        epubSettings: root.epubSettings
        orientation: root.orientation
        shareAndConvert: root.shareAndConvert
        searchIndexStatus: root.searchIndexStatus
        analytics: root.analytics
        ghostBuster: root.ghostBuster
        notificationQueue: root.notificationQueue
        colorProfile: root.colorProfile
        extraViewGestures: []
        deviceSceneViewBehavior: root.deviceSceneViewBehavior
        documentViewListener: root.documentViewListener
        documentOrientation: root.documentOrientation
        toolSet: root.toolSet
        onDocumentFailedToLoad: {
            if (cnHost && cnHost.secondary === cnView) { cnHost.closeSecondary(false); cnHost.error = "The companion could not load." }
        }
    }
}
