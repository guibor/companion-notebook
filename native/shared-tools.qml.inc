// One visible toolbar; copy only writing settings, never document/controller state.
readonly property var cnToolbarController: cnHost && cnHost.paired ? cnHost.activeView.sceneController : sceneController
function cnToolState() {
    function pen(p) {
        return {tool:p.tool, color:p.color, colorCode:p.colorCode, thickness:p.thickness,
            snapHighlighterToText:p.snapHighlighterToText}
    }
    return {primary:pen(documentViewTools.primaryPen), secondary:pen(documentViewTools.secondaryPen),
        eraser:pen(documentViewTools.eraserPen), active:documentViewTools.activeTool,
        selectionMode:root.selectionToolMode}
}
function cnApplyToolState(state) {
    if (!cnHost || !cnHost.pageMayMutate(root)) throw new Error("shared tools outside native park")
    function apply(p, data) {
        for (var k of ["tool", "color", "colorCode", "thickness", "snapHighlighterToText"])
            if (data[k] !== undefined && p[k] !== data[k]) p[k] = data[k]
    }
    apply(documentViewTools.primaryPen, state.primary)
    apply(documentViewTools.secondaryPen, state.secondary)
    apply(documentViewTools.eraserPen, state.eraser)
    if (root.selectionToolMode !== state.selectionMode) root.selectionToolMode = state.selectionMode
    if (documentViewTools.activeTool !== state.active) documentViewTools.activeTool = state.active
}
