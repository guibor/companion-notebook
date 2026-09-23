import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const menu=fs.readFileSync('native/layout-menu.qml.inc','utf8').replaceAll('Values.','values.');
fs.mkdirSync('build/pilot-menu-test',{recursive:true});
fs.writeFileSync('build/pilot-menu-test/tst_menu.qml', `
import QtQuick
import QtQuick.Layouts
import QtTest
Item {
 id: root; width: 400; height: 100
 property string documentType: "note"
 property QtObject toolbar: QtObject { function closeFoldout() { root.closed = true } }
 property bool closed: false
 QtObject { id: values; property real cnLayoutRatio: 0; property int chosen: -1
   function cnLayoutRequested(index) { chosen = index }
 }
 ${menu}
 TestCase { name: "PilotMenu"; when: windowShown
   function test_all_choices() {
     for (var i = 0; i < 5; ++i) {
       values.chosen = -1; root.closed = false
       var button = cnLayoutControls.children[i]
       verify(button); compare(button.modelData, [0, 0.25, 0.375, 0.5, 1][i])
       mouseClick(button, button.width / 2, button.height / 2)
       compare(values.chosen, i); verify(root.closed)
     }
   }
 }
}
`);
execFileSync('qmltestrunner',['-input','build/pilot-menu-test'],{env:{...process.env,QT_QPA_PLATFORM:'offscreen',QT_QUICK_BACKEND:'software'},stdio:'inherit'});
