// Versioned UI metadata only. Never stores notebook content or credentials.
function isId(value) { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
function empty() { return { version: 1, pairs: {} }; }
function parse(text) {
    if (typeof text !== "string" || text.length > 262144) throw new Error("Pair metadata is too large");
    var data = JSON.parse(text || '{"version":1,"pairs":{}}');
    if (data.version !== 1 || !data.pairs || typeof data.pairs !== "object" || Array.isArray(data.pairs)) throw new Error("Unsupported pair metadata");
    var keys = Object.keys(data.pairs);
    if (keys.length > 256) throw new Error("Too many notebook pairs");
    var result = empty();
    keys.forEach(function(primary) {
        var p = data.pairs[primary];
        if (!isId(primary) || !p || !isId(p.companion) || primary === p.companion
            || typeof p.ratio !== "number" || !isFinite(p.ratio) || p.ratio < 0.1 || p.ratio > 0.85
            || (p.pageId !== "" && !isId(p.pageId))
            || (p.layout !== undefined && p.layout !== "corner")) throw new Error("Invalid notebook pair");
        result.pairs[primary] = { companion: p.companion, ratio: p.ratio, pageId: p.pageId };
        if (p.layout === "corner") result.pairs[primary].layout = "corner";
    });
    return result;
}
function set(data, primary, companion, ratio, pageId, layout) {
    var copy = parse(JSON.stringify(data));
    copy.pairs[primary] = { companion: companion, ratio: ratio, pageId: pageId || "" };
    if (layout === "corner") copy.pairs[primary].layout = "corner";
    return parse(JSON.stringify(copy));
}
function remove(data, primary) {
    var copy = parse(JSON.stringify(data)); delete copy.pairs[primary]; return copy;
}
if (typeof module !== "undefined") module.exports = {isId:isId, empty:empty, parse:parse, set:set, remove:remove};
