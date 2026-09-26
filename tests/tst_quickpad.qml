import QtQuick
import QtTest
import QtCore as Core
import "../build/quick-pad-native" as Quick

Item {
    id: surface; width: 810; height: 1080
    Component { id: candidate; Quick.NativeHost { anchors.fill: parent } }
    Component { id: factory; NativeFixture { hostFactory: candidate } }
    Component { id: seedFactory; Core.Settings { category: "companion"; property string pairsJson: "" } }
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
            compare(f.host.quickPadWidth,f.host.width*2/3); verify(f.host.secondarySelected)
            verify(f.host.toggleQuickPad()); settle(); verify(!f.host.paired)
            compare(f.host.companionId,"")
            verify(f.host.toggleQuickPad()); settle()
            compare(f.bridge.padOpenCount,1); compare(f.bridge.fitCount,1)
        }
        function test_warm_close_does_not_collapse_source_or_cached_pad_geometry() {
            openPad()
            var mainHeights=[], padHeights=[]
            var recordMain=function() { mainHeights.push(f.host.mainInputHeight) }
            var recordPad=function() { padHeights.push(f.host.secondaryInputHeight) }
            f.host.mainInputHeightChanged.connect(recordMain)
            f.host.secondaryInputHeightChanged.connect(recordPad)
            var padHeight=f.host.secondaryInputHeight
            verify(f.host.toggleQuickPad()); settle()
            f.host.mainInputHeightChanged.disconnect(recordMain)
            f.host.secondaryInputHeightChanged.disconnect(recordPad)
            compare(JSON.stringify(mainHeights),"[]")
            compare(JSON.stringify(padHeights),"[]")
            compare(f.host.mainInputHeight,f.host.height)
            compare(f.host.secondaryInputHeight,padHeight)
            verify(f.host.quickPadCached); verify(!f.host.paired)
        }
        function test_companion_toolbar_first_use_and_warm_toggle() {
            verify(f.host.toggleCompanion()); tryCompare(f.host,"transitionPhase","choosing")
            verify(!f.host.quickPadChoosing)
            verify(f.host.pick(pad)); settle()
            var view=f.host.secondary
            verify(f.host.toggleCompanion()); settle(); verify(!f.host.paired)
            compare(f.host.companionId,pad)
            verify(f.host.toggleCompanion()); settle(); verify(f.host.paired)
            compare(f.host.secondary,view)
            f.host.choose(); tryCompare(f.host,"transitionPhase","choosing")
            f.host.dismissChooser(); settle(); verify(f.host.paired)
        }
        function test_corner_toggle_skips_redundant_fit_and_full_refresh() {
            verify(f.host.layoutChoice(2)); tryCompare(f.host,"transitionPhase","choosing")
            var refreshes=f.bridge.refreshCount
            verify(f.host.pick(pad)); settle()
            compare(f.bridge.refreshCount,refreshes); compare(f.bridge.fitCount,1)
            var view=f.host.secondary
            verify(f.host.toggleCompanion()); settle(); verify(!f.host.paired)
            verify(f.host.toggleCompanion()); settle(); verify(f.host.paired)
            compare(f.host.secondary,view); compare(f.bridge.fitCount,1)
            compare(f.bridge.refreshCount,refreshes)
            verify(f.host.layoutChoice(.25)); tryCompare(f.host,"companionLayout","split"); settle()
            verify(f.host.layoutChoice(2)); tryCompare(f.host,"companionLayout","corner"); settle(); compare(f.bridge.fitCount,2)
        }
        function test_quickpad_to_companion_and_first_pair_picker() {
            openPad()
            verify(f.host.toggleCompanion()); tryCompare(f.host,"transitionPhase","choosing")
            verify(!f.host.quickPadChoosing); verify(!f.host.quickPadActive)
            verify(f.host.pick(pad)); settle(); verify(f.host.paired)
            verify(f.host.toggleQuickPad()); settle(); verify(f.host.quickPadActive)
            verify(f.host.toggleCompanion()); settle(); verify(f.host.paired)
            verify(!f.host.quickPadActive); compare(f.host.companionId,pad)
            compare(f.host.quickPadId,pad)
        }
        function test_companion_corner_picker_geometry_and_split_return() {
            verify(f.host.layoutChoice(2)); tryCompare(f.host,"transitionPhase","choosing")
            verify(!f.host.quickPadChoosing)
            verify(f.host.pick(pad)); settle()
            compare(f.host.companionLayout,"corner"); verify(!f.host.quickPadActive)
            compare(f.bridge.padOpenCount,0); compare(f.bridge.fitCount,1)
            var sheet=findChild(f.host,"quickPadSheet")
            compare(sheet.width,f.host.quickPadWidth); compare(sheet.height,f.host.quickPadHeight)
            compare(sheet.x,f.host.width-sheet.width); compare(sheet.y,f.host.height-sheet.height)
            compare(f.host.mainInputHeight,f.host.height)
            compare(f.host.secondaryInputHeight,sheet.height-f.host.barHeight)
            f.host.checkpoint()
            compare(f.host.pairs.pairs[f.host.primaryId].layout,"corner")
            var view=f.host.secondary
            verify(f.host.layoutChoice(0)); tryCompare(f.host,"paired",false); settle()
            verify(f.host.layoutChoice(2)); tryCompare(f.host,"paired",true); settle()
            compare(f.host.secondary,view)
            verify(f.host.layoutChoice(0.25)); tryCompare(f.host,"companionLayout","split"); settle()
            compare(sheet.width,f.host.width); compare(f.host.revealHeight,f.host.height/4)
            f.host.checkpoint(); verify(f.host.pairs.pairs[f.host.primaryId].layout === undefined)
        }
        function test_companion_corner_persists_and_quickpad_restores_it() {
            verify(f.host.layoutChoice(2)); tryCompare(f.host,"transitionPhase","choosing")
            verify(f.host.pick(pad)); settle(); f.host.checkpoint()
            var url=f.storeLocation
            f.destroy(); f=null; wait(20)
            f=createTemporaryObject(factory,surface,{storeLocation:url})
            tryCompare(f.host,"transitionPhase","idle")
            compare(f.host.companionLayout,"corner"); verify(!f.host.paired)
            verify(f.host.openSecondary()); settle()
            var page=f.host.secondary.currentPageId
            verify(f.host.saveQuickPad(pad,"left","compact"))
            verify(f.host.toggleQuickPad()); settle(); verify(f.host.quickPadActive)
            verify(f.host.toggleQuickPad()); settle()
            verify(!f.host.quickPadActive); verify(f.host.paired)
            compare(f.host.companionLayout,"corner"); compare(f.host.secondary.currentPageId,page)
            compare(findChild(f.host,"quickPadSheet").x,0)
            compare(f.host.quickPadId,pad)
        }
        function test_corner_picker_cancel_and_geometry_stays_parked() {
            verify(f.host.layoutChoice(2)); tryCompare(f.host,"transitionPhase","choosing")
            f.host.dismissChooser(); settle()
            compare(f.host.companionLayout,"split"); verify(!f.host.paired)
            f.host.choose(); tryCompare(f.host,"transitionPhase","choosing")
            // Cancelled corner intent must not leak into a later normal picker.
            verify(f.host.pick(pad)); settle()
            var sheet=findChild(f.host,"quickPadSheet")
            compare(sheet.width,f.host.width)
            f.pen.penDownChanged(true); verify(f.host.layoutChoice(2)); wait(150)
            compare(f.host.companionLayout,"split"); compare(sheet.width,f.host.width)
            f.pen.penDownChanged(false); tryCompare(f.host,"companionLayout","corner"); settle()
            compare(sheet.width,f.host.quickPadWidth)
        }
        function test_upgrade_preserves_preexisting_pairs() {
            var url=Qt.resolvedUrl("../build/test-settings/upgrade-"+Date.now()+".ini")
            var seed=seedFactory.createObject(surface,{location:url})
            var pairs={version:1,pairs:{}}
            pairs.pairs[f.primary.document.id]={companion:pad,ratio:0.25,pageId:"33333333-3333-4333-8333-333333333333"}
            seed.pairsJson=JSON.stringify(pairs); seed.sync(); seed.destroy(); wait(20)
            f.destroy(); f=null; wait(20)
            f=createTemporaryObject(factory,surface,{storeLocation:url})
            tryCompare(f.host,"transitionPhase","idle")
            compare(JSON.stringify(f.host.pairs),JSON.stringify(pairs))
            verify(f.host.saveQuickPad(pad,"left"))
            f.destroy(); f=null; wait(20)
            f=createTemporaryObject(factory,surface,{storeLocation:url})
            tryCompare(f.host,"transitionPhase","idle")
            compare(JSON.stringify(f.host.pairs),JSON.stringify(pairs))
            compare(f.host.quickPadId,pad)
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
            compare(f.host.quickPadCorner,"left"); compare(f.host.quickPadX,0)
            f.host.checkpoint(); compare(JSON.stringify(f.host.pairs),before)
            verify(f.host.selectPane(false)); settle()
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
        function test_native_corner_bounds_and_toolbar_toggle() {
            openPad()
            var sheet=findChild(f.host,"quickPadSheet")
            verify(sheet); compare(sheet.scale,1)
            fuzzyCompare(sheet.x,f.host.width/3,.001)
            compare(sheet.x + sheet.width,f.host.width)
            fuzzyCompare(sheet.y,f.host.height*2/3,.001); compare(sheet.y+sheet.height,f.host.height)
            compare(f.host.mainInputHeight,f.host.height)
            compare(f.host.secondaryInputHeight,sheet.height-f.host.barHeight)
            verify(!findChild(f.host,"quickPadClose"))
            verify(f.host.toggleQuickPad())
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
        function test_presets_cancel_apply_and_reload() {
            openPad()
            for(var size of ["compact","roomy","wide"]) {
                verify(f.host.configureQuickPad()); tryCompare(f.host,"transitionPhase","choosing")
                verify(f.host.setQuickPadSize(size)); verify(f.host.setQuickPadCorner("left"))
                var old=f.host.quickPadSize; f.host.dismissChooser(); settle(); compare(f.host.quickPadSize,old)
                verify(f.host.configureQuickPad()); tryCompare(f.host,"transitionPhase","choosing")
                verify(f.host.setQuickPadSize(size)); verify(f.host.setQuickPadCorner("left"))
                var apply=findChild(f.host,"quickPadApplySettings"); verify(apply.visible)
                mouseClick(apply,apply.width/2,apply.height/2); settle()
                compare(f.host.quickPadSize,size); compare(f.host.quickPadX,0)
                fuzzyCompare(f.host.quickPadHeight,f.host.height*(size === "roomy" ? .5 : 1/3),.001)
                f.host.loadQuickPad(); compare(f.host.quickPadSize,size)
            }
        }
        function test_toggles_keep_compositor_and_skip_forced_whole_page_refresh() {
            var before=f.bridge.refreshCount
            openPad(); verify(f.host.quickPadCompositing)
            verify(f.host.toggleQuickPad()); settle(); verify(f.host.quickPadCompositing)
            verify(f.host.toggleQuickPad()); settle(); verify(f.host.quickPadCompositing)
            compare(f.bridge.refreshCount,before)
            verify(f.host.nativeOperation(f.primary,function(){f.primary.document={id:"44444444-4444-4444-8444-444444444444"}}))
            settle(); verify(!f.host.quickPadCompositing)
        }
        function test_warm_tuck_preserves_view_geometry_and_pairings() {
            openPad(); var view=f.host.secondary; var sheet=findChild(f.host,"quickPadSheet")
            var width=sheet.width, height=sheet.height, x=sheet.x, y=sheet.y
            var before=JSON.stringify(f.host.pairs), closed=f.bridge.closeCount
            verify(f.host.toggleQuickPad()); settle()
            verify(f.host.quickPadCached); verify(!f.host.quickPadActive); verify(!f.host.paired)
            compare(f.host.secondary,view); verify(!sheet.visible)
            compare(sheet.width,width); compare(sheet.height,height); compare(sheet.x,x); compare(sheet.y,y)
            f.host.checkpoint(); compare(JSON.stringify(f.host.pairs),before)
            verify(f.host.toggleQuickPad()); settle()
            compare(f.host.secondary,view); compare(f.bridge.closeCount,closed)
            verify(!f.host.quickPadCached); verify(f.host.quickPadActive)
        }
        function test_cached_pad_is_retired_on_source_change_or_sleep() {
            openPad(); verify(f.host.toggleQuickPad()); settle()
            verify(f.host.nativeOperation(f.primary,function(){f.primary.document={id:"44444444-4444-4444-8444-444444444444"}})); settle()
            verify(!f.host.secondary); verify(!f.host.quickPadCached)
            verify(f.host.toggleQuickPad()); settle(); verify(f.host.toggleQuickPad()); settle()
            f.bridge.available=false; tryCompare(f.host,"transitionPhase","suspended",4000)
            verify(!f.host.secondary); verify(!f.host.quickPadCached)
        }
        function test_changed_last_page_reloads_and_layout_choices_do_not_resize_cached_pad() {
            openPad(); verify(f.host.toggleQuickPad()); settle()
            f.bridge.padCurrent=false; verify(f.host.toggleQuickPad()); settle()
            compare(f.bridge.padOpenCount,2)
            verify(f.host.toggleQuickPad()); settle()
            verify(f.host.applyLayoutChoice(.25)); tryCompare(f.host,"transitionPhase","choosing",4000)
            verify(!f.host.quickPadCached); verify(!f.host.quickPadChoosing)
            verify(f.host.pick(pad)); settle(); verify(!f.host.quickPadActive)
            compare(f.host.revealHeight,f.host.height*.25)
        }
        function test_sharing_allows_pick_toggle_corner_and_companion_switch() {
            f.bridge.sharingActive=true
            verify(f.host.configureQuickPad()); tryCompare(f.host,"transitionPhase","choosing")
            verify(f.host.pickQuickPad(pad)); settle(); verify(f.host.quickPadActive)
            verify(f.host.toggleQuickPad()); settle(); verify(!f.host.paired)
            verify(f.host.toggleQuickPad()); settle(); verify(f.host.quickPadActive)
            verify(f.host.toggleCompanion()); tryCompare(f.host,"transitionPhase","choosing")
            verify(f.host.pick(pad)); settle(); verify(f.host.paired)
            verify(f.host.chooseCompanionCorner()); settle(); verify(f.host.companionCornerSelected)
            verify(f.host.toggleCompanion()); settle(); verify(!f.host.paired)
            verify(f.host.toggleCompanion()); settle(); verify(f.host.paired)
            compare(f.host.error,"")
        }
        function test_failed_fit_never_publishes_even_while_sharing() {
            verify(f.host.saveQuickPad(pad,"right")); f.bridge.sharingActive=true
            f.bridge.failFit=true
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
            verify(f.host.configureQuickPad())
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
