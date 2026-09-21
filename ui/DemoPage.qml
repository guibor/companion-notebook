import QtQuick

Rectangle {
    id: page
    property string title: "Reference"
    property bool ruled: false
    color: "#faf9f5"
    Text {
        x: 44; y: 42; width: parent.width - 88
        text: page.title; font.family: "Georgia"; font.pixelSize: 28
        color: "#242424"; wrapMode: Text.Wrap
    }
    Text {
        x: 44; y: 94; text: "SYNTHETIC DOCUMENT · DESKTOP PROTOTYPE"
        font.pixelSize: 10; font.letterSpacing: 1; color: "#727272"
    }
    Repeater {
        model: 45
        Rectangle {
            required property int index
            x: 44; y: 156 + index * 38
            width: page.width - 88; height: 1; color: "#dad8d0"
            Text {
                visible: !page.ruled; y: -24
                text: ["Keep the source in sight.", "Pull your notes into the conversation.",
                    "The page underneath stays exactly where it was.", "Scroll each document independently."][index % 4]
                font.family: "Georgia"; font.pixelSize: 16; color: "#55534d"
            }
        }
    }
}
