#!/usr/bin/env python3
"""Read-only verification of locally copied, exact disposable trial notebooks.

Run with: uv run --with rmscene==0.8.0 python ops/verify-disposable-ink.py DIR
DIR contains probe.log and documents/{UUID.metadata, UUID.content, UUID/*.rm}.
Never opens a tablet path, writes notebook contents, or accepts arbitrary IDs.
"""
import hashlib
import json
import math
from pathlib import Path
import re
import sys

from rmscene import SceneLineItemBlock, read_blocks
from rmscene.scene_stream import UnreadableBlock

UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
NUMBER = r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?"


def verify(directory):
    root = Path(directory).resolve()
    log = re.sub(r"\x1b\[[0-9;]*m", "", (root / "probe.log").read_text())
    assert "Companion probe: FAILED" not in log, "Native test failed"
    assert "Companion probe: fixed ink submissions completed; panes=2; durable=unverified" in log
    created = re.findall(r"created disposable IDs (" + UUID + r") (" + UUID + r")", log)
    armed = re.findall(r"gate open; size=1620x2160; docs=(" + UUID + r"),(" + UUID + r")", log)
    assert len(created) == len(armed) == 1 and created == armed, "Disposable identity receipt mismatch"
    assert created[0][0] != created[0][1]
    reports = []
    for pane, document_id in enumerate(created[0]):
        expected = re.findall(r"submitted pane=" + str(pane) + r"; points=(\d+); bounds=(" + ",".join([NUMBER]*4) + r")", log)
        assert len(expected) == 1, "Exactly one native submission required per pane"
        count, raw_bounds = expected[0]
        bounds = [float(value) for value in raw_bounds.split(",")]
        assert len(bounds) == 4 and all(map(math.isfinite, bounds))
        assert all(v > 0 for v in bounds[2:])
        directory = root / "documents" / document_id
        metadata = json.loads(directory.with_suffix(".metadata").read_text())
        label = "Companion test " + ("Reference " if pane == 0 else "Notes ")
        assert metadata["visibleName"].startswith(label), "Not a labelled disposable notebook"
        assert directory.is_dir() and not directory.is_symlink()
        files = list(directory.glob("*.rm"))
        assert len(files) == 1, "Expected one saved native page in each new notebook"
        page = files[0]
        assert re.fullmatch(UUID + r"\.rm", page.name) and not page.is_symlink()
        with page.open("rb") as stream:
            blocks = list(read_blocks(stream))
        assert not any(isinstance(block, UnreadableBlock) for block in blocks), "Parser could not account for all blocks"
        lines = [block.item.value for block in blocks if isinstance(block, SceneLineItemBlock) and block.item.value is not None]
        assert len(lines) == 1, "Expected one persisted stroke, with no duplicate or foreign ink"
        points = lines[0].points
        native_count = int(count)
        # Native controller serialization may change the point representation.
        # Verify the saved stroke's endpoints/shape, not byte-identical sampling.
        # Report counts explicitly; this is NOT exact sample-preservation proof.
        assert 2 <= len(points) <= native_count <= 500, "Unexpected native/persisted sample counts"
        assert all(math.isfinite(p.x) and math.isfinite(p.y) for p in points)
        xs, ys = [p.x for p in points], [p.y for p in points]
        saved = [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]
        assert all(abs(a - b) <= 5 for a, b in zip(saved, bounds)), "Saved coordinates disagree with native submission"
        # Two diagonal interior lines are deliberate: an upper-pane copy in the
        # lower document or a translation error must not pass from count alone.
        dx, dy = xs[-1] - xs[0], ys[-1] - ys[0]
        length = math.hypot(dx, dy)
        assert length > 1
        deviation = max(abs((p.x - xs[0]) * dy - (p.y - ys[0]) * dx) / length for p in points)
        assert deviation <= 10, "Saved stroke deviates from the fixed straight-line input"
        reports.append({"pane": pane, "document": document_id, "page": page.stem,
                        "nativePoints": native_count, "savedPoints": len(points), "bounds": saved, "maxLineDeviation": deviation,
                        "unparsedMetadata": [{"block": type(b).__name__, "bytes": len(b.extra_data)} for b in blocks if b.extra_data],
                        "sha256": hashlib.sha256(page.read_bytes()).hexdigest()})
    return {"status": "two-disposable-stroke-shapes-persisted", "nativeReopenVerified": False,
            "exactSamplePreservationVerified": False,
            "visualClippingVerified": False, "releaseQualified": False, "panes": reports}


if __name__ == "__main__":
    assert len(sys.argv) == 2, "Provide one local trial receipt directory"
    print(json.dumps(verify(sys.argv[1]), indent=2))
