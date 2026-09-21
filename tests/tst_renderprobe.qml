import QtQuick
import QtTest
import "../build/render-native" as Render

Item {
    id: surface; width: 600; height: 900
    Component { id: renderFactory; Render.NativeHost { anchors.fill: parent } }
    Component { id: fixtureFactory; NativeFixture {} }
    TestCase {
        name: "RenderingProbeDriverMocks"; when: windowShown
        property var fixture
        property int sequence: 0
        function init() {
            fixture = createTemporaryObject(fixtureFactory,surface,{
                hostFactory:renderFactory,
                storeLocation:Qt.resolvedUrl("../build/test-settings/render-"+Date.now()+"-"+(sequence++)+".ini")
            })
            verify(fixture); verify(fixture.host); verify(fixture.host.renderProbeOnly)
        }
        function test_bounded_native_sequence_restores_original() {
            tryCompare(fixture.host,"probeSucceeded",true,12000)
            compare(fixture.host.probeFailure,"")
            compare(fixture.bridge.probeCreateCount,1)
            compare(fixture.bridge.probeRestoreCount,1)
            compare(fixture.primary.document.id,"11111111-1111-4111-8111-111111111111")
            compare(fixture.host.secondary,null)
            verify(!fixture.primary.cnInkAllowed)
        }
        function test_unavailable_does_not_create_or_close_any_document() {
            fixture.bridge.probeMayStart=false
            fixture.host.choose()
            verify(!fixture.host.choosing)
            wait(650)
            compare(fixture.bridge.probeCreateCount,0)
            compare(fixture.bridge.probeRestoreCount,0)
            compare(fixture.primary.document.id,"11111111-1111-4111-8111-111111111111")
        }
        function test_pen_interruption_never_creates_documents() {
            fixture.pen.penDownChanged(true)
            tryVerify(function() { return fixture.host.probeFailure.length > 0 },1500)
            compare(fixture.bridge.probeCreateCount,0)
            compare(fixture.bridge.probeRestoreCount,0)
            verify(!fixture.host.probeSucceeded)
        }
    }
}
