#!/usr/bin/env python3
"""Read-only verification of locally copied, exact disposable trial notebooks.

Run with: uv run --with rmscene==0.8.0 python ops/verify-disposable-ink.py DIR
DIR contains probe.log and documents/{UUID.metadata, UUID.content, UUID/*.rm}.
Never opens a tablet path, writes notebook contents, or accepts arbitrary IDs.
"""
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import sys

from rmscene import SceneLineItemBlock, read_blocks
from rmscene.scene_stream import UnreadableBlock

UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
NUMBER = r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?"


def stroke_report(line, native_count, bounds):
    points = line.points
    # Native serialization simplifies samples. Check shape, not exact sampling.
    assert 2 <= len(points) <= native_count <= 500, "Unexpected native/persisted sample counts"
    assert all(math.isfinite(p.x) and math.isfinite(p.y) for p in points)
    xs, ys = [p.x for p in points], [p.y for p in points]
    saved = [min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)]
    # Exact3.29 Line::boundingRect is a conservative padded point AABB, not
    # a centerline or exact brush hull. Qualified tool15 uses factor2 and
    # pad=(float(thickness)*2+2)/2. Restrict this diagnostic to the two pen
    # thicknesses actually exercised; unknown tools must not silently pass.
    assert int(line.tool) == 15, "Unqualified native bounding-box tool"
    assert line.thickness_scale in (1.0, 2.0), "Unqualified native bounding-box thickness"
    padding = line.thickness_scale + 1.0
    padded = [saved[0] - padding, saved[1] - padding,
              saved[2] + 2 * padding, saved[3] + 2 * padding]
    assert all(abs(a - b) <= 5 for a, b in zip(padded, bounds)), "Saved coordinates disagree with native submission"
    dx, dy = xs[-1] - xs[0], ys[-1] - ys[0]
    length = math.hypot(dx, dy)
    assert length > 1
    deviation = max(abs((p.x - xs[0]) * dy - (p.y - ys[0]) * dx) / length for p in points)
    assert deviation <= 10, "Saved stroke deviates from the fixed straight-line input"
    return {"nativePoints": native_count, "savedPoints": len(points), "bounds": saved,
            "nativeBoundsReconstructed": padded, "nativeBoundsPadding": padding,
            "boundsSemantics": "exact-3.29-ballpoint-15-conservative-padded-aabb",
            "maxLineDeviation": deviation}


