import QtQuick
import "../build/native" as Native

Item {
    id: fixture
    width: 600; height: 900
    property url storeLocation
    property alias host: nativeHost
    property alias bridge: mockBridge
    property alias primary: primaryView
    property alias pen: mockPen
    QtObject { id: mockPen; signal penDownChanged(bool down) }
    Item {
        id: primaryView
        property var document: ({id: "11111111-1111-4111-8111-111111111111"})
        property bool cnGestureBusy: false
        function cnCloseFoldout() {}
    }
    Component {
        id: secondaryFactory
        Item {
            property var cnHost
            property var document: null
            property string currentPageId: "33333333-3333-4333-8333-333333333333"
            property bool cnGestureBusy: false
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
    }
    Native.NativeHost { id: nativeHost; anchors.fill: parent; bridge: mockBridge; settingsLocation: fixture.storeLocation }
}
