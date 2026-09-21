import QtQuick
import "../src/Workspace.js" as Model

Item {
    id: root
    clip: true
    property var state: Model.create(width, height)
    property int revision: 0
    property bool inkMode: false // Mouse-only synthetic ink test; NOT a native pen handler.
    property alias mainView: main
    property alias companionView: companion
    property alias dragHandle: handle
    readonly property real overlayTop: { root.revision; return Model.top(state) }
    readonly property real revealed: { root.revision; return state.portrait ? state.reveal : 0 }
    readonly property string activePane: { root.revision; return state.focus }
    readonly property bool busy: { root.revision; return state.busy !== null }
    property var strokes: []
    property var currentStroke: []
    function changed() { revision++ }
    function selectPane(pane) { var ok = Model.select(state, pane); changed(); return ok }
    function attach(id) { var ok = Model.attach(state, id); changed(); return ok }
    function tuck() { var ok = Model.tuck(state); changed(); return ok }
    function reveal() { var ok = Model.reveal(state); changed(); return ok }
    function detach() { var ok = Model.detach(state); changed(); return ok }
    function openPrimary(id) {
        if (!Model.openPrimary(state, id)) return false
        main.contentY = Model.scroll(state, "main")
        companion.contentY = Model.scroll(state, "companion")
        changed(); return true
    }
    function updateSize() { Model.resize(state, width, height); changed() }
    onWidthChanged: updateSize()
    onHeightChanged: updateSize()
    Component.onCompleted: { updateSize(); openPrimary("demo-reference"); attach("demo-notes") }

    Flickable {
        id: main
        objectName: "mainViewport"
        anchors.fill: parent // Deliberately never bound to overlayTop.
        contentWidth: width; contentHeight: 2000
        boundsBehavior: Flickable.StopAtBounds
        interactive: !root.inkMode && (!root.busy || (root.state.busy.kind === "scroll" && root.state.busy.pane === "main"))
        onMovementStarted: { Model.beginScroll(root.state, "main"); root.changed() }
        onMovementEnded: { Model.endScroll(root.state); root.changed() }
        onContentYChanged: Model.saveScroll(root.state, "main", contentY)
        DemoPage { width: main.width; height: main.contentHeight }
        TapHandler {
            enabled: !root.inkMode
            onTapped: function(point) {
                var p = parent.mapToItem(root, point.position.x, point.position.y)
                if (Model.hit(root.state, p.x, p.y) === "main") root.selectPane("main")
            }
        }
    }
    Rectangle {
        z: 1; x: 14; y: 14; width: label.implicitWidth + 20; height: 26; radius: 13
        color: root.activePane === "main" ? "#292929" : "#efeee8"
        Text {
            id: label; anchors.centerIn: parent; font.pixelSize: 11
            color: root.activePane === "main" ? "white" : "#595959"
            text: root.activePane === "main" ? "● Writing in reference" : "Tap reference to write"
        }
    }
    Item {
        id: overlay
        objectName: "overlay"
        y: root.overlayTop; width: root.width; height: root.height
        visible: root.revealed > 0; z: 2; clip: true
        // Fixed-sized companion viewport translates with the sheet; no per-drag reflow.
        Rectangle { anchors.fill: parent; color: "#faf9f5" }
        Flickable {
            id: companion
            objectName: "companionViewport"
            y: root.state.header; width: parent.width; height: root.height - root.state.header
            clip: true; contentWidth: width; contentHeight: 2000
            boundsBehavior: Flickable.StopAtBounds
            interactive: !root.inkMode && (!root.busy || (root.state.busy.kind === "scroll" && root.state.busy.pane === "companion"))
            onMovementStarted: { Model.beginScroll(root.state, "companion"); root.changed() }
            onMovementEnded: { Model.endScroll(root.state); root.changed() }
            onContentYChanged: Model.saveScroll(root.state, "companion", contentY)
            DemoPage { width: companion.width; height: companion.contentHeight; title: "Working notes"; ruled: true }
            TapHandler {
                enabled: !root.inkMode
                onTapped: function(point) {
                    var p = parent.mapToItem(root, point.position.x, point.position.y)
                    if (Model.hit(root.state, p.x, p.y) === "companion") root.selectPane("companion")
                }
            }
        }
        Rectangle {
            id: handle
            objectName: "dragHandle"
            width: parent.width; height: root.state.header
            color: "#f0eee7"; border.width: 1; border.color: "#8d8b84"
            Rectangle { anchors.horizontalCenter: parent.horizontalCenter; y: 8; width: 48; height: 4; radius: 2; color: "#6e6c65" }
            Text {
                x: 18; y: 24; text: root.activePane === "companion" ? "● Notes · writing" : "Notes · tap below to write"
                font.pixelSize: 12; color: "#333"
            }
            MouseArea {
                anchors.fill: parent; preventStealing: true
                onPressed: function(mouse) {
                    var p = mapToItem(root, mouse.x, mouse.y)
                    mouse.accepted = Model.beginDrag(root.state, p.y); root.changed()
                }
                onPositionChanged: function(mouse) {
                    if (pressed) { var p = mapToItem(root, mouse.x, mouse.y); Model.drag(root.state, p.y); root.changed() }
                }
                onReleased: { Model.endDrag(root.state, false); root.changed() }
                onCanceled: { Model.endDrag(root.state, true); root.changed() }
            }
        }
    }
    Rectangle {
        z: 3; anchors.bottom: parent.bottom; anchors.horizontalCenter: parent.horizontalCenter
        width: 168; height: 38; radius: 12
        visible: root.revealed === 0 && root.state.companion !== "" && root.state.portrait
        color: "#e9e7de"; border.color: "#8d8b84"
        Text { anchors.centerIn: parent; text: "⌃  Pull out notes"; font.pixelSize: 13 }
        MouseArea {
            anchors.fill: parent; preventStealing: true
            property bool moved: false
            onPressed: function(mouse) { moved = false; mouse.accepted = Model.beginDrag(root.state, mapToItem(root, mouse.x, mouse.y).y); root.changed() }
            onPositionChanged: function(mouse) {
                if (pressed) { moved = true; Model.drag(root.state, mapToItem(root, mouse.x, mouse.y).y); root.changed() }
            }
            onReleased: { Model.endDrag(root.state, false); if (!moved) root.reveal(); root.changed() }
            onCanceled: { Model.endDrag(root.state, true); root.changed() }
        }
    }
    // Demo ink records screen-local points only. Never export this to a tablet.
    Canvas {
        id: ink; anchors.fill: parent; z: 4; visible: root.inkMode
        onPaint: {
            var c = getContext("2d"); c.clearRect(0, 0, width, height)
            c.strokeStyle = "#222"; c.lineWidth = 2
            var all = root.strokes.concat([root.currentStroke])
            for (var i = 0; i < all.length; i++) {
                c.beginPath(); var start = true
                for (var j = 0; j < all[i].length; j++) {
                    var p = all[i][j]
                    if (!p) { start = true; continue }
                    if (start) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y)
                    start = false
                }
                c.stroke()
            }
        }
        MouseArea {
            anchors.fill: parent
            onPressed: function(mouse) {
                // Let dedicated margin chrome receive the pointer.
                if (Model.hit(root.state, mouse.x, mouse.y) === "handle") { mouse.accepted = false; return }
                var result = Model.beginStroke(root.state, mouse.x, mouse.y)
                root.currentStroke = result === "writing" ? [{x: mouse.x, y: mouse.y}] : []
                root.changed(); ink.requestPaint()
            }
            onPositionChanged: function(mouse) {
                if (!pressed || !root.state.busy || root.state.busy.kind !== "stroke") return
                var valid = Model.strokePoint(root.state, mouse.x, mouse.y)
                root.currentStroke.push(valid ? {x: mouse.x, y: mouse.y} : null); ink.requestPaint()
            }
            onReleased: {
                root.strokes.push(root.currentStroke); root.currentStroke = []
                Model.endStroke(root.state); root.changed(); ink.requestPaint()
            }
            onCanceled: { root.currentStroke = []; Model.endStroke(root.state); root.changed(); ink.requestPaint() }
        }
    }
    // Synthetic strokes cannot follow document scroll: clear them on any layout/navigation change.
    onRevisionChanged: { if (!root.state.busy || root.state.busy.kind !== "stroke") { strokes = []; ink.requestPaint() } }
}
