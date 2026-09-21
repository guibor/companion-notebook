import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    visible: true; width: 620; height: 920; title: "Companion · interaction prototype (not native ink)"
    minimumWidth: 420; minimumHeight: 640
    ColumnLayout {
        anchors.fill: parent; spacing: 0
        ToolBar {
            Layout.fillWidth: true
            RowLayout {
                anchors.fill: parent
                ToolButton { text: "Tuck"; onClicked: workspace.tuck() }
                ToolButton { text: "Reveal"; onClicked: workspace.reveal() }
                Item { Layout.fillWidth: true }
                CheckBox { text: "Simulate pen"; onToggled: workspace.inkMode = checked }
            }
        }
        CompanionWorkspace { id: workspace; Layout.fillWidth: true; Layout.fillHeight: true }
        Label {
            Layout.fillWidth: true; padding: 10; horizontalAlignment: Text.AlignHCenter
            text: "Desktop only · write in either pane · drag grip · scroll each page"
            font.pixelSize: 11; color: "#555"
        }
    }
}
