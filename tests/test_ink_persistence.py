"""Synthetic local-file fixtures only. These bytes are never sent to a tablet."""
import json
from pathlib import Path
import runpy
import tempfile
import unittest

from rmscene import SceneLineItemBlock, write_blocks
from rmscene.crdt_sequence import CrdtSequenceItem
from rmscene.scene_items import Line, Pen, PenColor, Point
from rmscene.tagged_block_common import CrdtId

verify = runpy.run_path("ops/verify-disposable-ink.py")["verify"]
IDS = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"]
PAGE = "33333333-3333-4333-8333-333333333333"


class PersistenceVerifierTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="companion-saved-fixture-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.log = self.root / "probe.log"
        self.log.write_text(
            "Companion probe: created disposable IDs " + " ".join(IDS) + "\n"
            "Companion ink: gate open; size=1620x2160; docs=" + ",".join(IDS) + "\n"
            "Companion ink: submitted pane=0; points=3; bounds=10,20,300,50\n"
            "Companion ink: submitted pane=1; points=3; bounds=10,20,300,50\n"
            "Companion probe: fixed ink submissions completed; panes=2; durable=unverified\n")
        for i, document_id in enumerate(IDS):
            directory = self.root / "documents" / document_id
            directory.mkdir(parents=True)
            directory.with_suffix(".metadata").write_text(json.dumps({"visibleName": "Companion test " + ("Reference " if i == 0 else "Notes ") + "fixture"}))
            self.write_lines(i)

    def write_lines(self, pane, count=1, bend=0, endpoints_only=False):
        points = [Point(10, 20, 1, 0, 4, 100), Point(160, 45 + bend, 1, 0, 4, 100), Point(310, 70, 1, 0, 4, 100)]
        if endpoints_only:
            points = [points[0], points[-1]]
        line = Line(PenColor.BLACK, Pen.FINELINER_2, points, 1, 0)
        blocks = [SceneLineItemBlock(CrdtId(0, 1), CrdtSequenceItem(CrdtId(1, 2+i), CrdtId(0, 0), CrdtId(0, 0), 0, line)) for i in range(count)]
        with (self.root / "documents" / IDS[pane] / (PAGE + ".rm")).open("wb") as stream:
            write_blocks(stream, blocks)

    def test_roundtrip_persistence_is_not_release_or_visual_acceptance(self):
        receipt = verify(self.root)
        self.assertEqual(receipt["status"], "two-disposable-stroke-shapes-persisted")
        self.assertEqual(len(receipt["panes"]), 2)
        self.assertFalse(receipt["releaseQualified"])
        self.assertFalse(receipt["nativeReopenVerified"])

    def test_duplicate_or_missing_ink_refused(self):
        for count in [0, 2]:
            self.write_lines(1, count=count)
            with self.assertRaises(AssertionError):
                verify(self.root)

    def test_point_contamination_refused(self):
        self.write_lines(0, bend=20)
        with self.assertRaisesRegex(AssertionError, "deviates"):
            verify(self.root)

    def test_native_failure_or_wrong_point_count_refused(self):
        original = self.log.read_text()
        for data in [original + "Companion probe: FAILED mapping\n", original.replace("points=3", "points=2")]:
            self.log.write_text(data)
            with self.assertRaises(AssertionError):
                verify(self.root)

    def test_unlabelled_personal_note_refused(self):
        (self.root / "documents" / (IDS[1] + ".metadata")).write_text(json.dumps({"visibleName": "Personal notebook"}))
        with self.assertRaisesRegex(AssertionError, "labelled disposable"):
            verify(self.root)

    def test_native_log_color_and_source_location_are_not_bounds(self):
        self.log.write_text("\n".join("04:36:00.000 \x1b[02;32mqml " + line + "\x1b[0;37m (probe qrc:/test.qml:123)\x1b[0m" for line in self.log.read_text().splitlines()))
        self.assertEqual(verify(self.root)["status"], "two-disposable-stroke-shapes-persisted")

    def test_different_saved_sampling_preserves_shape_without_claiming_exact_samples(self):
        self.write_lines(1, endpoints_only=True)
        receipt = verify(self.root)
        self.assertEqual(receipt["panes"][1]["nativePoints"], 3)
        self.assertEqual(receipt["panes"][1]["savedPoints"], 2)
        self.assertFalse(receipt["exactSamplePreservationVerified"])

    def test_lost_endpoint_does_not_pass_sampling_tolerance(self):
        self.log.write_text(self.log.read_text().replace("bounds=10,20,300,50", "bounds=20,20,290,50"))
        with self.assertRaisesRegex(AssertionError, "coordinates"):
            verify(self.root)


if __name__ == "__main__":
    unittest.main()
