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
    QtObject {
        id: mockPen
        signal penDownChanged(bool down)
        property var surfaceManager: QtObject {
            property bool penDown: false
            function updateRegions() {}
        }
        onPenDownChanged: function(down) { surfaceManager.penDown = down }
    }
    Item {
        id: primaryView
        anchors.fill: parent
        property var document: ({id: "11111111-1111-4111-8111-111111111111"})
        property string currentPageId: "66666666-6666-4666-8666-666666666666"
        property bool cnGestureBusy: false
        property var sceneController: ({})
        property var penHandler: ({})
        property bool cnSelected: !fixture.host || !fixture.host.secondarySelected
        property bool cnInkAllowed: fixture.host && !fixture.host.renderProbeOnly && !fixture.host.modalOpen
            && !fixture.host.dragging && !fixture.host.restoring
            && (("transitionPhase" in fixture.host) ? !fixture.host.inputGeometryPending
                : (!fixture.host.secondary || !fixture.host.inputGeometryPending)) && !fixture.host.paired
        readonly property var cnProbeViewport: primaryView
        readonly property var cnProbeScene: primaryView
        function cnCloseFoldout() {}
        function cnToolState() { return ({}) }
        function cnNormalizeTools() {}
        function cnProbePreparePen() { return true }
        function cnProbeExpectedBounds(i) { return Qt.rect(10,20,300,50) }
        function cnUpdateInputGeometry() { mockBridge.geometryCount++; return !mockBridge.failGeometry }
        function cnAdmissionInputsDetached() { return !!fixture.host && fixture.host.inputGeometryPending }
        function cnAdmissionConstrainToPane() { return cnAdmissionInputsDetached() }
        function cnInputGeometryReadiness() {
            if (cnInkAllowed) return "pen-gate-open"
            return mockBridge.geometryLoading ? "loading" : "ready"
        }
    }
    Component {
        id: secondaryFactory
        Item {
            id: secondaryView
            anchors.fill: parent
            property var cnHost
            property var document: null
            property string currentPageId: "33333333-3333-4333-8333-333333333333"
            property bool cnGestureBusy: false
            property var sceneController: ({})
            property var penHandler: ({})
            property bool cnSelected: !!cnHost && cnHost.secondarySelected && cnHost.paired
            property bool cnInkAllowed: false
            readonly property var cnProbeViewport: secondaryView
            readonly property var cnProbeScene: secondaryView
            property bool closed: false
            function cnCloseFoldout() {}
            function cnApplyToolState(state) {}
            function cnFitQuickPad() { mockBridge.fitCount++; return cnHost.transitionOwnsPark() && cnHost.inputGeometryPending && !mockBridge.failFit }
            function cnProbePreparePen() { return true }
            function cnProbeExpectedBounds(i) { return Qt.rect(10,20,300,50) }
            function cnUpdateInputGeometry() { mockBridge.geometryCount++; return !mockBridge.failGeometry }
            function cnAdmissionInputsDetached() { return !!cnHost && cnHost.inputGeometryPending }
            function cnAdmissionConstrainToPane() { return cnAdmissionInputsDetached() }
            function cnInputGeometryReadiness() { return mockBridge.geometryLoading ? "loading" : "ready" }
            function cnNativeClose() { closed = true; mockBridge.closeCount++ }
            function cnAction(name) { mockBridge.lastAction = name }
        }
    }
    QtObject {
        id: mockBridge
        property var primary: primaryView
        property var penInput: mockPen
        property bool available: true
        readonly property bool inputAvailable: available && !!primary && !!primary.document && primary.visible
        property bool portrait: true
        property bool sharingActive: false
        property bool failCreate: false
        property bool failGeometry: false
        property bool failFit: false
        property bool padEligible: true
        property int fitCount: 0
        property int padOpenCount: 0
        property int lastPageOpened: -1
        property bool geometryLoading: false
        property int geometryCount: 0
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
        property var favorites: documents
        function canOpen(id) { return id === documents[0].id }
        function canOpenPad(id) { return padEligible && canOpen(id) }
        function openPadView(view, id) { padOpenCount++; lastPageOpened=6; view.document={id:id, visibleName:"Quick notes"} }
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
