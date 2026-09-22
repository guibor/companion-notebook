import QtQuick
import QtTest

Item {
    id: fixture
    property int componentSignals: 0
    property var retiring: null
    Component {
        id: factory
        QtObject {
            Component.onDestruction: fixture.componentSignals++
        }
    }
    TestCase {
        name: "QObjectRetirementBoundaryExploration"
        function test_qml_destruction_callback_is_not_post_native_ack() {
            fixture.retiring = factory.createObject(fixture)
            verify(fixture.retiring)
            // QObject::destroyed is not exposed as a usable QML signal here.
            // Do not build a safety barrier around a nonexistent Connections hook.
            compare(typeof fixture.retiring.destroyed,"undefined")
            fixture.retiring.destroy()
            // Neither the JS call nor a QML Component callback is our proposed
            // native barrier. Check whether an external QObject signal is usable.
            compare(fixture.componentSignals,0)
            tryCompare(fixture,"componentSignals",1,1000)
            fixture.retiring = null
        }
    }
}
