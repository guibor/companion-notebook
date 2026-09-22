import QtQuick

// Tap-only ruler: the filled mark is the current size, not a drag thumb.
Item {
    id: ruler
    property real ratio: 1 / 3
    property real unit: 1
    readonly property var sizes: [1 / 3, 1 / 2, 2 / 3]
    signal chosen(real ratio)
    implicitWidth: 360 * unit
    implicitHeight: 104 * unit
    opacity: enabled ? 1 : 0.4
    Rectangle {
        x: ruler.width / 6; width: ruler.width * 2 / 3
        y: 68 * ruler.unit; height: 2 * ruler.unit; color: "#777"
    }
    Row {
        anchors.fill: parent
        Repeater {
            model: ["⅓", "½", "⅔"]
            Item {
                required property int index
                required property string modelData
                objectName: "sizeMark" + index
                width: ruler.width / 3; height: ruler.height
                readonly property bool selected: Math.abs(ruler.ratio - ruler.sizes[index]) < 0.001
                Accessible.role: Accessible.RadioButton
                Accessible.name: "Companion size " + modelData
                Accessible.checkable: true
                Accessible.checked: selected
                Text {
                    anchors.horizontalCenter: parent.horizontalCenter; y: 8 * ruler.unit
                    text: parent.modelData; font.pixelSize: 34 * ruler.unit
                    font.bold: parent.selected; color: "#222"
                }
                Rectangle {
                    anchors.horizontalCenter: parent.horizontalCenter
                    y: (parent.selected ? 59 : 62) * ruler.unit
                    width: (parent.selected ? 20 : 3) * ruler.unit
                    height: (parent.selected ? 20 : 14) * ruler.unit
                    radius: parent.selected ? width / 2 : 0; color: "#222"
                }
                TapHandler {
                    gesturePolicy: TapHandler.DragThreshold
                    onTapped: ruler.chosen(ruler.sizes[parent.index])
                }
            }
        }
    }
}
