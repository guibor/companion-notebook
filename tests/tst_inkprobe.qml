import QtQuick
import QtTest
import "../build/ink-native" as Ink

Item {
    id: surface; width: 1620; height: 2160
    Component { id: hostFactory; Ink.NativeHost { anchors.fill: parent } }
    Component { id: fixtureFactory; NativeFixture {} }
    TestCase {
        name: "FixedInkDiagnosticMocks"; when: windowShown
        property var fixture
        property int sequence: 0
        function init() {
            fixture = createTemporaryObject(fixtureFactory,surface,{
                width:1620,height:2160,hostFactory:hostFactory,
                storeLocation:Qt.resolvedUrl("../build/test-settings/ink-"+Date.now()+"-"+(sequence++)+".ini")
            })
            verify(fixture);verify(fixture.host);verify(!fixture.host.inkQualified)
        }
        function arm() { tryCompare(fixture.host,"probePhase",4,10000);compare(fixture.host.probeFailure,"") }
        function stroke() { return {pointCount:31,boundingRect:Qt.rect(10,20,300,50)} }
        function test_both_panes_without_selection() {
            arm()
            verify(!fixture.host.secondarySelected)
            verify(fixture.host.probeAllows(fixture.primary))
            verify(fixture.host.probeAllows(fixture.host.secondary))
            fixture.host.probeSubmitted(fixture.primary,stroke())
            fixture.host.probeSubmitted(fixture.host.secondary,stroke())
            tryCompare(fixture.host,"probePhase",5,1000)
            verify(!fixture.host.probeWriting)
            fixture.host.probeSettledTicks=99
            tryCompare(fixture.host,"probePhase",6,1000)
            compare(fixture.bridge.probeRestoreCount,0)
            compare(fixture.host.probeFailure,"")
        }
        function test_actions_locked_after_arming() {
            arm();var view=fixture.host.secondary
            verify(!fixture.host.tuck());verify(!fixture.host.selectPane(true))
            verify(!fixture.host.beginDrag(100));verify(!fixture.host.openSecondary())
            fixture.host.closeSecondary(false)
            compare(fixture.host.secondary,view);compare(fixture.host.revealHeight,1080)
            compare(fixture.bridge.closeCount,0)
        }
        function test_failure_closes_gate_without_rebinding() {
            arm();var view=fixture.host.secondary
            fixture.host.probeSubmitted(view,{pointCount:31,boundingRect:Qt.rect(1000,20,300,50)})
            verify(fixture.host.probeFailure.length>0);verify(!fixture.host.probeWriting)
            compare(fixture.host.secondary,view);compare(fixture.bridge.probeRestoreCount,0)
            verify(fixture.host.probeDocumentLocked)
        }
    }
}
