import QtQuick
import QtTest
import "../build/ordinary-native" as Ordinary
// This directory retains the consumed passing hardware cohort. Current-source
// tool-preparation ordering is separately tested in ordinary-driver.test.cjs;
// do not overwrite the historical artifact just to rerun this regression.

Item {
    id: surface; width: 1620; height: 2160
    Component { id: hostFactory; Ordinary.NativeHost { anchors.fill: parent } }
    Component { id: fixtureFactory; NativeFixture {} }
    TestCase {
        name: "OrdinaryLifecycleDiagnosticMocks"; when: windowShown
        property var fixture
        property int sequence: 0
        function init() {
            fixture=createTemporaryObject(fixtureFactory,surface,{
                width:1620,height:2160,hostFactory:hostFactory,
                storeLocation:Qt.resolvedUrl("../build/test-settings/ordinary-"+Date.now()+"-"+(sequence++)+".ini")
            })
            verify(fixture);verify(fixture.host);verify(fixture.host.ordinaryProbe)
        }
        function arm() {
            tryCompare(fixture.host,"probePhase",4,5000)
            compare(fixture.host.probeFailure,"")
            compare(fixture.host.revealHeight,1080)
            verify(fixture.host.probeAllows(fixture.primary))
            verify(fixture.host.probeAllows(fixture.host.secondary))
            verify(!fixture.host.probeAllows(null))
        }
        function submit(view) {
            var stroke={pointCount:31,boundingRect:Qt.rect(10,20,300,50)}
            verify(fixture.host.probeBeforeSubmit(view,stroke,view.sceneController,view.penHandler))
            fixture.host.probeSubmitted(view,stroke)
            fixture.host.noteToolbarOwner(view)
        }
        function test_actual_controls_complete_full_disposable_sequence() {
            arm()
            var view=fixture.host.secondary, firstController=fixture.primary.sceneController, secondController=view.sceneController
            submit(fixture.primary); submit(view)
            tryCompare(fixture.host,"probePhase",10,5000)
            compare(fixture.host.revealHeight,1440);compare(fixture.host.savedRatio,2/3)
            compare(fixture.host.secondary,view)
            submit(fixture.primary);submit(view)
            tryCompare(fixture.host,"probePhase",15,7000)
            tryCompare(fixture.host,"transitionPhase","choosing",2000)
            fixture.host.probeSettledTicks=99
            tryCompare(fixture.host,"probePhase",16,1000)
            compare(fixture.host.probeFailure,"")
            compare(fixture.host.probeCounts,[2,2])
            compare(fixture.host.transitionGeneration,7)
            verify(fixture.host.inputGeometryPending);verify(!fixture.host.probeWriting)
            compare(fixture.primary.sceneController,firstController);compare(view.sceneController,secondController)
            compare(fixture.bridge.closeCount,0);compare(fixture.bridge.probeCreateCount,1)
            compare(fixture.bridge.probeRestoreCount,0)
        }
        function test_foreign_controller_refused_before_native_submission() {
            arm();var stroke={pointCount:31,boundingRect:Qt.rect(10,20,300,50)}
            verify(!fixture.host.probeBeforeSubmit(fixture.primary,stroke,{},fixture.primary.penHandler))
            verify(fixture.host.probeFailure.length>0);compare(fixture.host.probeCounts,[0,0])
        }
        function test_unexpected_physical_shape_refused_before_native_submission() {
            arm();var stroke={pointCount:31,boundingRect:Qt.rect(1000,1200,300,50)}
            verify(!fixture.host.probeBeforeSubmit(fixture.primary,stroke,fixture.primary.sceneController,fixture.primary.penHandler))
            verify(fixture.host.probeFailure.length>0);compare(fixture.host.probeCounts,[0,0])
        }
    }
}