def verify(directory):
    root = Path(directory).resolve()
    log = re.sub(r"\x1b\[[0-9;]*m", "", (root / "probe.log").read_text())
    assert "Companion probe: FAILED" not in log, "Native test failed"
    fixed_success = "Companion probe: fixed ink submissions completed; panes=2; durable=unverified"
    retirement_success = "Companion probe: retirement ink submissions completed; panes=2; strokes=4; durable=unverified"
    admission_success = "Companion probe: admission ink submissions completed; panes=2; strokes=4; durable=unverified"
    retirement = retirement_success in log
    admission = admission_success in log
    assert sum((retirement, admission, fixed_success in log)) == 1, "Require exactly one successful profile"
    multiple_rounds = retirement or admission
    rounds = 2 if multiple_rounds else 1
    if retirement:
        for receipt in ["Companion retirement: both native handlers retired; generation=1",
                        "Companion retirement: live geometry moved; steps=12;",
                        "Companion retirement: round=2; height=1320"]:
            assert log.count(receipt) == 1, "Missing or duplicate native retirement/movement receipt"
    created_matches = list(re.finditer(r"created disposable IDs (" + UUID + r") (" + UUID + r")", log))
    armed_matches = list(re.finditer(r"gate open; size=1620x2160; docs=(" + UUID + r"),(" + UUID + r")", log))
    created = [match.groups() for match in created_matches]
    armed = [match.groups() for match in armed_matches]
    assert len(created) == 1 and len(armed) == rounds and all(pair == created[0] for pair in armed), "Disposable identity receipt mismatch"
    assert created[0][0] != created[0][1]
    admission_submissions = []
    if admission:
        # These are receipts for this bounded diagnostic, not general input or
        # release qualification. Do not relabel retirement logs as admission.
        def unique_position(marker):
            matches = list(re.finditer(re.escape(marker) + r"(?=\s|$)", log))
            assert log.count(marker) == 1 and len(matches) == 1, "Missing or duplicate admission receipt: " + marker
            return matches[0].start()

        startup = unique_position("Companion admission: cold native worker roundtrip passed")
        requested = unique_position("Companion admission: transition requested during second stroke")
        parked = unique_position("Companion admission: drained during stroke; submissions=2; generation=1")
        reopened = unique_position("Companion admission: round=2; height=1440; fresh-candidates=true")
        closed = unique_position("Companion ink: gate closed")
        completed = unique_position(admission_success)
        admission_submissions = list(re.finditer(
            r"Companion ink: submitted pane=([01]); points=(\d+); bounds=("
            + ",".join([NUMBER] * 4) + r"); round=([12])(?=\s|$)", log))
        assert len(admission_submissions) == 4 and log.count("Companion ink: submitted ") == 4, "Require exactly four valid admission submissions"
        assert [(m[1], m[4]) for m in admission_submissions] == [("0", "1"), ("1", "1"), ("0", "2"), ("1", "2")], "Unexpected admission pane/round order"
        first, second, third, fourth = [m.start() for m in admission_submissions]
        assert (startup < created_matches[0].start() < armed_matches[0].start()
                < first < requested < second < parked < reopened
                < armed_matches[1].start() < third < fourth < closed < completed), "Admission handoff receipts are out of order"
    reports = []
    for pane, document_id in enumerate(created[0]):
        pattern = r"submitted pane=" + str(pane) + r"; points=(\d+); bounds=(" + ",".join([NUMBER]*4) + r")"
        expected = ([m.groups()[1:] for m in admission_submissions if int(m[1]) == pane]
                    if admission else re.findall(pattern + (r"; round=([12])" if retirement else ""), log))
        assert len(expected) == rounds, "Unexpected native submission count per pane"
        submissions = []
        for index, row in enumerate(expected):
            count, raw_bounds = row[:2]
            if multiple_rounds:
                assert int(row[2]) == index + 1, "Missing/duplicate native round"
            bounds = [float(value) for value in raw_bounds.split(",")]
            assert len(bounds) == 4 and all(map(math.isfinite, bounds))
            assert all(v > 0 for v in bounds[2:])
            submissions.append((int(count), bounds))
        if multiple_rounds:
            assert any(abs(a - b) > 20 for a, b in zip(submissions[0][1], submissions[1][1])), "Rounds must be geometrically distinguishable"
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
        assert len(lines) == rounds, "Unexpected persisted stroke count, duplicate or foreign ink"
        matched = None
        last_error = "no one-to-one match"
        # CRDT serialization order is not assumed to be chronological. Require
        # an exact one-to-one geometric match to all native submissions.
        for order in itertools.permutations(lines):
            try:
                matched = [stroke_report(line, count, bounds)
                           for line, (count, bounds) in zip(order, submissions)]
                break
            except AssertionError as error:
                last_error = str(error)
                continue
        assert matched is not None, "Saved strokes disagree with native submission shapes: " + last_error
        report = {"pane": pane, "document": document_id, "page": page.stem,
                  "unparsedMetadata": [{"block": type(b).__name__, "bytes": len(b.extra_data)} for b in blocks if b.extra_data],
                  "sha256": hashlib.sha256(page.read_bytes()).hexdigest()}
        report.update({"strokes": matched} if multiple_rounds else matched[0])
        reports.append(report)
    status = ("four-disposable-stroke-shapes-persisted-after-admission" if admission
              else "four-disposable-stroke-shapes-persisted-after-retirement" if retirement
              else "two-disposable-stroke-shapes-persisted")
    return {"status": status, "nativeReopenVerified": False,
            "exactSamplePreservationVerified": False,
            "visualClippingVerified": False, "releaseQualified": False, "panes": reports}


if __name__ == "__main__":
    assert len(sys.argv) == 2, "Provide one local trial receipt directory"
    print(json.dumps(verify(sys.argv[1]), indent=2))
