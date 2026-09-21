import QtQuick
import QtTest

Item {
    id: surface; width: 600; height: 900
    Component { id: fixtureFactory; NativeFixture {} }
    TestCase {
        name: "NativeHostBoundaryMocks"; when: windowShown
        property var fixture
        property int sequence: 0
        readonly property string notes: "22222222-2222-4222-8222-222222222222"
        function init() {
            fixture = createTemporaryObject(fixtureFactory,surface,{storeLocation: Qt.resolvedUrl("../build/test-settings/"+Date.now()+"-"+(sequence++)+".ini")})
            verify(fixture); verify(fixture.host.storeReady)
        }
        function open() { verify(fixture.host.pick(notes)); tryCompare(fixture.host,"restoring",false,1500); verify(fixture.host.paired) }
        function test_native_factory_and_tuck() {
            open(); var view=fixture.host.secondary
            verify(fixture.host.tuck()); compare(fixture.host.secondary,view)
            compare(fixture.bridge.closeCount,0)
            verify(fixture.host.openSecondary()); compare(fixture.host.secondary,view)
        }
        function test_self_pair_rejected() {
            verify(!fixture.host.pick(fixture.primary.document.id)); compare(fixture.host.secondary,null)
        }
        function test_pen_signal_locks_layout_and_focus() {
            open(); fixture.pen.penDownChanged(true)
            verify(!fixture.host.tuck()); verify(!fixture.host.beginDrag(620)); verify(!fixture.host.selectPane(true))
            fixture.pen.penDownChanged(false); verify(fixture.host.selectPane(true))
        }
        function test_probe_never_calls_native_edit_action() {
            open(); fixture.host.selectPane(true); fixture.host.action("＋")
            compare(fixture.bridge.lastAction,""); compare(fixture.host.inkQualified,false)
        }
        function test_streaming_prevents_disclosure() {
            fixture.bridge.sharingActive=true; verify(!fixture.host.pick(notes))
            compare(fixture.host.secondary,null); verify(fixture.host.error.length>0)
        }
        function test_open_failure_preserves_primary() {
            fixture.bridge.failCreate=true; verify(!fixture.host.pick(notes))
            compare(fixture.primary.document.id,"11111111-1111-4111-8111-111111111111")
            compare(fixture.host.secondary,null); verify(fixture.host.error.length>0)
        }
        function test_primary_change_closes_secondary_once() {
            open(); fixture.primary.document={id:"44444444-4444-4444-8444-444444444444"}
            compare(fixture.bridge.closeCount,1); compare(fixture.host.secondary,null)
            compare(fixture.host.companionId,"")
        }
        function test_remove_pair_never_deletes_document() {
            open(); fixture.host.detach(); compare(fixture.bridge.closeCount,1)
            compare(Object.keys(fixture.host.pairs.pairs).length,0)
            compare(fixture.primary.document.id,"11111111-1111-4111-8111-111111111111")
        }
        function test_settings_survive_host_recreation() {
            open(); var url=fixture.storeLocation
            fixture.host.tuck(); fixture.destroy(); fixture=null
            wait(20)
            fixture=createTemporaryObject(fixtureFactory,surface,{storeLocation:url})
            verify(fixture); compare(fixture.host.companionId,notes)
            compare(fixture.host.revealHeight,0); compare(fixture.host.secondary,null)
        }
        function test_live_native_container_drag() {
            open(); var top=fixture.host.height-fixture.host.revealHeight
            mousePress(fixture.host,300,top+5)
            mouseMove(fixture.host,300,top-80,25)
            verify(fixture.host.revealHeight>fixture.host.height*0.35+50)
            mouseRelease(fixture.host,300,top-80)
            verify(!fixture.host.dragging)
        }
        function test_pull_from_tucked_is_continuous() {
            open(); fixture.host.tuck()
            var view = fixture.host.secondary
            mousePress(fixture.host,300,885)
            mouseMove(fixture.host,300,650,25)
            verify(fixture.host.revealHeight > 200)
            compare(fixture.host.secondary,view)
            verify(fixture.host.dragging)
            mouseRelease(fixture.host,300,650)
            verify(fixture.host.paired); verify(!fixture.host.dragging)
            verify(!fixture.host.pullingFromTucked)
        }
        function test_unavailable_during_pen_waits_until_pen_up_to_tuck() {
            open(); fixture.pen.penDownChanged(true)
            fixture.bridge.portrait = false
            verify(fixture.host.paired)
            fixture.pen.penDownChanged(false)
            verify(!fixture.host.paired)
            compare(fixture.bridge.closeCount,0)
        }
        function test_native_gesture_locks_layout_without_changing_focus() {
            open(); fixture.primary.cnGestureBusy = true
            verify(!fixture.host.beginDrag(620)); verify(!fixture.host.selectPane(true))
            fixture.primary.cnGestureBusy = false; verify(fixture.host.selectPane(true))
            fixture.host.secondary.cnGestureBusy = true
            verify(!fixture.host.tuck()); verify(!fixture.host.selectPane(false))
        }
        function test_sheet_movement_refreshes_native_input_before_ungating() {
            open(); tryCompare(fixture.host,"inputGeometryPending",false)
            var count=fixture.bridge.geometryCount
            verify(fixture.host.beginDrag(600));fixture.host.moveDrag(500)
            verify(fixture.host.inputGeometryPending)
            wait(20);compare(fixture.bridge.geometryCount,count)
            fixture.host.finishDrag(false)
            verify(fixture.host.inputGeometryPending)
            tryCompare(fixture.host,"inputGeometryPending",false)
            verify(fixture.bridge.geometryCount>=count+2)
        }
        function test_geometry_failure_stays_pen_gated() {
            open();tryCompare(fixture.host,"inputGeometryPending",false)
            fixture.bridge.failGeometry=true
            fixture.host.scheduleInputGeometry()
            tryVerify(function(){return fixture.host.error.length>0})
            verify(fixture.host.inputGeometryPending)
        }
        function test_geometry_refresh_waits_for_pen_up() {
            open();tryCompare(fixture.host,"inputGeometryPending",false)
            fixture.pen.penDownChanged(true)
            var count=fixture.bridge.geometryCount
            fixture.host.scheduleInputGeometry();wait(20)
            compare(fixture.bridge.geometryCount,count);verify(fixture.host.inputGeometryPending)
            fixture.pen.penDownChanged(false)
            tryCompare(fixture.host,"inputGeometryPending",false)
            verify(fixture.bridge.geometryCount>=count+2)
        }
        function test_toolbar_follows_completed_stroke_only_after_pen_up() {
            open(); fixture.pen.penDownChanged(true)
            fixture.host.noteToolbarOwner(fixture.host.secondary)
            wait(60);verify(!fixture.host.secondarySelected)
            fixture.pen.penDownChanged(false)
            tryCompare(fixture.host,"secondarySelected",true)
        }
        function test_closed_stroke_owner_cannot_retake_toolbar() {
            open(); fixture.host.noteToolbarOwner(fixture.host.secondary)
            fixture.host.closeSecondary(false)
            wait(60);verify(!fixture.host.secondarySelected)
        }
    }
}
