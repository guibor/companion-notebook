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
            tryCompare(fixture.host,"transitionPhase","idle")
        }
        function settled() { tryCompare(fixture.host,"transitionPhase","idle",2500); compare(fixture.host.error,"") }
        function chooser() { fixture.host.choose(); tryCompare(fixture.host,"transitionPhase","choosing",1500) }
        function open() { chooser(); verify(fixture.host.pick(notes)); settled(); verify(fixture.host.paired) }
        function test_native_factory_and_tuck() {
            open(); var view=fixture.host.secondary
            verify(fixture.host.tuck()); settled(); compare(fixture.host.secondary,view)
            compare(fixture.bridge.closeCount,0)
            verify(fixture.host.openSecondary()); settled(); compare(fixture.host.secondary,view)
        }
        function test_self_pair_rejected() {
            verify(!fixture.host.pick(fixture.primary.document.id)); compare(fixture.host.secondary,null)
        }
        function test_pen_signal_locks_layout_and_focus() {
            open(); fixture.pen.penDownChanged(true)
            verify(!fixture.host.tuck()); verify(!fixture.host.chooseSize(1/2)); verify(!fixture.host.selectPane(true))
            fixture.pen.penDownChanged(false); verify(fixture.host.selectPane(true))
        }
        function test_probe_never_calls_native_edit_action() {
            open(); fixture.host.selectPane(true); fixture.host.action("＋")
            compare(fixture.bridge.lastAction,""); compare(fixture.host.inkQualified,false)
        }
        function test_streaming_prevents_disclosure() {
            chooser(); fixture.bridge.sharingActive=true; verify(!fixture.host.pick(notes))
            compare(fixture.host.secondary,null); verify(fixture.host.error.length>0)
        }
        function test_open_failure_preserves_primary() {
            chooser(); fixture.bridge.failCreate=true; verify(!fixture.host.pick(notes))
            tryCompare(fixture.host,"transitionPhase","failed")
            compare(fixture.primary.document.id,"11111111-1111-4111-8111-111111111111")
            compare(fixture.host.secondary,null); verify(fixture.host.error.length>0)
        }
        function test_primary_change_closes_secondary_once() {
            open(); fixture.host.nativeOperation(fixture.primary,function(){fixture.primary.document={id:"44444444-4444-4444-8444-444444444444"}})
            settled()
            compare(fixture.bridge.closeCount,1); compare(fixture.host.secondary,null)
            compare(fixture.host.companionId,"")
        }
        function test_remove_pair_never_deletes_document() {
            open(); fixture.host.detach(); settled(); compare(fixture.bridge.closeCount,1)
            compare(Object.keys(fixture.host.pairs.pairs).length,0)
            compare(fixture.primary.document.id,"11111111-1111-4111-8111-111111111111")
        }
        function test_settings_survive_host_recreation() {
            open(); var url=fixture.storeLocation
            fixture.host.tuck(); settled(); fixture.destroy(); fixture=null
            wait(20)
            fixture=createTemporaryObject(fixtureFactory,surface,{storeLocation:url})
            verify(fixture); compare(fixture.host.companionId,notes)
            compare(fixture.host.revealHeight,0); compare(fixture.host.secondary,null)
        }
        function test_native_header_has_no_drag_resize() {
            open(); var top=fixture.host.height-fixture.host.revealHeight
            var reveal=fixture.host.revealHeight
            mousePress(fixture.host,50,top+5)
            mouseMove(fixture.host,50,top-80,25)
            compare(fixture.host.revealHeight,reveal)
            mouseRelease(fixture.host,50,top-80)
            verify(!fixture.host.dragging)
        }
        function test_tucked_drag_does_not_reveal_and_tap_reopens() {
            open(); fixture.host.tuck(); settled()
            var view = fixture.host.secondary
            mousePress(fixture.host,300,885)
            mouseMove(fixture.host,300,650,25)
            compare(fixture.host.revealHeight,0)
            compare(fixture.host.secondary,view)
            mouseRelease(fixture.host,300,650)
            compare(fixture.host.revealHeight,0)
            mouseClick(fixture.host,300,885)
            settled()
            verify(fixture.host.paired); verify(!fixture.host.dragging)
        }
        function test_native_size_ruler_taps_and_pair_persistence() {
            open()
            var view=fixture.host.secondary
            var ruler=findChild(fixture.host,"nativeSizeRuler")
            verify(ruler)
            for (var i=0;i<3;++i) {
                mouseClick(ruler,ruler.width*(i+0.5)/3,ruler.height/2)
                settled()
                compare(fixture.host.savedRatio,ruler.sizes[i])
                compare(fixture.host.revealHeight,900*ruler.sizes[i])
                compare(fixture.host.secondary,view)
            }
            var url=fixture.storeLocation
            fixture.host.tuck();settled();fixture.destroy();fixture=null;wait(20)
            fixture=createTemporaryObject(fixtureFactory,surface,{storeLocation:url})
            settled()
            compare(fixture.host.savedRatio,2/3);compare(fixture.host.revealHeight,0)
            verify(fixture.host.openSecondary());settled()
            compare(fixture.host.revealHeight,600)
        }
        function test_presets_reject_arbitrary_values_and_snap_legacy_values() {
            open()
            for (var value of [0,0.4,0.85,NaN,Infinity,"0.5",null]) verify(!fixture.host.chooseSize(value))
            compare(fixture.host.nearestSize(0.35),1/3)
            compare(fixture.host.nearestSize(0.49),1/2)
            compare(fixture.host.nearestSize(0.85),2/3)
        }
        function test_unavailable_during_pen_waits_until_pen_up_to_tuck() {
            open(); fixture.pen.penDownChanged(true)
            fixture.bridge.portrait = false
            verify(fixture.host.paired)
            fixture.pen.penDownChanged(false)
            settled()
            verify(!fixture.host.paired)
            compare(fixture.bridge.closeCount,1)
        }
        function test_native_gesture_locks_layout_without_changing_focus() {
            open(); fixture.primary.cnGestureBusy = true
            verify(!fixture.host.chooseSize(1/2)); verify(!fixture.host.selectPane(true))
            fixture.primary.cnGestureBusy = false; verify(fixture.host.selectPane(true))
            fixture.host.secondary.cnGestureBusy = true
            verify(!fixture.host.tuck()); verify(!fixture.host.selectPane(false))
        }
        function test_hidden_primary_waits_parked_then_wakes_tucked() {
            open(); fixture.bridge.available=false; fixture.primary.visible=false
            tryCompare(fixture.host,"transitionPhase","suspended",2500)
            compare(fixture.host.secondary,null); verify(fixture.host.inputGeometryPending)
            wait(300); compare(fixture.host.transitionPhase,"suspended")
            fixture.primary.visible=true; fixture.bridge.available=true
            settled(); compare(fixture.host.revealHeight,0)
            verify(!fixture.host.inputGeometryPending)
        }
        function test_sheet_movement_refreshes_native_input_before_ungating() {
            open(); tryCompare(fixture.host,"inputGeometryPending",false)
            var count=fixture.bridge.geometryCount
            verify(fixture.host.chooseSize(1/2))
            compare(fixture.host.transitionPhase,"draining")
            verify(!fixture.host.inputGeometryPending)
            settled()
            verify(fixture.bridge.geometryCount>=count+2)
        }
        function test_geometry_failure_stays_pen_gated() {
            open();tryCompare(fixture.host,"inputGeometryPending",false)
            fixture.bridge.failGeometry=true
            fixture.host.chooseSize(1/2)
            tryVerify(function(){return fixture.host.error.length>0})
            verify(fixture.host.inputGeometryPending)
        }
        function test_loading_waits_before_refresh_without_error_or_ungating() {
            open();tryCompare(fixture.host,"inputGeometryPending",false)
            fixture.bridge.geometryLoading=true
            var count=fixture.bridge.geometryCount
            fixture.host.chooseSize(1/2);wait(250)
            compare(fixture.bridge.geometryCount,count)
            verify(fixture.host.inputGeometryPending);compare(fixture.host.error,"")
            fixture.bridge.geometryLoading=false
            tryCompare(fixture.host,"inputGeometryPending",false)
            compare(fixture.bridge.geometryCount,count+2)
        }
        function test_loading_timeout_keeps_pen_gate_closed() {
            open();tryCompare(fixture.host,"inputGeometryPending",false)
            fixture.bridge.geometryLoading=true
            fixture.host.chooseSize(1/2);tryCompare(fixture.host,"transitionPhase","loading")
            fixture.host.transitionTicks=120
            tryVerify(function(){return fixture.host.error.length>0})
            verify(fixture.host.inputGeometryPending)
        }
        function test_tuck_refreshes_only_primary_before_restoring_ordinary_writing() {
            open();tryCompare(fixture.host,"inputGeometryPending",false)
            var count=fixture.bridge.geometryCount
            verify(fixture.host.tuck())
            settled()
            compare(fixture.bridge.geometryCount,count+1)
            verify(fixture.primary.cnInkAllowed);compare(fixture.host.error,"")
            verify(fixture.host.openSecondary())
            settled()
            compare(fixture.bridge.geometryCount,count+3)
            compare(fixture.host.error,"")
        }
        function test_geometry_refresh_waits_for_pen_up() {
            open();tryCompare(fixture.host,"inputGeometryPending",false)
            fixture.pen.penDownChanged(true)
            var count=fixture.bridge.geometryCount
            fixture.host.requestTransition("fixture-resize",function(){fixture.host.revealHeight=450});wait(30)
            compare(fixture.bridge.geometryCount,count);verify(!fixture.host.inputGeometryPending)
            compare(fixture.host.transitionPhase,"draining")
            fixture.pen.penDownChanged(false)
            settled()
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
