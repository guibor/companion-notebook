// Exact 3.30 toolbar migration. Native park/edit ownership is unchanged.
import assert from 'node:assert/strict';
export function portPro330Toolbar(q) {
 // DocumentView gained a required NavigationManager in 3.30. Match the
 // stock primary view's dependency injection for each dynamic secondary.
 const secondary='id: cnView\n';
 assert.equal(q.split(secondary).length,2,'Expected one secondary DocumentView');
 q=q.replace(secondary,secondary+'        navigationManager: root.navigationManager\n');
 // The extracted 3.30 viewport bindings can submit several intermediate
 // layouts during a tap-open/close. Use the existing animation waveform only
 // during the already-parked layout phases, then return to stock cleanup.
 // Never hold it while idle, choosing, suspended, failed, or draining input.
 const redraw='visible: !!cnHost && cnHost.dragging';
 assert.equal(q.split(redraw).length,2,'Expected one panel redraw scope');
 q=q.replace(redraw,'visible: !!cnHost && (cnHost.dragging || cnHost.transitionPhase === "loading" || cnHost.transitionPhase === "settling" || cnHost.transitionPhase === "publishing")');
 const owner=`function cnToolbarOwner() {
    var container = Toolbar.geometry.container
    if (!container) return null
    for (var i = 0; i < container.children.length; ++i) {
        var item = container.children[i]
        if (typeof item.cnPublishToolbarCapacity === "function") return item
    }
    return null
}`;
 q=q.replaceAll('type: ToolbarTool.Type.ToolbarButton', 'group: ToolbarModel.ToolGroup.Secondary')
    .replaceAll('type: ToolbarTool.Type.FoldoutButton', 'group: ToolbarModel.ToolGroup.Utility')
    .replaceAll('implicitlySelected:', 'highlighted:')
    .replaceAll('ToolbarTool.Type.', 'ToolbarToolItem.Type.')
    .replaceAll('sceneView && !root.adjustViewActive', 'root.sceneView && !root.adjustViewActive')
    .replaceAll('sceneView && root.cnInkAllowed', 'root.sceneView && root.cnInkAllowed')
    .replaceAll('toolbar.selectedPen','toolbar.activePen')
    .replaceAll('onSelectedPenChanged','onActivePenChanged')
    .replaceAll('const cnSelectedPen = selectedPen;', 'const cnSelectedPen = activePen;')
    .replaceAll('documentViewTools.activeTool = selectedPen.penToolType;', 'documentViewTools.activeTool = activePen.penToolType;')
    .replaceAll('Item#_uiContainer > Toolbar#toolbar','Item#_uiContainer > ToolbarItem#toolbar');
 // Preserve the complete exact-stock surface binding while adding the same
 // paired-input/geometry gates as the previous two-step rebuild. In 3.30 the
 // stock expression qualifies both sceneView and strokeHandler with root.
 const first=/REBUILD handler\s+LOCATE BEFORE ALL\s+REPLACE \{ root\.sceneView && !root\.adjustViewActive \} WITH \{ root\.sceneView && root\.cnInkAllowed && !root\.cnLayoutBusy && !root\.adjustViewActive \}\s+END REBUILD/;
 assert(first.test(q));
 q=q.replace(first,`REMOVE handler
 LOCATE BEFORE ALL
 INSERT { handler: root.sceneView && (root.cnGeometryAttached || (root.cnInkAllowed && !root.cnLayoutBusy)) && !root.adjustViewActive ? root.strokeHandler : null }`);
 const second=/REBUILD handler\s+LOCATE BEFORE ALL\s+REPLACE \{ root\.cnInkAllowed && !root\.cnLayoutBusy \} WITH \{ \(root\.cnGeometryAttached \|\| \(root\.cnInkAllowed && !root\.cnLayoutBusy\)\) \}\s+END REBUILD/;
 assert(second.test(q)); q=q.replace(second,'');
 // 3.30 extracted rendering bindings and the pen handler into dedicated
 // components. Propagate the same gates through explicit instance properties.
 const minimal=/TRAVERSE Binding\[\.value~minimalUpdates\][\s\S]*?END TRAVERSE/;
 assert(minimal.test(q)); const minimalBlock=q.match(minimal)[0]; q=q.replace(minimal,'');
 q=q.replace('REBUILD availableSceneRect','REBUILD calculateAvailableSceneRect');
 const framebuffer=/AFFECT \/qml\/device\/view\/documentview\/DeviceSceneView.qml\n REBUILD FocusScope#root\n([\s\S]*?value: EPFramebuffer[\s\S]*?)END AFFECT/;
 assert(framebuffer.test(q));
 q=q.replace(framebuffer,(_,body)=>'AFFECT /qml/device/view/documentview/ViewportBindings.qml\n REBUILD Item#root\n'+body+'END AFFECT');
 const gesture=/TRAVERSE ScenePenInputHandler#strokeHandler\s+(REBUILD gestureMode[\s\S]*?END REBUILD)\s+END TRAVERSE/;
 assert(gesture.test(q)); const gestureBlock=q.match(gesture)[0];q=q.replace(gesture,'');
 q+=`AFFECT /qml/device/view/documentview/DeviceSceneView.qml
TRAVERSE FocusScope#root
TRAVERSE ViewportBindings#viewportBindings
LOCATE BEFORE ALL
INSERT { cnPaired: root.cnPaired; cnQuickPadCompositing: root.cnQuickPadCompositing }
END TRAVERSE
TRAVERSE StrokeInput#strokeInputCoordinator
LOCATE BEFORE ALL
INSERT { cnPaired: root.cnPaired }
END TRAVERSE
END TRAVERSE
END AFFECT
AFFECT /qml/device/view/documentview/ViewportBindings.qml
TRAVERSE Item#root
LOCATE BEFORE ALL
INSERT { property bool cnPaired: false; property bool cnQuickPadCompositing: false }
${minimalBlock}
END TRAVERSE
END AFFECT
AFFECT /qml/device/view/documentview/StrokeInput.qml
TRAVERSE Item#root
LOCATE BEFORE ALL
INSERT { property bool cnPaired: false }
${gestureBlock}
END TRAVERSE
END AFFECT
`;
 q=q.replace(/AFFECT \/qt\/qml\/xofm\/libs\/toolbar\/qml\/Toolbar\.qml\n([\s\S]*?)END AFFECT/g,(_,body)=>'AFFECT /qt/qml/xofm/libs/toolbar/qml/ToolbarItem.qml\n'+body.replace('TRAVERSE FocusScope#root','TRAVERSE Toolbar#root')+'END AFFECT');
 const groups={penToolSelected:'pens',penColorSelected:'pens',penThicknessSelected:'pens',highlighterSnapToTextSelected:'pens',eraserToolSelected:'eraser',eraserThicknessSelected:'eraser',eraseAllSelected:'eraser',selectionToolModeSelected:'selection',undoSelected:'history',redoSelected:'history'};
 q=q.replace(/AFFECT \/qml\/device\/view\/documentview\/DocumentView.qml\n([\s\S]*?)END AFFECT/g,(_,body)=>{
  for(const [signal,group] of Object.entries(groups)) {
   const handler='on'+signal[0].toUpperCase()+signal.slice(1);
   if(!body.includes('REBUILD '+handler+'\n'))continue;
   body=body.replace('TRAVERSE Item#_uiContainer > ToolbarItem#toolbar','TRAVERSE Item#_uiContainer > ToolbarItem#toolbar > Toolbar.'+group)
    .replaceAll('toolbar.'+signal+'(', 'toolbar.Toolbar.'+group+'.'+signal+'(');
   if(signal==='eraseAllSelected')body=body.replaceAll('closeFoldout();','toolbar.closeFoldout();');
   if(signal==='eraserThicknessSelected')body=body.replaceAll('thickness = t;','thickness = thickness;').replaceAll('Selected(t);','Selected(thickness);');
   if(signal==='selectionToolModeSelected') {
    body=body.replace('REPLACE { root.selectionToolMode = mode; }','REPLACE { sceneView.endItemSelection(); }')
     .replace('\nroot.selectionToolMode = mode;','\nsceneView.endItemSelection();');
   }
  }
  if(body.includes('REBUILD undoEnabled'))body=body.replace('TRAVERSE Item#_uiContainer > ToolbarItem#toolbar','TRAVERSE Item#_uiContainer > ToolbarItem#toolbar > Toolbar.history');
  return 'AFFECT /qml/device/view/documentview/DocumentView.qml\n'+body+'END AFFECT';
 });
 // These native controls now receive context through attached groups. Guard
 // their outer pressed handlers before any pen or selection state is changed.
 q=q.replace(/AFFECT \/qt\/qml\/xofm\/libs\/toolbar\/qml\/(WritingTool|EraserMenu|SelectionButton).qml\n([\s\S]*?)END AFFECT/g,(_,type,body)=>{
  // ensureSelection was removed from stock WritingTool in 3.30; keep the
  // guarded outer pressed/request handlers, not a phantom rebuild target.
  if(body.includes('REBUILD ensureSelection'))return '';
  body=body.replaceAll('root.toolbar.activePen','Toolbar.pens.activePen').replaceAll('root.toolbar.cnDocumentViewOwner','(root.cnToolbarOwner() ? root.cnToolbarOwner().cnDocumentViewOwner : null)');
  return 'AFFECT /qt/qml/xofm/libs/toolbar/qml/'+type+'.qml\n'+body+'END AFFECT';
 });
 for(const type of ['WritingTool','EraserMenu','SelectionButton','SettingsMenu','ToolLoader']) {
  q+=`AFFECT /qt/qml/xofm/libs/toolbar/qml/${type}.qml\nTRAVERSE ${type==='ToolLoader'?'Loader':type==='SettingsMenu'?'ToolbarTool':'PenTool'}#root\nLOCATE BEFORE ALL\nINSERT { ${owner} }\nEND TRAVERSE\nEND AFFECT\n`;
 }
 // The C++ ToolbarItem no longer carries tool context as ordinary properties.
 q=q.replaceAll('root.documentType','Toolbar.document.type')
    .replaceAll('toolbar: root.toolbar;', '').replaceAll('toolbar: root;','')
    .replaceAll('toolbar: root.toolbar\n','').replaceAll('toolbar: root\n','')
    .replaceAll('root.toolbar.closeFoldout()', 'root.cnToolbarOwner().closeFoldout()');
 // Replace the old capacity and ToolLoader blocks, preserving primary-only
 // provider writes and deferred invalidation through native park transitions.
 q=q.replace(/AFFECT \/qt\/qml\/xofm\/libs\/toolbar\/qml\/ToolbarItem.qml\n([\s\S]*?)END AFFECT/g,(whole,body)=>{
  if(!body.includes('function cnPublishToolbarCapacity'))return whole;
  const start=body.indexOf('REBUILD onShowableToolsCountChanged');assert(start>0);
  body=body.slice(0,start)+`REMOVE onShowableToolsCountChanged\nLOCATE BEFORE ALL\nINSERT { onShowableToolsCountChanged: cnPublishToolbarCapacity() }\n END TRAVERSE\n`;
  return 'AFFECT /qt/qml/xofm/libs/toolbar/qml/ToolbarItem.qml\n'+body+'END AFFECT';
 });
 q=q.replace(/AFFECT \/qt\/qml\/xofm\/libs\/toolbar\/qml\/ToolLoader.qml\n([\s\S]*?)END AFFECT/g,(whole,body)=>{
  if(!body.includes('function cnSyncToolVisibility'))return whole;
  return `AFFECT /qt/qml/xofm/libs/toolbar/qml/ToolLoader.qml
TRAVERSE Loader#root
REBUILD onLoaded
LOCATE BEFORE ALL
REPLACE { root.model.shown = item.shouldShow; root.updateToolbarTools(); } WITH { root.cnSyncToolVisibility(); }
END REBUILD
TRAVERSE Connections
REBUILD onUpdateShown
LOCATE BEFORE ALL
REPLACE { root.model.shown = shown; root.updateToolbarTools(); } WITH { root.cnSyncToolVisibility(); }
END REBUILD
END TRAVERSE
REMOVE updateToolbarTools
LOCATE BEFORE ALL
INSERT {
 function updateToolbarTools() { var owner = cnToolbarOwner(); if (owner) owner.cnPublishToolbarCapacity(true) }
 function cnSyncToolVisibility() {
    var toolbar = cnToolbarOwner()
    var owner = toolbar ? toolbar.cnDocumentViewOwner : null
    if (!owner || owner.cnSecondary || !root.item) return
    var shown = root.item.shouldShow
    if (root.model.shown === shown) return
    root.model.shown = shown
    toolbar.cnPublishToolbarCapacity(true)
 }
 Connections {
    target: root.cnToolbarOwner()
    function onCnDocumentViewOwnerChanged() { root.cnSyncToolVisibility() }
 }
}
END TRAVERSE
END AFFECT`;
 });
 assert(!q.includes('Toolbar.qml')&&!q.includes('toolbar.selectedPen'));
 return q;
}

export function verifyPro330SecondaryRequirements(main, stockDocument) {
 const secondary=main.match(/DocumentView\s*\{\s*id:\s*cnView\b([\s\S]*?)onDocumentFailedToLoad\s*:/);
 assert(secondary,'Composed secondary DocumentView missing');
 const required=[...stockDocument.matchAll(/\brequired\s+property\s+\w+\s+(\w+)/g)].map(m=>m[1]);
 assert(required.includes('navigationManager'),'Expected exact 3.30 required-property surface');
 for(const name of required) assert.match(secondary[1],new RegExp('\\b'+name+'\\s*:'),
  'Secondary DocumentView must initialize stock required property '+name);
 assert.match(secondary[1],/navigationManager:\s*root\.navigationManager\b/);
 return required.length;
}
