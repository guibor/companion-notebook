import QtQuick
import QtTest
import "../build/structural-native" as Structural

Item {
    id: surface; width: 600; height: 900
    Component { id: hostFactory; Structural.NativeHost { anchors.fill: parent } }
    Component { id: fixtureFactory; NativeFixture {} }
    TestCase {
        name: "StructuralProbeDriverMocks"; when: windowShown
        property var fixture
        property int sequence: 0
        function init() {
            fixture = createTemporaryObject(fixtureFactory,surface,{
                hostFactory:hostFactory,
                storeLocation:Qt.resolvedUrl("../build/test-settings/structural-"+Date.now()+"-"+(sequence++)+".ini")
            })
            verify(fixture); verify(fixture.host); verify(fixture.host.renderProbeOnly)
        }
        function test_no_capture_sequence_restores_original() {
            tryCompare(fixture.host,"probePhase",6,10000)
            compare(fixture.bridge.probeCaptureDone,false)
            verify(!fixture.host.probeSucceeded)
            // The state-machine test separately exercises all 40 dwell ticks.
            fixture.host.probeObservationTicks=39
            tryCompare(fixture.host,"probeSucceeded",true,4000)
            compare(fixture.host.probeFailure,"")
            compare(fixture.bridge.probeCreateCount,1)
            compare(fixture.bridge.probeRestoreCount,1)
            compare(fixture.primary.document.id,"11111111-1111-4111-8111-111111111111")
            compare(fixture.host.secondary,null)
            compare(fixture.bridge.probeCaptureDone,false)
        }
        function test_unsafe_state_aborts_during_observation() {
            tryCompare(fixture.host,"probePhase",6,10000)
            fixture.bridge.probeMayStart=false
            tryVerify(function() { return fixture.host.probeFailure.length > 0 },1500)
            verify(!fixture.host.probeSucceeded)
            compare(fixture.bridge.probeRestoreCount,1)
            compare(fixture.bridge.probeCaptureDone,false)
        }
        function test_missing_viewport_fails_closed() {
            tryCompare(fixture.host,"probePhase",6,10000)
            fixture.host.probeGeometry[2].item=null
            tryVerify(function() { return fixture.host.probeFailure.length > 0 },1500)
            verify(!fixture.host.probeSucceeded)
            compare(fixture.bridge.probeRestoreCount,1)
        }
    }
}
