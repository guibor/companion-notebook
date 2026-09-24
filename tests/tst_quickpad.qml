import QtQuick
import QtTest
import "../build/quick-pad-native" as Quick

Item {
    id: surface; width: 810; height: 1080
    Component { id: candidate; Quick.NativeHost { anchors.fill: parent } }
    Component { id: factory; NativeFixture { hostFactory: candidate } }
    TestCase {
        name: "QuickPadOffline"; when: windowShown
        property var f
        property int sequence: 0
        readonly property string pad: "22222222-2222-4222-8222-222222222222"
        function init() {
            f = createTemporaryObject(factory,surface,{storeLocation:Qt.resolvedUrl("../build/test-settings/pad-"+Date.now()+"-"+(sequence++)+".ini")})
            verify(f); tryCompare(f.host,"transitionPhase","idle")
            verify(f.host.quickPadStoreReady)
        }
        function settle() { tryCompare(f.host,"transitionPhase","idle",4000); compare(f.host.error,"") }
        function openPad() {
            verify(f.host.toggleQuickPad()); tryCompare(f.host,"transitionPhase","choosing")
            verify(f.host.quickPadChoosing); verify(f.host.pick(pad)); settle()
            verify(f.host.quickPadActive)
        }
        function test_first_use_settings_last_page_fit_and_toggle() {
            openPad()
            compare(f.bridge.padOpenCount,1); compare(f.bridge.lastPageOpened,6)
            compare(f.bridge.fitCount,1); compare(f.host.quickPadId,pad)
            compare(f.host.quickPadScale,.5); verify(f.host.secondarySelected)
            verify(f.host.toggleQuickPad()); settle(); verify(!f.host.paired)
            compare(f.host.companionId,"")
            verify(f.host.toggleQuickPad()); settle()
            compare(f.bridge.padOpenCount,2); compare(f.bridge.fitCount,2)
        }
        function test_no_geometry_change_before_native_park_or_during_stroke() {
            verify(f.host.saveQuickPad(pad,"right"))
            f.pen.penDownChanged(true)
            verify(!f.host.toggleQuickPad()); verify(!f.host.quickPadActive)
            f.pen.penDownChanged(false)
            verify(f.host.toggleQuickPad()); verify(!f.host.quickPadActive)
            settle(); verify(f.host.quickPadActive)
            f.pen.penDownChanged(true)
            verify(!f.host.closeQuickPad()); verify(!f.host.configureQuickPad()); verify(!f.host.chooseSize(.25))
            f.pen.penDownChanged(false)
        }
        function test_pairing_and_open_split_survive_pad() {
            f.host.choose(); tryCompare(f.host,"transitionPhase","choosing")
            verify(f.host.pick(pad)); settle()
            var before=JSON.stringify(f.host.pairs)
            verify(f.host.saveQuickPad(pad,"left")); verify(f.host.toggleQuickPad()); settle()
            compare(f.host.quickPadCorner,"left"); compare(f.host.quickPadX,144*f.host.unit)
            f.host.checkpoint(); compare(JSON.stringify(f.host.pairs),before)
            verify(!f.host.selectPane(false))
            verify(f.host.toggleQuickPad()); settle(); verify(f.host.paired)
            verify(!f.host.quickPadActive); compare(JSON.stringify(f.host.pairs),before)
        }
        function test_corner_change_is_draft_until_notebook_selection() {
            openPad(); var oldX=f.host.quickPadX
            verify(f.host.configureQuickPad()); tryCompare(f.host,"transitionPhase","choosing")
            verify(f.host.setQuickPadCorner("left")); compare(f.host.quickPadX,oldX)
            f.host.dismissChooser(); settle(); compare(f.host.quickPadCorner,"right")
            verify(f.host.configureQuickPad()); tryCompare(f.host,"transitionPhase","choosing")
            verify(f.host.setQuickPadCorner("left")); verify(f.host.pick(pad)); settle()
            compare(f.host.quickPadCorner,"left"); verify(f.host.quickPadActive)
        }
        function test_settings_survive_recreation_without_auto_open() {
            openPad(); var url=f.storeLocation
            verify(f.host.closeQuickPad()); settle(); f.destroy(); f=null; wait(20)
            f=createTemporaryObject(factory,surface,{storeLocation:url})
            tryCompare(f.host,"transitionPhase","idle")
            compare(f.host.quickPadId,pad); verify(!f.host.paired); verify(!f.host.quickPadActive)
        }
        function test_corner_bounds_and_real_close_button() {
            openPad()
            var sheet=findChild(f.host,"quickPadSheet")
            verify(sheet); compare(sheet.scale,.5)
            verify(sheet.x >= 144*f.host.unit)
            verify(sheet.x + sheet.width*sheet.scale <= f.host.width-144*f.host.unit+.01)
            verify(sheet.y > 0); verify(sheet.y+sheet.height*sheet.scale < f.host.height)
            var button=findChild(f.host,"quickPadClose")
            verify(button); mouseClick(button,button.width/2,button.height/2)
            settle(); verify(!f.host.quickPadActive)
        }
        function test_unavailable_and_self_notebooks_do_not_create_views() {
            verify(f.host.saveQuickPad(pad,"right")); f.bridge.padEligible=false
            verify(f.host.toggleQuickPad()); tryCompare(f.host,"transitionPhase","choosing")
            verify(!f.host.pick(pad)); compare(f.bridge.padOpenCount,0)
            f.host.dismissChooser(); settle()
            verify(f.host.saveQuickPad(f.primary.document.id,"right"))
            verify(!f.host.toggleQuickPad()); compare(f.bridge.padOpenCount,0)
        }
        function test_sharing_blocks_open_and_failed_fit_never_publishes() {
            verify(f.host.saveQuickPad(pad,"right")); f.bridge.sharingActive=true
            verify(!f.host.toggleQuickPad()); compare(f.bridge.padOpenCount,0)
            f.host.error=""; f.bridge.sharingActive=false; f.bridge.failFit=true
            verify(f.host.toggleQuickPad()); tryCompare(f.host,"transitionPhase","failed")
            verify(f.host.inputGeometryPending)
        }
        function test_return_to_document_restores_normal_metadata() {
            openPad()
            verify(f.host.nativeOperation(f.primary,function(){f.primary.document={id:"44444444-4444-4444-8444-444444444444"}}))
            settle(); verify(!f.host.quickPadActive); compare(f.host.companionId,"")
            compare(f.host.quickPadId,pad)
        }
        function test_settings_button_and_availability_loss() {
            openPad()
            var button=findChild(f.host,"quickPadSettings")
            verify(button); mouseClick(button,button.width/2,button.height/2)
            tryCompare(f.host,"transitionPhase","choosing"); verify(f.host.quickPadChoosing)
            f.host.dismissChooser(); settle()
            f.bridge.available=false
            tryCompare(f.host,"transitionPhase","suspended",4000)
            verify(!f.host.quickPadActive); verify(!f.host.secondary)
            f.bridge.available=true; settle(); compare(f.host.quickPadId,pad)
            verify(!f.host.paired)
        }
    }
}
