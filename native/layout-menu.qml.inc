RowLayout {
    id: cnLayoutControls
    Layout.fillWidth: true
    visible: root.documentType === "note" || root.documentType === "pdf"
    spacing: 4
    Repeater {
        model: 5
        Rectangle {
            required property int index
            readonly property real modelData: [0, 0.25, 0.375, 0.5, 1][index]
            Layout.fillWidth: true
            implicitWidth: 58; implicitHeight: 72
            radius: 6
            color: Math.abs(Values.cnLayoutRatio - modelData) < 0.01 ? "#ddd" : "transparent"
            Rectangle {
                anchors.centerIn: parent
                width: 27; height: 40; color: "white"; border.color: "black"; border.width: 2
                Rectangle {
                    anchors.left: parent.left; anchors.right: parent.right
                    anchors.margins: 3
                    y: modelData === 0 ? 3 : parent.height - height - 3
                    height: (parent.height - 6) * (modelData === 0 ? 1 : modelData); color: modelData === 0 ? "white" : "#444"
                    Text { anchors.centerIn: parent; visible: modelData === 0 || modelData === 1; text: modelData === 0 ? "↑" : "↓"; color: modelData === 0 ? "black" : "white"; font.pixelSize: 23 }
                }
            }
            MouseArea { anchors.fill: parent; onClicked: { const choice = index; Values.cnLayoutRequested(choice); root.toolbar.closeFoldout() } }
        }
    }
}
