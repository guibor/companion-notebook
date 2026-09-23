import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=fs.readFileSync('native/NativeHost.qml','utf8');
const popup=source.slice(source.indexOf('    Rectangle {\n        id: pickerOverlay'),source.lastIndexOf('}'));
if(!popup) throw Error('Picker missing');
fs.mkdirSync('build/pilot-picker-test',{recursive:true});
const icon='data:image/svg+xml;base64,'+fs.readFileSync('assets/companion.svg').toString('base64');
fs.writeFileSync('build/pilot-picker-test/tst_picker.qml',`
import QtQuick
import QtTest
Item {
 id: host; width: 810; height: 1080
 property real unit: 0.5
 property bool modalOpen: true
 property bool choosing: true
 property string error: ""
 property string companionId: "doc1"
 property string picked: ""
 property bool dismissed: false
 property var bridge: ({documents: Array.from({length:40}, (_,i)=>({id:"doc"+i,title:"A notebook with a meaningful title "+i,isPdf:false}))})
 function dismissChooser() { dismissed=true }
 function pick(id) { picked=id }
 function detach() { companionId="" }
 ${popup}
 Image { id: icon; source: "${icon}"; width: 32; height: 32 }
 TestCase { name: "CompanionPicker"; when: windowShown
   function test_layout_and_selection() {
     verify(pickerCard.x > 60); verify(pickerCard.y > 60)
     compare(recentList.count,40); verify(recentList.contentHeight > recentList.height)
     mouseClick(recentList,100,30); compare(host.picked,"doc0")
     mouseClick(host,10,10); verify(host.dismissed)
     tryCompare(icon,"status",Image.Ready)
   }
 }
}
`);
execFileSync('qmltestrunner',['-input','build/pilot-picker-test'],{env:{...process.env,QT_QPA_PLATFORM:'offscreen',QT_QUICK_BACKEND:'software'},stdio:'inherit'});
