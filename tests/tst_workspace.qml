import QtQuick
import QtTest
import "../ui"

Item {
    id: host
    width: 600; height: 900
    Component { id: factory; CompanionWorkspace { width: 600; height: 900 } }
    TestCase {
        name: "CompanionInteraction"; when: windowShown
        property var workspace
        function init() { workspace = createTemporaryObject(factory, host); verify(workspace); wait(20) }
        function test_header_drag_does_not_resize() {
            var h = workspace.mainView.height
            var initial = workspace.overlayTop
            mousePress(workspace,300,initial + 20)
            mouseMove(workspace,300,initial - 80,20)
            compare(workspace.overlayTop,initial)
            compare(workspace.mainView.height,h)
            mouseRelease(workspace,300,initial - 80)
            compare(workspace.state.busy,null)
        }
        function test_ruler_taps_change_size() {
            var ruler = workspace.sizeRuler
            for (var i = 0; i < 3; ++i) {
                mouseClick(ruler, ruler.width * (i + 0.5) / 3, ruler.height / 2)
                compare(workspace.state.ratio,ruler.sizes[i])
                compare(workspace.revealed,900*ruler.sizes[i])
                compare(workspace.mainView.height,900)
            }
        }
        function test_ruler_drag_is_not_a_size_choice() {
            var ruler = workspace.sizeRuler
            mousePress(ruler,ruler.width/2,ruler.height/2)
            mouseMove(ruler,ruler.width/2,ruler.height/2-80,20)
            mouseRelease(ruler,ruler.width/2,ruler.height/2-80)
            compare(workspace.state.ratio,1/3)
        }
        function test_tap_focus() {
            mouseClick(workspace,200,workspace.overlayTop+100)
            compare(workspace.activePane,"companion")
            mouseClick(workspace,200,200)
            compare(workspace.activePane,"main")
        }
        function test_independent_scroll() {
            workspace.mainView.contentY = 120
            workspace.companionView.contentY = 220
            mouseWheel(workspace,200,workspace.overlayTop+100,0,-120)
            wait(250)
            compare(workspace.mainView.contentY,120)
            verify(workspace.companionView.contentY > 220)
            compare(workspace.activePane,"main")
        }
        function test_tuck_restore() {
            workspace.companionView.contentY = 210
            workspace.tuck(); compare(workspace.revealed,0)
            workspace.reveal(); compare(workspace.companionView.contentY,210)
        }
        function test_direct_pen_writing_and_lock() {
            workspace.inkMode = true
            mousePress(workspace,200,workspace.overlayTop+100)
            compare(workspace.activePane,"companion")
            compare(workspace.state.busy.kind,"stroke")
            compare(workspace.state.busy.document,"demo-notes")
            verify(!workspace.tuck())
            mouseRelease(workspace,200,workspace.overlayTop+110)
            compare(workspace.state.busy,null)
            mousePress(workspace,200,100)
            compare(workspace.state.busy.document,"demo-reference")
            mouseRelease(workspace,200,110)
        }
        function test_pen_mode_ruler_still_works_without_inking_chrome() {
            workspace.inkMode = true
            var ruler = workspace.sizeRuler
            mouseClick(ruler,ruler.width/2,ruler.height/2)
            compare(workspace.revealed,450)
            compare(workspace.state.busy,null)
        }
        function test_z_render_capture() {
            mouseClick(workspace,200,workspace.overlayTop+100)
            waitForRendering(workspace)
            var shot = grabImage(workspace)
            compare(shot.width,600); compare(shot.height,900)
            shot.save("/tmp/companion-notebook-desktop.png") // Qt Test save() returns void.
        }
    }
}
