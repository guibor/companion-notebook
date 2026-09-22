// Shared Qt Quick / Node controller. No native document or filesystem access.
function create(width, height) {
    return { width: width, height: height, header: 48, minimumMain: 120,
        primary: "", companion: "", pairs: Object.create(null), reveal: 0, lastReveal: height / 3, ratio: 1 / 3,
        focus: "main", busy: null, portrait: height >= width };
}
function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
function maximum(s) { return Math.max(0, s.height - s.minimumMain); }
function top(s) { return s.height - (s.portrait && s.companion ? s.reveal : 0); }
function available(s, pane) {
    return pane === "main" || (pane === "companion" && s.portrait && s.companion && s.reveal > s.header);
}
function pair(s) { return s.pairs[s.primary]; }
function checkpoint(s) {
    var p = pair(s);
    if (p) { p.reveal = s.lastReveal; p.ratio = s.ratio; }
}
function openPrimary(s, id) {
    if (s.busy || !id) return false;
    checkpoint(s);
    s.primary = id;
    var p = pair(s);
    s.companion = p ? p.id : "";
    s.ratio = p ? p.ratio : 1 / 3;
    s.lastReveal = clamp(s.height * s.ratio, s.header * 2, maximum(s));
    s.reveal = 0;
    s.focus = "main";
    return true;
}
function attach(s, id) {
    if (s.busy || !s.primary || !id || id === s.primary || !s.portrait) return false;
    s.pairs[s.primary] = { id: id, reveal: s.height / 3, ratio: 1 / 3, mainY: 0, companionY: 0 };
    s.companion = id;
    s.ratio = 1 / 3;
    s.lastReveal = clamp(s.height / 3, s.header * 2, maximum(s));
    s.reveal = s.lastReveal;
    s.focus = "main";
    return true;
}
function reveal(s) {
    if (s.busy || !s.companion || !s.portrait) return false;
    s.reveal = clamp(s.lastReveal, s.header * 2, maximum(s));
    return true;
}
function tuck(s) {
    if (s.busy) return false;
    if (s.reveal > s.header * 2) s.lastReveal = s.reveal;
    s.reveal = 0;
    s.focus = "main";
    checkpoint(s);
    return true;
}
function detach(s) {
    if (s.busy) return false;
    delete s.pairs[s.primary];
    s.companion = ""; s.reveal = 0; s.focus = "main";
    return true;
}
function select(s, pane) {
    if (s.busy || !available(s, pane)) return false;
    s.focus = pane;
    return true;
}
function chooseSize(s, ratio) {
    if (s.busy || !s.companion || !s.portrait || ![1/3, 1/2, 2/3].includes(ratio)) return false;
    s.ratio = ratio;
    s.lastReveal = clamp(s.height * ratio, s.header * 2, maximum(s));
    if (s.reveal > 0) s.reveal = s.lastReveal;
    checkpoint(s);
    return true;
}
function hit(s, x, y) {
    if (x < 0 || x >= s.width || y < 0 || y >= s.height) return "";
    if (s.portrait && s.companion && s.reveal > 0 && y >= top(s))
        return y < top(s) + s.header ? "handle" : "companion";
    return "main";
}
function beginStroke(s, x, y) {
    if (s.busy || !s.primary) return "blocked";
    var pane = hit(s, x, y);
    if (!available(s, pane)) return "blocked";
    // Pull out and write: the first point selects the owner AND starts ink.
    s.focus = pane;
    s.busy = { kind: "stroke", pane: pane, document: pane === "main" ? s.primary : s.companion,
        originY: pane === "main" ? 0 : top(s) + s.header };
    return "writing";
}
function strokePoint(s, x, y) {
    if (!s.busy || s.busy.kind !== "stroke" || hit(s, x, y) !== s.busy.pane) return null;
    return { pane: s.busy.pane, document: s.busy.document, x: x, y: y - s.busy.originY };
}
function endStroke(s) {
    if (!s.busy || s.busy.kind !== "stroke") return false;
    s.busy = null; return true;
}
function beginScroll(s, pane) {
    if (s.busy || !available(s, pane)) return false;
    s.busy = { kind: "scroll", pane: pane }; return true;
}
function endScroll(s) {
    if (!s.busy || s.busy.kind !== "scroll") return false;
    s.busy = null; return true;
}
function saveScroll(s, pane, y) {
    var p = pair(s);
    if (!p || !Number.isFinite(y) || (pane !== "main" && pane !== "companion")) return false;
    p[pane + "Y"] = Math.max(0, y); return true;
}
function scroll(s, pane) { var p = pair(s); return p ? p[pane + "Y"] : 0; }
function resize(s, width, height) {
    if (s.busy || width <= 0 || height <= 0) return false;
    s.width = width; s.height = height; s.portrait = height >= width;
    s.lastReveal = clamp(height * s.ratio, s.header * 2, maximum(s));
    s.reveal = s.portrait && s.reveal > 0 ? s.lastReveal : 0;
    if (!s.portrait) s.focus = "main";
    return true;
}
if (typeof module !== "undefined") module.exports = {
    create: create, top: top, maximum: maximum, openPrimary: openPrimary, attach: attach,
    reveal: reveal, tuck: tuck, detach: detach, select: select, chooseSize: chooseSize,
    hit: hit, beginStroke: beginStroke, strokePoint: strokePoint,
    endStroke: endStroke, beginScroll: beginScroll, endScroll: endScroll,
    saveScroll: saveScroll, scroll: scroll, resize: resize
};
