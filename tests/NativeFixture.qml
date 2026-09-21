import QtQuick
import "../build/native" as Native

Item {
    id: fixture
    width: 600; height: 900
    property url storeLocation
    property var host: null
    property Component hostFactory: regularHostFactory
    property alias bridge: mockBridge
    property alias primary: primaryView
    property alias pen: mockPen
    QtObject { id: mockPen; signal penDownChanged(bool down) }
    Item {
        id: primaryView
        anchors.fill: parent
        property var document: ({id: "11111111-1111-4111-8111-111111111111"})
        property bool cnGestureBusy: false
        property bool cnSelected: !fixture.host || !fixture.host.secondarySelected
        property bool cnInkAllowed: fixture.host && !fixture.host.renderProbeOnly && !fixture.host.paired
        function cnCloseFoldout() {}
    }
    Component {
        id: secondaryFactory
        Item {
            anchors.fill: parent
            property var cnHost
            property var document: null
            property string currentPageId: "33333333-3333-4333-8333-333333333333"
            property bool cnGestureBusy: false
            property bool cnSelected: !!cnHost && cnHost.secondarySelected && cnHost.paired
            property bool cnInkAllowed: false
            property bool closed: false
            function cnCloseFoldout() {}
            function cnNativeClose() { closed = true; mockBridge.closeCount++ }
            function cnAction(name) { mockBridge.lastAction = name }
        }
    }
    QtObject {
        id: mockBridge
        property var primary: primaryView
        property var penInput: mockPen
        property bool available: true
        property bool portrait: true
        property bool sharingActive: false
        property bool failCreate: false
        property bool ready: true
        property int closeCount: 0
        property string lastAction: ""
        property bool probeMayStart: true
        property string probeReadinessReason: probeMayStart ? "ready" : "locked"
        property bool probeCaptureDone: false
        property bool probeCaptureSaved: false
        property int probeCreateCount: 0
        property int probeRestoreCount: 0
        property var probeOriginal: null
        property var documents: [{id: "22222222-2222-4222-8222-222222222222", title: "Test notes"}]
        function canOpen(id) { return id === documents[0].id }
        function refreshDocuments() {}
        function createView(parent, host) {
            if (failCreate) throw new Error("injected load failure")
            return secondaryFactory.createObject(parent,{cnHost:host})
        }
        function openView(view, id, pageId) { view.document = {id:id, visibleName:"Test notes"} }
        function viewReady(view) { return ready }
        function beginAnimation() {}
        function endAnimation() {}
        function probeCreate() {
            probeCreateCount++; probeOriginal = primaryView.document
            primaryView.document = {id:"55555555-5555-4555-8555-555555555555"}
            return [primaryView.document.id, documents[0].id]
        }
        function probeInvalidate() {}
        function probeSeparate(host) { return host.secondary && host.primaryId === primaryView.document.id && host.companionId === documents[0].id }
        function probeCapture(host) { probeCaptureDone = true; probeCaptureSaved = true }
        function probeRestore(host) {
            if (!probeOriginal) return
            probeRestoreCount++; host.closeSecondary(false); primaryView.document = probeOriginal
        }
        function probeRestored() { return primaryView.document === probeOriginal }
    }
    Component { id: regularHostFactory; Native.NativeHost { anchors.fill: parent } }
    Component.onCompleted: host = hostFactory.createObject(fixture, {bridge:mockBridge, settingsLocation:storeLocation})
}
