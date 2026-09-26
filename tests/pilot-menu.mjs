import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const corner=process.env.CN_QUICK_PAD === '1';
let menu=fs.readFileSync('native/layout-menu.qml.inc','utf8');
if (corner) {
  const q=fs.readFileSync('build/quick-pad-composed-last/qt/qml/xofm/libs/toolbar/qml/SettingsMenu.qml','utf8');
  const id=q.indexOf('id: cnLayoutControls');
  if(id<0)throw new Error('Generated layout menu missing');
  const start=q.lastIndexOf('RowLayout {',id);
  let end=q.indexOf('{',start)+1,depth=1;
  while(depth){if(q[end]==='{')depth++;if(q[end]==='}')depth--;end++;}
  menu=q.slice(start,end);
}
menu=menu.replaceAll('Values.','values.');
const choices=corner?[0,.25,.375,.5,2,1]:[0,.25,.375,.5,1];
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
 QtObject { id: values; property real cnLayoutRatio: 0; property int chosen: -1; property bool cnQuickPadActive: false
   function cnLayoutRequested(index) { chosen = index }
 }
 ${menu}
 TestCase { name: "PilotMenu"; when: windowShown
   function test_all_choices() {
     for (var i = 0; i < ${choices.length}; ++i) {
       values.chosen = -1; root.closed = false
       var button = cnLayoutControls.children[i]
       verify(button); compare(button.modelData, ${JSON.stringify(choices)}[i])
       verify(button.width >= 50); verify(button.x + button.width <= root.width + 1)
       values.cnLayoutRatio=button.modelData
       compare(button.color.toString(),"#dddddd")
       mouseClick(button, button.width / 2, button.height / 2)
       compare(values.chosen, i); verify(root.closed)
     }
   }
 }
}
`);
execFileSync('qmltestrunner',['-input','build/pilot-menu-test'],{env:{...process.env,QT_QPA_PLATFORM:'offscreen',QT_QUICK_BACKEND:'software'},stdio:'inherit'});
